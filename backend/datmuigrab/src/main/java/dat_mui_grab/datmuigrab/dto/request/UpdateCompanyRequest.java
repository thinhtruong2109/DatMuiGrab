package dat_mui_grab.datmuigrab.dto.request;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class UpdateCompanyRequest {
    private String description;
    private BigDecimal driverRevenuePercent;
}
