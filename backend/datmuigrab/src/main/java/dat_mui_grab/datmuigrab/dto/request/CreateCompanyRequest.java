package dat_mui_grab.datmuigrab.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class CreateCompanyRequest {

    @NotBlank
    private String companyName;

    private String licenseNumber;
    private String address;
    private String description;

    @NotNull
    @Positive
    private BigDecimal pricePerKm;

    @NotNull
    private BigDecimal driverRevenuePercent;
}
