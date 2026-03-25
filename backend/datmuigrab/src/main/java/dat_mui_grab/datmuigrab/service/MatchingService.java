package dat_mui_grab.datmuigrab.service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import dat_mui_grab.datmuigrab.entity.Driver;
import dat_mui_grab.datmuigrab.entity.DriverCompanyRegistration;
import dat_mui_grab.datmuigrab.entity.Ride;
import dat_mui_grab.datmuigrab.entity.enums.DriverOnlineStatus;
import dat_mui_grab.datmuigrab.entity.enums.RegistrationStatus;
import dat_mui_grab.datmuigrab.entity.enums.RideStatus;
import dat_mui_grab.datmuigrab.repository.DriverCompanyRegistrationRepository;
import dat_mui_grab.datmuigrab.repository.DriverRepository;
import dat_mui_grab.datmuigrab.repository.RideRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class MatchingService {

    private final DriverRepository driverRepository;
    private final DriverCompanyRegistrationRepository registrationRepository;
    private final RideRepository rideRepository;
    private final RedisService redisService;
    private final SimpMessagingTemplate messagingTemplate;

    @Async
    public void findAndNotifyDriver(Ride ride) {
        List<Driver> candidates = driverRepository.findAvailableDriversByCompanyId(
                ride.getCompany().getId()
        );
        
        log.info("findAndNotifyDriver called for rideId={}", ride.getId());

        if (candidates.isEmpty()) {
            log.info("Khong tim thay tai xe cho chuyen {}", ride.getId());
            return;
        }

        log.info("candidates(size={}): {}", candidates.size(), candidates);
        log.info("candidate driver ids: {}", candidates.stream().map(Driver::getId).collect(Collectors.toList()));
        log.info("ride: {}", ride);


        List<DriverWithDistance> ranked = rankDrivers(candidates, ride);
        log.info("ranked drivers(size={}): {}", ranked.size(), ranked);
        log.info("ranked driver details: {}", ranked.stream()
                .map(dwd -> "{driverId=" + dwd.getDriver().getId() + ", distanceKm=" + String.format("%.3f", dwd.getDistance()) + "}")
                .collect(Collectors.joining(", ")));
        for (DriverWithDistance dwd : ranked) {
            Driver driver = dwd.getDriver();
            log.info("targeted driver: {}", driver);
            log.info("targeted driverId={}, distanceKm={}", driver.getId(), String.format("%.3f", dwd.getDistance()));
            boolean locked = redisService.acquireDriverLock(driver.getId().toString());
            if (!locked) {
                log.info("driver {} is locked by another matcher, skip", driver.getId());
                continue;
            }

            log.info("acquired lock for driver {}", driver.getId());

            redisService.setPendingRideForDriver(driver.getId().toString(), ride.getId().toString());

            messagingTemplate.convertAndSend(
                    "/topic/driver/" + driver.getId() + "/new-ride",
                    ride.getId().toString()
            );

            log.info("Da gui yeu cau chuyen {} toi tai xe {}", ride.getId(), driver.getId());
            redisService.releaseDriverLock(driver.getId().toString());
            break;
        }
        log.info("__________________________________________________");
    }

    @Async
    public void tryMatchWhenDriverOnline(UUID driverId) {
        Driver driver = driverRepository.findById(driverId).orElse(null);
        if (driver == null || driver.getOnlineStatus() != DriverOnlineStatus.ONLINE) {
            return;
        }

        List<DriverCompanyRegistration> activeRegs = registrationRepository.findAllByDriverAndStatus(
                driver,
                RegistrationStatus.ACTIVE
        );

        for (DriverCompanyRegistration reg : activeRegs) {
            Ride searchingRide = rideRepository.findFirstByCompanyIdAndStatusOrderByCreatedAtAsc(
                    reg.getCompany().getId(),
                    RideStatus.SEARCHING
            ).orElse(null);

            if (searchingRide != null) {
                findAndNotifyDriver(searchingRide);
                break;
            }
        }
    }

    private List<DriverWithDistance> rankDrivers(List<Driver> drivers, Ride ride) {
        log.info("rankDrivers start: rideId={}, candidateCount={}", ride.getId(), drivers.size());

        if (ride.getPickupLat() == null || ride.getPickupLng() == null) {
            log.warn("rankDrivers stop: ride {} has null pickup coordinates lat={}, lng={}",
                    ride.getId(), ride.getPickupLat(), ride.getPickupLng());
            return new ArrayList<>();
        }

        double pickupLat = ride.getPickupLat().doubleValue();
        double pickupLng = ride.getPickupLng().doubleValue();
        log.info("rankDrivers pickup coordinates: lat={}, lng={}", pickupLat, pickupLng);

        List<DriverWithDistance> result = new ArrayList<>();

        for (int i = 0; i < drivers.size(); i++) {
            Driver driver = drivers.get(i);
            log.info("rankDrivers candidate[{}/{}]: driverId={}", i + 1, drivers.size(), driver.getId());

            String locationStr = redisService.getDriverLocation(driver.getId().toString());
            log.info("rankDrivers candidate driverId={} redisLocationRaw={}", driver.getId(), locationStr);

            if (locationStr == null || locationStr.isBlank()) {
                log.info("rankDrivers skip driverId={} because Redis location is null/blank", driver.getId());
                continue;
            }

            try {
                String[] parts = locationStr.split(",");
                if (parts.length < 2) {
                    log.warn("rankDrivers skip driverId={} because location format invalid: {}", driver.getId(), locationStr);
                    continue;
                }

                double lat = Double.parseDouble(parts[0]);
                double lng = Double.parseDouble(parts[1]);
                double distance = haversine(pickupLat, pickupLng, lat, lng);

                log.info("rankDrivers candidate driverId={} parsedLocation=({}, {}), distanceKm={}",
                        driver.getId(), lat, lng, String.format("%.3f", distance));

                result.add(new DriverWithDistance(driver, distance));
                log.info("rankDrivers add driverId={} into ranked list", driver.getId());
            } catch (NumberFormatException | ArrayIndexOutOfBoundsException e) {
                log.warn("Loi parse vi tri tai xe {}: {}", driver.getId(), e.getMessage());
            }
        }

        log.info("rankDrivers pre-sort size={}", result.size());

        result.sort(Comparator
                .comparingDouble(DriverWithDistance::getDistance)
                .thenComparing(d -> {
                    BigDecimal score = d.getDriver().getReputationScore();
                    return score != null ? score.doubleValue() : 0.0;
                }, Comparator.reverseOrder())
        );

        log.info("rankDrivers done: rideId={}, rankedSize={}", ride.getId(), result.size());

        return result;
    }

    private double haversine(double lat1, double lng1, double lat2, double lng2) {
        final int R = 6371;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLng = Math.toRadians(lng2 - lng1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLng / 2) * Math.sin(dLng / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    private static class DriverWithDistance {
        private final Driver driver;
        private final double distance;

        DriverWithDistance(Driver driver, double distance) {
            this.driver = driver;
            this.distance = distance;
        }

        Driver getDriver() { return driver; }
        double getDistance() { return distance; }
    }
}