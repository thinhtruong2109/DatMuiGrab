package dat_mui_grab.datmuigrab.service;

import dat_mui_grab.datmuigrab.dto.request.UpdateBankInfoRequest;
import dat_mui_grab.datmuigrab.dto.request.WithdrawRequest;
import dat_mui_grab.datmuigrab.dto.response.WalletResponse;
import dat_mui_grab.datmuigrab.dto.response.WalletTransactionResponse;
import dat_mui_grab.datmuigrab.entity.CompanyWallet;
import dat_mui_grab.datmuigrab.entity.TransportCompany;
import dat_mui_grab.datmuigrab.entity.WalletTransaction;
import dat_mui_grab.datmuigrab.entity.enums.PaymentStatus;
import dat_mui_grab.datmuigrab.entity.enums.WalletTransactionType;
import dat_mui_grab.datmuigrab.exception.AppException;
import dat_mui_grab.datmuigrab.exception.ErrorCode;
import dat_mui_grab.datmuigrab.repository.CompanyWalletRepository;
import dat_mui_grab.datmuigrab.repository.WalletTransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class WalletService {

    private final CompanyWalletRepository walletRepository;
    private final WalletTransactionRepository transactionRepository;
    private final CompanyService companyService;

    public WalletResponse getMyWallet(UUID userId) {
        TransportCompany company = companyService.findByUserId(userId);
        CompanyWallet wallet = findByCompany(company);
        return mapToResponse(wallet);
    }

    public WalletResponse getWalletByCompanyAdmin(UUID companyId) {
        TransportCompany company = companyService.findById(companyId);
        CompanyWallet wallet = findByCompany(company);
        return mapToResponse(wallet);
    }

    @Transactional
    public WalletResponse updateBankInfo(UUID userId, UpdateBankInfoRequest request) {
        TransportCompany company = companyService.findByUserId(userId);
        CompanyWallet wallet = findByCompany(company);

        wallet.setBankName(request.getBankName());
        wallet.setBankAccountNumber(request.getBankAccountNumber());
        wallet.setBankAccountHolder(request.getBankAccountHolder());

        return mapToResponse(walletRepository.save(wallet));
    }

    @Transactional
    public WalletTransactionResponse withdraw(UUID userId, WithdrawRequest request) {
        TransportCompany company = companyService.findByUserId(userId);
        CompanyWallet wallet = findByCompany(company);

        if (wallet.getBalance().compareTo(request.getAmount()) < 0) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "So du khong du de rut");
        }

        wallet.setBalance(wallet.getBalance().subtract(request.getAmount()));
        wallet.setTotalWithdrawn(wallet.getTotalWithdrawn().add(request.getAmount()));
        walletRepository.save(wallet);

        WalletTransaction transaction = WalletTransaction.builder()
                .wallet(wallet)
                .type(WalletTransactionType.WITHDRAWAL)
                .amount(request.getAmount())
                .balanceAfter(wallet.getBalance())
                .description("Rut tien khoi vi")
                .status(PaymentStatus.SUCCESS)
                .build();

        return mapToTransactionResponse(transactionRepository.save(transaction));
    }

    public List<WalletTransactionResponse> getTransactions(UUID userId) {
        TransportCompany company = companyService.findByUserId(userId);
        CompanyWallet wallet = findByCompany(company);
        return transactionRepository.findAllByWalletOrderByCreatedAtDesc(wallet).stream()
                .map(this::mapToTransactionResponse)
                .collect(Collectors.toList());
    }

    private CompanyWallet findByCompany(TransportCompany company) {
        return walletRepository.findByCompany(company)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Khong tim thay vi cong ty"));
    }

    private WalletResponse mapToResponse(CompanyWallet wallet) {
        return WalletResponse.builder()
                .id(wallet.getId())
                .companyId(wallet.getCompany().getId())
                .balance(wallet.getBalance())
                .totalEarned(wallet.getTotalEarned())
                .totalWithdrawn(wallet.getTotalWithdrawn())
                .bankName(wallet.getBankName())
                .bankAccountNumber(wallet.getBankAccountNumber())
                .bankAccountHolder(wallet.getBankAccountHolder())
                .updatedAt(wallet.getUpdatedAt())
                .build();
    }

    private WalletTransactionResponse mapToTransactionResponse(WalletTransaction tx) {
        return WalletTransactionResponse.builder()
                .id(tx.getId())
                .walletId(tx.getWallet().getId())
                .type(tx.getType())
                .amount(tx.getAmount())
                .balanceAfter(tx.getBalanceAfter())
                .referenceId(tx.getReferenceId())
                .description(tx.getDescription())
                .status(tx.getStatus())
                .createdAt(tx.getCreatedAt())
                .build();
    }
}
