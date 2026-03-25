package dat_mui_grab.datmuigrab.controller;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import dat_mui_grab.datmuigrab.dto.request.BookRideRequest;
import dat_mui_grab.datmuigrab.dto.request.CancelRideRequest;
import dat_mui_grab.datmuigrab.dto.request.UpdateRideStatusRequest;
import dat_mui_grab.datmuigrab.dto.response.RideResponse;
import dat_mui_grab.datmuigrab.service.RideService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/rides")
@RequiredArgsConstructor
public class RideController {

    private final RideService rideService;

    @PostMapping
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<RideResponse> bookRide(
            @AuthenticationPrincipal String userId,
            @Valid @RequestBody BookRideRequest request) {
        return ResponseEntity.ok(rideService.bookRide(UUID.fromString(userId), request));
    }

    @GetMapping("/{rideId}")
    public ResponseEntity<RideResponse> getById(@PathVariable UUID rideId) {
        return ResponseEntity.ok(rideService.getById(rideId));
    }

    @PutMapping("/{rideId}/cancel")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<RideResponse> cancelRide(
            @AuthenticationPrincipal String userId,
            @PathVariable UUID rideId,
            @RequestBody CancelRideRequest request) {
        return ResponseEntity.ok(rideService.cancelRide(rideId, UUID.fromString(userId), request));
    }

    @PutMapping("/{rideId}/status")
    @PreAuthorize("hasRole('DRIVER')")
    public ResponseEntity<RideResponse> updateStatus(
            @AuthenticationPrincipal String userId,
            @PathVariable UUID rideId,
            @Valid @RequestBody UpdateRideStatusRequest request) {
        return ResponseEntity.ok(rideService.updateStatus(rideId, UUID.fromString(userId), request));
    }

    @GetMapping("/my-rides")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<List<RideResponse>> getMyRides(@AuthenticationPrincipal String userId) {
        return ResponseEntity.ok(rideService.getMyRides(UUID.fromString(userId)));
    }

    @GetMapping("/company/{companyId}")
    @PreAuthorize("hasRole('TRANSPORT_COMPANY') or hasRole('ADMIN')")
    public ResponseEntity<List<RideResponse>> getByCompany(@PathVariable UUID companyId) {
        return ResponseEntity.ok(rideService.getByCompany(companyId));
    }

    @GetMapping("/driver/pending")
    @PreAuthorize("hasRole('DRIVER')")
    public ResponseEntity<RideResponse> getDriverPendingRide(@AuthenticationPrincipal String userId) {
        Optional<RideResponse> ride = rideService.getDriverPendingRide(UUID.fromString(userId));
        return ride.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.noContent().build());
    }
}
