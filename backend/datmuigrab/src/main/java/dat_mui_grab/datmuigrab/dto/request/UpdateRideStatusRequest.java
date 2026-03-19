package dat_mui_grab.datmuigrab.dto.request;

import dat_mui_grab.datmuigrab.entity.enums.RideStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class UpdateRideStatusRequest {

    @NotNull
    private RideStatus status;
}
