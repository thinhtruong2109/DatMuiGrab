package dat_mui_grab.datmuigrab.dto.response;

import dat_mui_grab.datmuigrab.entity.enums.CancelledBy;
import dat_mui_grab.datmuigrab.entity.enums.RideStatus;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class RideResponse {
    private UUID id;
    private UUID customerId;
    private String customerName;
    private UUID driverId;
    private String driverName;
    private String driverPhone;
    private String driverVehiclePlate;
    private UUID companyId;
    private String companyName;
    private BigDecimal pickupLat;
    private BigDecimal pickupLng;
    private String pickupAddress;
    private BigDecimal destinationLat;
    private BigDecimal destinationLng;
    private String destinationAddress;
    private BigDecimal distanceKm;
    private BigDecimal estimatedPrice;
    private BigDecimal finalPrice;
    private BigDecimal platformFee;
    private BigDecimal companyRevenue;
    private BigDecimal driverRevenue;
    private RideStatus status;
    private CancelledBy cancelledBy;
    private String cancelReason;
    private LocalDateTime startedAt;
    private LocalDateTime completedAt;
    private LocalDateTime createdAt;
}
