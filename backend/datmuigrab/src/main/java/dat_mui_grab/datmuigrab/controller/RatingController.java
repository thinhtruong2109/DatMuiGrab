package dat_mui_grab.datmuigrab.controller;

import dat_mui_grab.datmuigrab.dto.request.CreateRatingRequest;
import dat_mui_grab.datmuigrab.dto.response.RatingResponse;
import dat_mui_grab.datmuigrab.service.RatingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/ratings")
@RequiredArgsConstructor
public class RatingController {

    private final RatingService ratingService;

    @PostMapping
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<RatingResponse> createRating(
            @AuthenticationPrincipal String userId,
            @Valid @RequestBody CreateRatingRequest request) {
        return ResponseEntity.ok(ratingService.createRating(UUID.fromString(userId), request));
    }

    @GetMapping("/driver/{driverId}")
    public ResponseEntity<List<RatingResponse>> getByDriver(@PathVariable UUID driverId) {
        return ResponseEntity.ok(ratingService.getByDriver(driverId));
    }
}
