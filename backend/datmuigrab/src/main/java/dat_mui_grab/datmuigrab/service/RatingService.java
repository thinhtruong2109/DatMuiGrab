package dat_mui_grab.datmuigrab.service;

import dat_mui_grab.datmuigrab.dto.request.CreateRatingRequest;
import dat_mui_grab.datmuigrab.dto.response.RatingResponse;
import dat_mui_grab.datmuigrab.entity.Driver;
import dat_mui_grab.datmuigrab.entity.Rating;
import dat_mui_grab.datmuigrab.entity.Ride;
import dat_mui_grab.datmuigrab.entity.User;
import dat_mui_grab.datmuigrab.entity.enums.RideStatus;
import dat_mui_grab.datmuigrab.entity.enums.UserStatus;
import dat_mui_grab.datmuigrab.exception.AppException;
import dat_mui_grab.datmuigrab.exception.ErrorCode;
import dat_mui_grab.datmuigrab.repository.DriverRepository;
import dat_mui_grab.datmuigrab.repository.RatingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RatingService {

    private final RatingRepository ratingRepository;
    private final DriverRepository driverRepository;
    private final RideService rideService;
    private final DriverService driverService;
    private final UserService userService;

    @Transactional
    public RatingResponse createRating(UUID customerId, CreateRatingRequest request) {
        Ride ride = rideService.findById(request.getRideId());
        User customer = userService.findById(customerId);

        if (ride.getStatus() != RideStatus.COMPLETED) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "Chi co the danh gia chuyen da hoan thanh");
        }

        if (!ride.getCustomer().getId().equals(customerId)) {
            throw new AppException(ErrorCode.UNAUTHORIZED, "Khong co quyen danh gia chuyen nay");
        }

        if (ratingRepository.existsByRide(ride)) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "Chuyen nay da duoc danh gia roi");
        }

        Driver driver = ride.getDriver();
        if (driver == null) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "Chuyen nay khong co tai xe");
        }

        Rating rating = Rating.builder()
                .ride(ride)
                .customer(customer)
                .driver(driver)
                .stars(request.getStars())
                .comment(request.getComment())
                .build();

        ratingRepository.save(rating);

        updateDriverReputationScore(driver, request.getStars());

        return mapToResponse(rating);
    }

    private void updateDriverReputationScore(Driver driver, int newStars) {
        int totalRatings = driver.getTotalRatings();
        BigDecimal currentScore = driver.getReputationScore();

        BigDecimal newScore;
        if (currentScore == null || totalRatings == 0) {
            newScore = BigDecimal.valueOf(newStars);
        } else {
            BigDecimal totalPoints = currentScore.multiply(BigDecimal.valueOf(totalRatings));
            newScore = totalPoints.add(BigDecimal.valueOf(newStars))
                    .divide(BigDecimal.valueOf(totalRatings + 1), 1, RoundingMode.HALF_UP);
        }

        driver.setReputationScore(newScore);
        driver.setTotalRatings(totalRatings + 1);

        if (newScore.compareTo(BigDecimal.valueOf(3.0)) < 0) {
            driver.getUser().setStatus(UserStatus.SUSPENDED);
        }

        driverRepository.save(driver);
    }

    public List<RatingResponse> getByDriver(UUID driverId) {
        Driver driver = driverService.findById(driverId);
        return ratingRepository.findAllByDriver(driver).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private RatingResponse mapToResponse(Rating rating) {
        return RatingResponse.builder()
                .id(rating.getId())
                .rideId(rating.getRide().getId())
                .customerId(rating.getCustomer().getId())
                .driverId(rating.getDriver().getId())
                .stars(rating.getStars())
                .comment(rating.getComment())
                .createdAt(rating.getCreatedAt())
                .build();
    }
}