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
import dat_mui_grab.datmuigrab.repository.RideRepository;
import dat_mui_grab.datmuigrab.repository.UserRepository;
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
    private final UserRepository userRepository;
    private final RideRepository rideRepository;

    @Transactional
    public RatingResponse createRating(UUID customerId, CreateRatingRequest request) {
        Ride ride = rideRepository.findById(request.getRideId())
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Khong tim thay chuyen di"));

        User customer = userRepository.findById(customerId)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Khong tim thay nguoi dung"));

        if (ride.getStatus() != RideStatus.COMPLETED) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "Chi co the danh gia sau khi chuyen hoan thanh");
        }

        if (!ride.getCustomer().getId().equals(customerId)) {
            throw new AppException(ErrorCode.UNAUTHORIZED, "Khong co quyen danh gia chuyen nay");
        }

        if (ratingRepository.existsByRide(ride)) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "Chuyen di nay da duoc danh gia");
        }

        Driver driver = ride.getDriver();
        if (driver == null) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "Chuyen di khong co tai xe");
        }

        Rating rating = Rating.builder()
                .ride(ride)
                .customer(customer)
                .driver(driver)
                .stars(request.getStars())
                .comment(request.getComment())
                .build();

        ratingRepository.save(rating);
        updateDriverReputationScore(driver);

        return mapToResponse(rating);
    }

    public List<RatingResponse> getByDriver(UUID driverId) {
        Driver driver = driverRepository.findById(driverId)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Khong tim thay tai xe"));

        return ratingRepository.findAllByDriver(driver)
                .stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    private void updateDriverReputationScore(Driver driver) {
        Double avgScore = ratingRepository.calculateAverageScoreByDriver(driver);

        if (avgScore != null) {
            BigDecimal newScore = BigDecimal.valueOf(avgScore)
                    .setScale(1, RoundingMode.HALF_UP);
            driver.setReputationScore(newScore);
            driver.setTotalRatings(driver.getTotalRatings() + 1);
            driverRepository.save(driver);

            if (newScore.compareTo(BigDecimal.valueOf(3.0)) < 0) {
                User user = driver.getUser();
                user.setStatus(UserStatus.SUSPENDED);
                userRepository.save(user);
            }
        }
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
