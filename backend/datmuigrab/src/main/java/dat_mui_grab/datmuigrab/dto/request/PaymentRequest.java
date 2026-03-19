package dat_mui_grab.datmuigrab.dto.request;

import dat_mui_grab.datmuigrab.entity.enums.PaymentMethod;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

@Data
public class PaymentRequest {

    @NotNull
    private UUID rideId;

    @NotNull
    private PaymentMethod method;
}
