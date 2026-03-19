package dat_mui_grab.datmuigrab.dto.response;

import dat_mui_grab.datmuigrab.entity.enums.DriverOnlineStatus;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
public class DriverResponse {
    private UUID id;
    private UUID userId;
    private String fullName;
    private String phoneNumber;
    private String licenseNumber;
    private String idCardNumber;
    private String vehiclePlate;
    private String vehicleType;
    private String vehicleModel;
    private BigDecimal reputationScore;
    private Integer totalRatings;
    private DriverOnlineStatus onlineStatus;
    private BigDecimal currentLat;
    private BigDecimal currentLng;
}
