package dat_mui_grab.datmuigrab.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import dat_mui_grab.datmuigrab.dto.request.BookRideRequest;
import dat_mui_grab.datmuigrab.dto.request.CancelRideRequest;
import dat_mui_grab.datmuigrab.dto.request.UpdateRideStatusRequest;
import dat_mui_grab.datmuigrab.dto.response.RideResponse;
import dat_mui_grab.datmuigrab.entity.CompanyWallet;
import dat_mui_grab.datmuigrab.entity.Driver;
import dat_mui_grab.datmuigrab.entity.Ride;
import dat_mui_grab.datmuigrab.entity.TransportCompany;
import dat_mui_grab.datmuigrab.entity.User;
import dat_mui_grab.datmuigrab.entity.WalletTransaction;
import dat_mui_grab.datmuigrab.entity.enums.CancelledBy;
import dat_mui_grab.datmuigrab.entity.enums.DriverOnlineStatus;
import dat_mui_grab.datmuigrab.entity.enums.PaymentStatus;
import dat_mui_grab.datmuigrab.entity.enums.RideStatus;
import dat_mui_grab.datmuigrab.entity.enums.WalletTransactionType;
import dat_mui_grab.datmuigrab.exception.AppException;
import dat_mui_grab.datmuigrab.exception.ErrorCode;
import dat_mui_grab.datmuigrab.repository.CompanyWalletRepository;
import dat_mui_grab.datmuigrab.repository.DriverRepository;
import dat_mui_grab.datmuigrab.repository.RideRepository;
import dat_mui_grab.datmuigrab.repository.TransportCompanyRepository;
import dat_mui_grab.datmuigrab.repository.UserRepository;
import dat_mui_grab.datmuigrab.repository.WalletTransactionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
@RequiredArgsConstructor
public class RideService {

        private static final long DRIVER_BUSY_TIMEOUT_MINUTES = 2;

    private final RideRepository rideRepository;
    private final DriverRepository driverRepository;
    private final UserRepository userRepository;
    private final TransportCompanyRepository companyRepository;
    private final CompanyWalletRepository walletRepository;
    private final WalletTransactionRepository walletTransactionRepository;
    private final OsrmService osrmService;
    private final CompanyService companyService;
    private final MatchingService matchingService;
    private final RedisService redisService;
    private final SimpMessagingTemplate messagingTemplate;

    @Transactional
    public RideResponse bookRide(UUID customerId, BookRideRequest request) {
        User customer = userRepository.findById(customerId)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Khong tim thay nguoi dung"));

        ensureNoActiveRide(customer);

        TransportCompany company = companyRepository.findById(request.getCompanyId())
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Khong tim thay cong ty"));

        BigDecimal distanceKm = osrmService.getDistanceKm(
                request.getPickupLat().doubleValue(), request.getPickupLng().doubleValue(),
                request.getDestinationLat().doubleValue(), request.getDestinationLng().doubleValue()
        );

        BigDecimal basePrice = companyService.calculatePrice(company.getPricePerKm(), distanceKm);
        BigDecimal estimatedPrice = basePrice.multiply(BigDecimal.valueOf(1.05))
                .setScale(0, RoundingMode.HALF_UP);

        Ride ride = Ride.builder()
                .customer(customer)
                .company(company)
                .pickupLat(request.getPickupLat())
                .pickupLng(request.getPickupLng())
                .pickupAddress(request.getPickupAddress())
                .destinationLat(request.getDestinationLat())
                .destinationLng(request.getDestinationLng())
                .destinationAddress(request.getDestinationAddress())
                .distanceKm(distanceKm)
                .estimatedPrice(estimatedPrice)
                .pricePerKmAtBooking(company.getPricePerKm())
                .status(RideStatus.SEARCHING)
                .build();

        ride = rideRepository.save(ride);
        matchingService.findAndNotifyDriver(ride);

        return mapToResponse(ride);
    }

        private void ensureNoActiveRide(User customer) {
                List<RideStatus> activeStatuses = List.of(
                                RideStatus.SEARCHING,
                                RideStatus.MATCHED,
                                RideStatus.DRIVER_ARRIVING,
                                RideStatus.IN_PROGRESS
                );

                boolean hasActiveRide = rideRepository
                                .findFirstByCustomerAndStatusInOrderByCreatedAtDesc(customer, activeStatuses)
                                .isPresent();

                if (hasActiveRide) {
                        throw new AppException(ErrorCode.VALIDATION_ERROR,
                                        "Ban dang co chuyen di chua hoan thanh, vui long tiep tuc chuyen hien tai");
                }
        }

    public RideResponse getById(UUID rideId) {
        return mapToResponse(findById(rideId));
    }

    @Transactional
    public RideResponse cancelRide(UUID rideId, UUID userId, CancelRideRequest request) {
        Ride ride = findById(rideId);

        List<RideStatus> cancellableStatuses = List.of(
                RideStatus.SEARCHING, RideStatus.MATCHED, RideStatus.DRIVER_ARRIVING
        );

        if (!cancellableStatuses.contains(ride.getStatus())) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "Khong the huy chuyen di o trang thai nay");
        }

        ride.setStatus(RideStatus.CANCELLED);
        ride.setCancelledBy(CancelledBy.CUSTOMER);
        ride.setCancelReason(request.getReason());

        if (ride.getDriver() != null) {
            Driver driver = ride.getDriver();
            driver.setOnlineStatus(DriverOnlineStatus.ONLINE);
            driverRepository.save(driver);
            redisService.setDriverOnline(driver.getId().toString());
            redisService.releaseDriverLock(driver.getId().toString());
        }

        ride = rideRepository.save(ride);
        messagingTemplate.convertAndSend("/topic/ride/" + rideId + "/status", mapToResponse(ride));

        return mapToResponse(ride);
    }

    @Transactional
    public RideResponse updateStatus(UUID rideId, UUID driverUserId, UpdateRideStatusRequest request) {
        Ride ride = findById(rideId);

        Driver driver = driverRepository.findByUserId(driverUserId)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Khong tim thay tai xe"));

        RideStatus newStatus = request.getStatus();
        validateStatusTransition(ride.getStatus(), newStatus);

        if (newStatus == RideStatus.DRIVER_ARRIVING) {
            boolean locked = redisService.acquireDriverLock(driver.getId().toString());
            if (!locked) {
                throw new AppException(ErrorCode.VALIDATION_ERROR, "Tai xe dang ban, khong the nhan chuyen");
            }
            ride.setDriver(driver);
            driver.setOnlineStatus(DriverOnlineStatus.BUSY);
            redisService.setDriverBusy(driver.getId().toString());
            driverRepository.save(driver);

            ride.setStatus(RideStatus.MATCHED);
            ride = rideRepository.save(ride);
            messagingTemplate.convertAndSend("/topic/ride/" + rideId + "/status", mapToResponse(ride));

                        scheduleDriverBusyTimeout(ride.getId(), driver.getId());
        }

        if (newStatus == RideStatus.IN_PROGRESS) {
            ride.setStartedAt(LocalDateTime.now());
        }

        if (newStatus == RideStatus.COMPLETED) {
            completeRide(ride);
        }

        ride.setStatus(newStatus);
        ride = rideRepository.save(ride);

        messagingTemplate.convertAndSend("/topic/ride/" + rideId + "/status", mapToResponse(ride));

        return mapToResponse(ride);
    }

    private void completeRide(Ride ride) {
        ride.setCompletedAt(LocalDateTime.now());

        BigDecimal basePrice = companyService.calculatePrice(
                ride.getPricePerKmAtBooking(), ride.getDistanceKm()
        );
        BigDecimal finalPrice = basePrice.multiply(BigDecimal.valueOf(1.05))
                .setScale(0, RoundingMode.HALF_UP);

        BigDecimal platformFee = finalPrice.multiply(BigDecimal.valueOf(0.05))
                .setScale(0, RoundingMode.HALF_UP);

        BigDecimal companyPool = finalPrice.subtract(platformFee);

        TransportCompany company = ride.getCompany();
        BigDecimal driverPercent = company.getDriverRevenuePercent()
                .divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP);

        BigDecimal driverRevenue = companyPool.multiply(driverPercent)
                .setScale(0, RoundingMode.HALF_UP);

        BigDecimal companyRevenue = companyPool.subtract(driverRevenue);

        ride.setFinalPrice(finalPrice);
        ride.setPlatformFee(platformFee);
        ride.setCompanyRevenue(companyRevenue);
        ride.setDriverRevenue(driverRevenue);

        CompanyWallet wallet = walletRepository.findByCompany(company)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Khong tim thay vi cong ty"));

        BigDecimal newBalance = wallet.getBalance().add(companyRevenue);
        BigDecimal newTotalEarned = wallet.getTotalEarned().add(companyRevenue);
        wallet.setBalance(newBalance);
        wallet.setTotalEarned(newTotalEarned);
        walletRepository.save(wallet);

        WalletTransaction transaction = WalletTransaction.builder()
                .wallet(wallet)
                .type(WalletTransactionType.REVENUE)
                .amount(companyRevenue)
                .balanceAfter(newBalance)
                .referenceId(ride.getId())
                .description("Doanh thu chuyen di " + ride.getId())
                .status(PaymentStatus.SUCCESS)
                .build();
        walletTransactionRepository.save(transaction);

        if (ride.getDriver() != null) {
            Driver driver = ride.getDriver();
            driver.setOnlineStatus(DriverOnlineStatus.ONLINE);
            redisService.setDriverOnline(driver.getId().toString());
            redisService.releaseDriverLock(driver.getId().toString());
            driverRepository.save(driver);
        }
    }

        private void scheduleDriverBusyTimeout(UUID rideId, UUID driverId) {
                CompletableFuture.runAsync(
                                () -> autoReleaseBusyDriverIfTimedOut(rideId, driverId),
                                CompletableFuture.delayedExecutor(DRIVER_BUSY_TIMEOUT_MINUTES, TimeUnit.MINUTES)
                ).exceptionally(ex -> {
                        log.warn("Khong the tu dong go BUSY cho chuyen {}: {}", rideId, ex.getMessage());
                        return null;
                });
        }

        private void autoReleaseBusyDriverIfTimedOut(UUID rideId, UUID driverId) {
                Ride ride = rideRepository.findById(rideId).orElse(null);
                if (ride == null || ride.getDriver() == null) {
                        return;
                }

                if (!ride.getDriver().getId().equals(driverId)) {
                        return;
                }

                if (ride.getStatus() != RideStatus.MATCHED && ride.getStatus() != RideStatus.DRIVER_ARRIVING) {
                        return;
                }

                Driver driver = ride.getDriver();
                driver.setOnlineStatus(DriverOnlineStatus.ONLINE);
                driverRepository.save(driver);

                redisService.setDriverOnline(driverId.toString());
                redisService.releaseDriverLock(driverId.toString());

                ride.setDriver(null);
                ride.setStatus(RideStatus.SEARCHING);
                ride = rideRepository.save(ride);

                messagingTemplate.convertAndSend("/topic/ride/" + rideId + "/status", mapToResponse(ride));
                matchingService.findAndNotifyDriver(ride);

                log.info("Tu dong go BUSY cho tai xe {} sau {} phut timeout cua chuyen {}",
                                driverId, DRIVER_BUSY_TIMEOUT_MINUTES, rideId);
        }

    public List<RideResponse> getMyRides(UUID customerId) {
        User customer = userRepository.findById(customerId)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Khong tim thay nguoi dung"));
        return rideRepository.findAllByCustomerOrderByCreatedAtDesc(customer)
                .stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    public List<RideResponse> getDriverRides(UUID driverUserId) {
        Driver driver = driverRepository.findByUserId(driverUserId)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Khong tim thay tai xe"));
        return rideRepository.findAllByDriverOrderByCreatedAtDesc(driver)
                .stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    public List<RideResponse> getByCompany(UUID companyId) {
        TransportCompany company = companyRepository.findById(companyId)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Khong tim thay cong ty"));
        return rideRepository.findAllByCompanyOrderByCreatedAtDesc(company)
                .stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    public Ride findById(UUID rideId) {
        return rideRepository.findById(rideId)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Khong tim thay chuyen di"));
    }

    private void validateStatusTransition(RideStatus current, RideStatus next) {
        boolean valid = switch (next) {
            case DRIVER_ARRIVING -> current == RideStatus.SEARCHING || current == RideStatus.MATCHED;
            case IN_PROGRESS -> current == RideStatus.DRIVER_ARRIVING;
            case COMPLETED -> current == RideStatus.IN_PROGRESS;
            case CANCELLED -> current == RideStatus.SEARCHING
                    || current == RideStatus.MATCHED
                    || current == RideStatus.DRIVER_ARRIVING;
            default -> false;
        };

        if (!valid) {
            throw new AppException(ErrorCode.VALIDATION_ERROR,
                    "Chuyen trang thai khong hop le tu " + current + " sang " + next);
        }
    }

    public RideResponse mapToResponse(Ride ride) {
        RideResponse.RideResponseBuilder builder = RideResponse.builder()
                .id(ride.getId())
                .customerId(ride.getCustomer().getId())
                .customerName(ride.getCustomer().getFullName())
                .companyId(ride.getCompany().getId())
                .companyName(ride.getCompany().getCompanyName())
                .pickupLat(ride.getPickupLat())
                .pickupLng(ride.getPickupLng())
                .pickupAddress(ride.getPickupAddress())
                .destinationLat(ride.getDestinationLat())
                .destinationLng(ride.getDestinationLng())
                .destinationAddress(ride.getDestinationAddress())
                .distanceKm(ride.getDistanceKm())
                .estimatedPrice(ride.getEstimatedPrice())
                .finalPrice(ride.getFinalPrice())
                .platformFee(ride.getPlatformFee())
                .companyRevenue(ride.getCompanyRevenue())
                .driverRevenue(ride.getDriverRevenue())
                .status(ride.getStatus())
                .cancelledBy(ride.getCancelledBy())
                .cancelReason(ride.getCancelReason())
                .startedAt(ride.getStartedAt())
                .completedAt(ride.getCompletedAt())
                .createdAt(ride.getCreatedAt());

        if (ride.getDriver() != null) {
            Driver driver = ride.getDriver();
            builder.driverId(driver.getId())
                    .driverName(driver.getUser().getFullName())
                    .driverPhone(driver.getPhoneNumber())
                    .driverVehiclePlate(driver.getVehiclePlate());
        }

        return builder.build();
    }
}
