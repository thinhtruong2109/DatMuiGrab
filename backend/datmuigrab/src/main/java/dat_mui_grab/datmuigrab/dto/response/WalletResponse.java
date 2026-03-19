package dat_mui_grab.datmuigrab.dto.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class WalletResponse {
    private UUID id;
    private UUID companyId;
    private BigDecimal balance;
    private BigDecimal totalEarned;
    private BigDecimal totalWithdrawn;
    private String bankName;
    private String bankAccountNumber;
    private String bankAccountHolder;
    private LocalDateTime updatedAt;
}
