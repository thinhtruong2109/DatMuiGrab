package dat_mui_grab.datmuigrab.dto.request;

import dat_mui_grab.datmuigrab.entity.enums.DriverOnlineStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class UpdateDriverStatusRequest {

    @NotNull
    private DriverOnlineStatus status;
}
