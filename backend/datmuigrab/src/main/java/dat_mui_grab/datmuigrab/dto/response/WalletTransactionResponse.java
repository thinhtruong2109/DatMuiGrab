package dat_mui_grab.datmuigrab.dto.response;

import dat_mui_grab.datmuigrab.entity.enums.PaymentStatus;
import dat_mui_grab.datmuigrab.entity.enums.WalletTransactionType;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class WalletTransactionResponse {
    private UUID id;
    private UUID walletId;
    private WalletTransactionType type;
    private BigDecimal amount;
    private BigDecimal balanceAfter;
    private UUID referenceId;
    private String description;
    private PaymentStatus status;
    private LocalDateTime createdAt;
}
