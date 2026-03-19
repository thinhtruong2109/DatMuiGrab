package dat_mui_grab.datmuigrab.controller;

import java.util.Map;
import java.util.UUID;

import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.stereotype.Controller;

import dat_mui_grab.datmuigrab.dto.request.ChatMessageRequest;
import dat_mui_grab.datmuigrab.dto.request.LocationRequest;
import dat_mui_grab.datmuigrab.service.ChatService;
import dat_mui_grab.datmuigrab.service.LocationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Controller
@RequiredArgsConstructor
public class WebSocketController {

    private final ChatService chatService;
    private final LocationService locationService;

    @MessageMapping("/chat/{rideId}")
    public void handleChat(
            @DestinationVariable String rideId,
            @Payload ChatMessageRequest request,
            SimpMessageHeaderAccessor headerAccessor) {

        String userId = getUserIdFromSession(headerAccessor);
        if (userId == null) {
            log.warn("WebSocket chat: userId not found in session for rideId={}", rideId);
            return;
        }

        try {
            chatService.sendMessage(UUID.fromString(rideId), UUID.fromString(userId), request);
        } catch (Exception e) {
            log.error("Error sending chat message: {}", e.getMessage());
        }
    }

    @MessageMapping("/location/{rideId}")
    public void handleLocationForRide(
            @DestinationVariable String rideId,
            @Payload LocationRequest request,
            SimpMessageHeaderAccessor headerAccessor) {

        String userId = getUserIdFromSession(headerAccessor);
        if (userId == null) {
            log.warn("WebSocket location: userId not found in session for rideId={}", rideId);
            return;
        }

        try {
            locationService.broadcastLocation(UUID.fromString(userId), request);
            locationService.broadcastLocationForRide(UUID.fromString(rideId), request);
        } catch (Exception e) {
            log.error("Error broadcasting location for ride: {}", e.getMessage());
        }
    }

    @MessageMapping("/location/broadcast")
    public void handleLocationBroadcast(
            @Payload LocationRequest request,
            SimpMessageHeaderAccessor headerAccessor) {

        String userId = getUserIdFromSession(headerAccessor);
        if (userId == null) {
            log.warn("WebSocket location broadcast: userId not found in session");
            return;
        }

        try {
            locationService.broadcastLocation(UUID.fromString(userId), request);
        } catch (Exception e) {
            log.error("Error broadcasting location: {}", e.getMessage());
        }
    }

    private String getUserIdFromSession(SimpMessageHeaderAccessor headerAccessor) {
        Map<String, Object> sessionAttributes = headerAccessor.getSessionAttributes();
        if (sessionAttributes == null) return null;
        Object userId = sessionAttributes.get("userId");
        return userId != null ? userId.toString() : null;
    }
}