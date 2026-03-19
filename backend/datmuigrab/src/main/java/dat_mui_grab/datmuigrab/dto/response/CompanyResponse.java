package dat_mui_grab.datmuigrab.dto.response;

import dat_mui_grab.datmuigrab.entity.enums.CompanyStatus;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class CompanyResponse {
    private UUID id;
    private UUID userId;
    private String companyName;
    private String licenseNumber;
    private String address;
    private String description;
    private BigDecimal pricePerKm;
    private BigDecimal driverRevenuePercent;
    private CompanyStatus status;
    private LocalDateTime approvedAt;
    private LocalDateTime createdAt;
}
