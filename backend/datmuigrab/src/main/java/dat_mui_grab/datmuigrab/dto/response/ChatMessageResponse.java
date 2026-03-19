package dat_mui_grab.datmuigrab.dto.response;

import dat_mui_grab.datmuigrab.entity.enums.SenderRole;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class ChatMessageResponse {
    private UUID id;
    private UUID rideId;
    private UUID senderId;
    private SenderRole senderRole;
    private String message;
    private LocalDateTime sentAt;
}
