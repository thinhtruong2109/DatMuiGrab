package dat_mui_grab.datmuigrab.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class WithdrawRequest {

    @NotNull
    @Min(10000)
    private BigDecimal amount;
}
