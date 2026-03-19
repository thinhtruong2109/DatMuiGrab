package dat_mui_grab.datmuigrab.controller;

import java.util.List;
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

import dat_mui_grab.datmuigrab.dto.request.DriverRegistrationRequest;
import dat_mui_grab.datmuigrab.dto.request.RejectRegistrationRequest;
import dat_mui_grab.datmuigrab.dto.response.DriverRegistrationResponse;
import dat_mui_grab.datmuigrab.service.DriverService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/driver-registrations")
@RequiredArgsConstructor
public class DriverRegistrationController {

    private final DriverService driverService;

    @PostMapping
    @PreAuthorize("hasRole('DRIVER')")
    public ResponseEntity<DriverRegistrationResponse> register(
            @AuthenticationPrincipal String userId,
            @Valid @RequestBody DriverRegistrationRequest request) {
        return ResponseEntity.ok(driverService.registerToCompany(UUID.fromString(userId), request));
    }

    @GetMapping("/me")
    @PreAuthorize("hasRole('DRIVER')")
    public ResponseEntity<List<DriverRegistrationResponse>> getMyRegistrations(
            @AuthenticationPrincipal String userId) {
        return ResponseEntity.ok(driverService.getMyRegistrations(UUID.fromString(userId)));
    }

    @GetMapping("/company/{companyId}/pending")
    @PreAuthorize("hasRole('TRANSPORT_COMPANY')")
    public ResponseEntity<List<DriverRegistrationResponse>> getPendingByCompany(
            @PathVariable UUID companyId) {
        return ResponseEntity.ok(driverService.getPendingByCompany(companyId));
    }

    @PutMapping("/{registrationId}/approve")
    @PreAuthorize("hasRole('TRANSPORT_COMPANY')")
    public ResponseEntity<Void> approveRegistration(@PathVariable UUID registrationId) {
        driverService.approveRegistration(registrationId);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{registrationId}/reject")
    @PreAuthorize("hasRole('TRANSPORT_COMPANY')")
    public ResponseEntity<Void> rejectRegistration(
            @PathVariable UUID registrationId,
            @RequestBody RejectRegistrationRequest request) {
        driverService.rejectRegistration(registrationId, request);
        return ResponseEntity.ok().build();
    }
}