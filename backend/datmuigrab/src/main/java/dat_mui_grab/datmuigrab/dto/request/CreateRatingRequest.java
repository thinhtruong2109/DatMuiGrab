package dat_mui_grab.datmuigrab.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

@Data
public class CreateRatingRequest {

    @NotNull
    private UUID rideId;

    @NotNull
    @Min(1)
    @Max(5)
    private Integer stars;

    private String comment;
}
