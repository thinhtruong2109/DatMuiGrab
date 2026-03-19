package dat_mui_grab.datmuigrab.controller;

import dat_mui_grab.datmuigrab.dto.response.ChatMessageResponse;
import dat_mui_grab.datmuigrab.service.ChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;

    @GetMapping("/{rideId}/messages")
    @PreAuthorize("hasRole('CUSTOMER') or hasRole('DRIVER')")
    public ResponseEntity<List<ChatMessageResponse>> getMessages(@PathVariable UUID rideId) {
        return ResponseEntity.ok(chatService.getMessages(rideId));
    }
}
