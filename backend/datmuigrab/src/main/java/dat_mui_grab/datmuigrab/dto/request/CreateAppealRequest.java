package dat_mui_grab.datmuigrab.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

@Data
public class CreateAppealRequest {

    @NotNull
    private UUID driverId;

    @NotBlank
    private String reason;
}
