package dat_mui_grab.datmuigrab.controller;

import dat_mui_grab.datmuigrab.dto.request.CreateAppealRequest;
import dat_mui_grab.datmuigrab.dto.request.ResolveAppealRequest;
import dat_mui_grab.datmuigrab.dto.response.AppealResponse;
import dat_mui_grab.datmuigrab.service.AppealService;
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
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/appeals")
@RequiredArgsConstructor
public class AppealController {

    private final AppealService appealService;

    @PostMapping
    @PreAuthorize("hasRole('DRIVER') or hasRole('TRANSPORT_COMPANY')")
    public ResponseEntity<AppealResponse> createAppeal(
            @AuthenticationPrincipal String userId,
            @Valid @RequestBody CreateAppealRequest request) {
        return ResponseEntity.ok(appealService.createAppeal(UUID.fromString(userId), request));
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<AppealResponse>> getAllAppeals() {
        return ResponseEntity.ok(appealService.getAllAppeals());
    }

    @PutMapping("/{appealId}/resolve")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AppealResponse> resolveAppeal(
            @AuthenticationPrincipal String userId,
            @PathVariable UUID appealId,
            @Valid @RequestBody ResolveAppealRequest request) {
        return ResponseEntity.ok(appealService.resolveAppeal(appealId, UUID.fromString(userId), request));
    }
}
