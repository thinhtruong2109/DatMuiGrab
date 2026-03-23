package dat_mui_grab.datmuigrab.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import dat_mui_grab.datmuigrab.entity.ChatMessage;
import dat_mui_grab.datmuigrab.entity.Ride;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, UUID> {

    @EntityGraph(attributePaths = {"ride", "sender"})
    List<ChatMessage> findAllByRideOrderBySentAtAsc(Ride ride);

    @EntityGraph(attributePaths = {"ride", "sender"})
    List<ChatMessage> findAllByRideIdOrderBySentAtAsc(UUID rideId);
}
