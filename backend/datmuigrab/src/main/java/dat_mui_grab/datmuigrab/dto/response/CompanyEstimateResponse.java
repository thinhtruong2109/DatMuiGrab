package dat_mui_grab.datmuigrab.dto.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
public class CompanyEstimateResponse {
    private UUID companyId;
    private String companyName;
    private BigDecimal pricePerKm;
    private BigDecimal distanceKm;
    private BigDecimal estimatedPrice;
    private String estimatedPriceDisplay;
}
