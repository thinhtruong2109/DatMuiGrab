package dat_mui_grab.datmuigrab.controller;

import dat_mui_grab.datmuigrab.dto.request.PaymentRequest;
import dat_mui_grab.datmuigrab.dto.response.PaymentResponse;
import dat_mui_grab.datmuigrab.service.PaymentService;
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

import java.util.UUID;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<PaymentResponse> pay(
            @AuthenticationPrincipal String userId,
            @Valid @RequestBody PaymentRequest request) {
        return ResponseEntity.ok(paymentService.pay(UUID.fromString(userId), request));
    }

    @GetMapping("/ride/{rideId}")
    public ResponseEntity<PaymentResponse> getByRide(@PathVariable UUID rideId) {
        return ResponseEntity.ok(paymentService.getByRide(rideId));
    }
}
