package dat_mui_grab.datmuigrab.service;

import dat_mui_grab.datmuigrab.dto.request.ChatMessageRequest;
import dat_mui_grab.datmuigrab.dto.response.ChatMessageResponse;
import dat_mui_grab.datmuigrab.entity.ChatMessage;
import dat_mui_grab.datmuigrab.entity.Ride;
import dat_mui_grab.datmuigrab.entity.User;
import dat_mui_grab.datmuigrab.entity.enums.SenderRole;
import dat_mui_grab.datmuigrab.entity.enums.UserRole;
import dat_mui_grab.datmuigrab.exception.AppException;
import dat_mui_grab.datmuigrab.exception.ErrorCode;
import dat_mui_grab.datmuigrab.repository.ChatMessageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ChatService {

    private final ChatMessageRepository chatMessageRepository;
    private final RideService rideService;
    private final UserService userService;
    private final SimpMessagingTemplate messagingTemplate;

    public List<ChatMessageResponse> getMessages(UUID rideId) {
        return chatMessageRepository.findAllByRideIdOrderBySentAtAsc(rideId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public ChatMessageResponse sendMessage(UUID rideId, UUID senderId, ChatMessageRequest request) {
        Ride ride = rideService.findById(rideId);
        User sender = userService.findById(senderId);

        SenderRole senderRole = sender.getRole() == UserRole.DRIVER
                ? SenderRole.DRIVER : SenderRole.CUSTOMER;

        ChatMessage message = ChatMessage.builder()
                .ride(ride)
                .sender(sender)
                .senderRole(senderRole)
                .message(request.getMessage())
                .build();

        message = chatMessageRepository.save(message);
        ChatMessageResponse response = mapToResponse(message);

        messagingTemplate.convertAndSend("/topic/ride/" + rideId + "/chat", response);

        return response;
    }

    private ChatMessageResponse mapToResponse(ChatMessage msg) {
        return ChatMessageResponse.builder()
                .id(msg.getId())
                .rideId(msg.getRide().getId())
                .senderId(msg.getSender().getId())
                .senderRole(msg.getSenderRole())
                .message(msg.getMessage())
                .sentAt(msg.getSentAt())
                .build();
    }
}
