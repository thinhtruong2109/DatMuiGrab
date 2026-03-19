package dat_mui_grab.datmuigrab.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class RatingResponse {
    private UUID id;
    private UUID rideId;
    private UUID customerId;
    private UUID driverId;
    private Integer stars;
    private String comment;
    private LocalDateTime createdAt;
}
