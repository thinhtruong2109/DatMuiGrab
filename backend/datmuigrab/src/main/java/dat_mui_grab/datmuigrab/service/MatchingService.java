package dat_mui_grab.datmuigrab.service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;

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
        
        log.info("findAndNotifyDriver called {}");
        if (candidates.isEmpty()) {
            log.info("Khong tim thay tai xe cho chuyen {}", ride.getId());
            return;
        }

        List<DriverWithDistance> ranked = rankDrivers(candidates, ride);

        for (DriverWithDistance dwd : ranked) {
            Driver driver = dwd.getDriver();
            boolean locked = redisService.acquireDriverLock(driver.getId().toString());
            if (!locked) {
                continue;
            }

            redisService.setPendingRideForDriver(driver.getId().toString(), ride.getId().toString());

            messagingTemplate.convertAndSend(
                    "/topic/driver/" + driver.getId() + "/new-ride",
                    ride.getId().toString()
            );

            log.info("Da gui yeu cau chuyen {} toi tai xe {}", ride.getId(), driver.getId());
            redisService.releaseDriverLock(driver.getId().toString());
            break;
        }
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
        double pickupLat = ride.getPickupLat().doubleValue();
        double pickupLng = ride.getPickupLng().doubleValue();

        List<DriverWithDistance> result = new ArrayList<>();

        for (Driver driver : drivers) {
            String locationStr = redisService.getDriverLocation(driver.getId().toString());
            if (locationStr == null) continue;

            try {
                String[] parts = locationStr.split(",");
                double lat = Double.parseDouble(parts[0]);
                double lng = Double.parseDouble(parts[1]);
                double distance = haversine(pickupLat, pickupLng, lat, lng);
                result.add(new DriverWithDistance(driver, distance));
            } catch (NumberFormatException | ArrayIndexOutOfBoundsException e) {
                log.warn("Loi parse vi tri tai xe {}: {}", driver.getId(), e.getMessage());
            }
        }

        result.sort(Comparator
                .comparingDouble(DriverWithDistance::getDistance)
                .thenComparing(d -> {
                    BigDecimal score = d.getDriver().getReputationScore();
                    return score != null ? score.doubleValue() : 0.0;
                }, Comparator.reverseOrder())
        );

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