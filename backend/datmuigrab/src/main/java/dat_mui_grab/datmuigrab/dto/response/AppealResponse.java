package dat_mui_grab.datmuigrab.dto.response;

import dat_mui_grab.datmuigrab.entity.enums.AppealStatus;
import dat_mui_grab.datmuigrab.entity.enums.AppealedBy;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class AppealResponse {
    private UUID id;
    private UUID driverId;
    private String driverName;
    private AppealedBy appealedBy;
    private UUID appealedByUserId;
    private String reason;
    private AppealStatus status;
    private String adminNote;
    private LocalDateTime createdAt;
    private LocalDateTime resolvedAt;
}
