package dat_mui_grab.datmuigrab.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import dat_mui_grab.datmuigrab.dto.request.BanDriverRequest;
import dat_mui_grab.datmuigrab.dto.request.UpdateDriverRequest;
import dat_mui_grab.datmuigrab.dto.request.UpdateDriverStatusRequest;
import dat_mui_grab.datmuigrab.dto.response.DriverResponse;
import dat_mui_grab.datmuigrab.dto.response.RideResponse;
import dat_mui_grab.datmuigrab.service.DriverService;
import dat_mui_grab.datmuigrab.service.RideService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/drivers")
@RequiredArgsConstructor
public class DriverController {

    private final DriverService driverService;
    private final RideService rideService;

    @GetMapping("/me")
    @PreAuthorize("hasRole('DRIVER')")
    public ResponseEntity<DriverResponse> getMe(@AuthenticationPrincipal String userId) {
        return ResponseEntity.ok(driverService.getMe(UUID.fromString(userId)));
    }

    @PutMapping("/me")
    @PreAuthorize("hasRole('DRIVER')")
    public ResponseEntity<DriverResponse> updateMe(
            @AuthenticationPrincipal String userId,
            @RequestBody UpdateDriverRequest request) {
        return ResponseEntity.ok(driverService.updateMe(UUID.fromString(userId), request));
    }

    @PutMapping("/me/status")
    @PreAuthorize("hasRole('DRIVER')")
    public ResponseEntity<Void> setStatus(
            @AuthenticationPrincipal String userId,
            @Valid @RequestBody UpdateDriverStatusRequest request) {
        driverService.setStatus(UUID.fromString(userId), request);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/me/rides")
    @PreAuthorize("hasRole('DRIVER')")
    public ResponseEntity<List<RideResponse>> getMyRides(@AuthenticationPrincipal String userId) {
        return ResponseEntity.ok(rideService.getDriverRides(UUID.fromString(userId)));
    }

    @GetMapping("/company/{companyId}")
    @PreAuthorize("hasRole('TRANSPORT_COMPANY') or hasRole('ADMIN')")
    public ResponseEntity<List<DriverResponse>> getByCompany(@PathVariable UUID companyId) {
        return ResponseEntity.ok(driverService.getByCompany(companyId));
    }

    @PutMapping("/{driverId}/ban")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> banDriver(
            @PathVariable UUID driverId,
            @RequestBody BanDriverRequest request) {
        driverService.banDriver(driverId, request);
        return ResponseEntity.ok().build();
    }
}