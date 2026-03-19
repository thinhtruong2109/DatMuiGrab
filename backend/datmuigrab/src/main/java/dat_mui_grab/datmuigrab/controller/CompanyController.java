package dat_mui_grab.datmuigrab.controller;

import dat_mui_grab.datmuigrab.dto.request.CreateCompanyRequest;
import dat_mui_grab.datmuigrab.dto.request.SuspendCompanyRequest;
import dat_mui_grab.datmuigrab.dto.request.UpdateCompanyRequest;
import dat_mui_grab.datmuigrab.dto.request.UpdatePriceRequest;
import dat_mui_grab.datmuigrab.dto.response.CompanyEstimateResponse;
import dat_mui_grab.datmuigrab.dto.response.CompanyResponse;
import dat_mui_grab.datmuigrab.entity.User;
import dat_mui_grab.datmuigrab.exception.AppException;
import dat_mui_grab.datmuigrab.exception.ErrorCode;
import dat_mui_grab.datmuigrab.repository.UserRepository;
import dat_mui_grab.datmuigrab.service.CompanyService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/companies")
@RequiredArgsConstructor
public class CompanyController {

    private final CompanyService companyService;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<List<CompanyResponse>> getActiveCompanies() {
        return ResponseEntity.ok(companyService.getActiveCompanies());
    }

    @GetMapping("/estimate")
    public ResponseEntity<List<CompanyEstimateResponse>> getEstimates(
            @RequestParam double pickupLat,
            @RequestParam double pickupLng,
            @RequestParam double destLat,
            @RequestParam double destLng) {
        return ResponseEntity.ok(companyService.getEstimates(pickupLat, pickupLng, destLat, destLng));
    }

    @GetMapping("/admin/all")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<CompanyResponse>> getAllForAdmin() {
        return ResponseEntity.ok(companyService.getAllForAdmin());
    }

    @GetMapping("/{companyId}")
    public ResponseEntity<CompanyResponse> getById(@PathVariable UUID companyId) {
        return ResponseEntity.ok(companyService.getById(companyId));
    }

    @PostMapping
    @PreAuthorize("hasRole('TRANSPORT_COMPANY')")
    public ResponseEntity<CompanyResponse> createCompany(
            @AuthenticationPrincipal String userId,
            @Valid @RequestBody CreateCompanyRequest request) {
        User user = findUser(userId);
        return ResponseEntity.ok(companyService.createCompany(user, request));
    }

    @PutMapping("/{companyId}")
    @PreAuthorize("hasRole('TRANSPORT_COMPANY')")
    public ResponseEntity<CompanyResponse> updateCompany(
            @AuthenticationPrincipal String userId,
            @PathVariable UUID companyId,
            @Valid @RequestBody UpdateCompanyRequest request) {
        User user = findUser(userId);
        return ResponseEntity.ok(companyService.updateCompany(companyId, user, request));
    }

    @PutMapping("/{companyId}/price")
    @PreAuthorize("hasRole('TRANSPORT_COMPANY')")
    public ResponseEntity<Void> updatePrice(
            @AuthenticationPrincipal String userId,
            @PathVariable UUID companyId,
            @Valid @RequestBody UpdatePriceRequest request) {
        User user = findUser(userId);
        companyService.updatePrice(companyId, user, request);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{companyId}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> approveCompany(@PathVariable UUID companyId) {
        companyService.approveCompany(companyId);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{companyId}/suspend")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> suspendCompany(
            @PathVariable UUID companyId,
            @RequestBody SuspendCompanyRequest request) {
        companyService.suspendCompany(companyId, request);
        return ResponseEntity.ok().build();
    }

    private User findUser(String userId) {
        return userRepository.findById(UUID.fromString(userId))
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Khong tim thay nguoi dung"));
    }
}
