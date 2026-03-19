package dat_mui_grab.datmuigrab.dto.request;

import dat_mui_grab.datmuigrab.entity.enums.AppealStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ResolveAppealRequest {

    @NotNull
    private AppealStatus status;

    private String adminNote;
}
