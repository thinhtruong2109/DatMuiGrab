package dat_mui_grab.datmuigrab.dto.response;

import dat_mui_grab.datmuigrab.entity.enums.RegistrationStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class DriverRegistrationResponse {
    private UUID id;
    private UUID driverId;
    private UUID companyId;
    private String companyName;
    private RegistrationStatus status;
    private LocalDateTime appliedAt;
    private LocalDateTime approvedAt;
    private String note;
}
