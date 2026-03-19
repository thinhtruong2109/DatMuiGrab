package dat_mui_grab.datmuigrab.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class UpdatePriceRequest {

    @NotNull
    @Positive
    private BigDecimal pricePerKm;
}
