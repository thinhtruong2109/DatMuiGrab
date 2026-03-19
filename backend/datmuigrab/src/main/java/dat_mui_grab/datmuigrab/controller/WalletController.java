package dat_mui_grab.datmuigrab.controller;

import dat_mui_grab.datmuigrab.dto.request.UpdateBankInfoRequest;
import dat_mui_grab.datmuigrab.dto.request.WithdrawRequest;
import dat_mui_grab.datmuigrab.dto.response.WalletResponse;
import dat_mui_grab.datmuigrab.dto.response.WalletTransactionResponse;
import dat_mui_grab.datmuigrab.service.WalletService;
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
@RequestMapping("/api/wallet")
@RequiredArgsConstructor
public class WalletController {

    private final WalletService walletService;

    @GetMapping
    @PreAuthorize("hasRole('TRANSPORT_COMPANY')")
    public ResponseEntity<WalletResponse> getMyWallet(@AuthenticationPrincipal String userId) {
        return ResponseEntity.ok(walletService.getMyWallet(UUID.fromString(userId)));
    }

    @PutMapping("/bank-info")
    @PreAuthorize("hasRole('TRANSPORT_COMPANY')")
    public ResponseEntity<WalletResponse> updateBankInfo(
            @AuthenticationPrincipal String userId,
            @Valid @RequestBody UpdateBankInfoRequest request) {
        return ResponseEntity.ok(walletService.updateBankInfo(UUID.fromString(userId), request));
    }

    @PostMapping("/withdraw")
    @PreAuthorize("hasRole('TRANSPORT_COMPANY')")
    public ResponseEntity<WalletTransactionResponse> withdraw(
            @AuthenticationPrincipal String userId,
            @Valid @RequestBody WithdrawRequest request) {
        return ResponseEntity.ok(walletService.withdraw(UUID.fromString(userId), request));
    }

    @GetMapping("/transactions")
    @PreAuthorize("hasRole('TRANSPORT_COMPANY')")
    public ResponseEntity<List<WalletTransactionResponse>> getTransactions(
            @AuthenticationPrincipal String userId) {
        return ResponseEntity.ok(walletService.getTransactions(UUID.fromString(userId)));
    }

    @GetMapping("/admin/{companyId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<WalletResponse> getByCompanyAdmin(@PathVariable UUID companyId) {
        return ResponseEntity.ok(walletService.getWalletByCompanyAdmin(companyId));
    }
}
