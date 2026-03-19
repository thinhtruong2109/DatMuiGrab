package dat_mui_grab.datmuigrab.dto.response;

import dat_mui_grab.datmuigrab.entity.enums.PaymentMethod;
import dat_mui_grab.datmuigrab.entity.enums.PaymentStatus;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class PaymentResponse {
    private UUID id;
    private UUID rideId;
    private BigDecimal amount;
    private PaymentMethod method;
    private PaymentStatus status;
    private String transactionCode;
    private LocalDateTime paidAt;
    private LocalDateTime createdAt;
}
