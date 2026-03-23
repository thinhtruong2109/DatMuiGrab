package dat_mui_grab.datmuigrab.repository;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import dat_mui_grab.datmuigrab.entity.Payment;
import dat_mui_grab.datmuigrab.entity.Ride;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, UUID> {

    @EntityGraph(attributePaths = {"ride", "customer"})
    Optional<Payment> findByRide(Ride ride);

    @EntityGraph(attributePaths = {"ride", "customer"})
    Optional<Payment> findByRideId(UUID rideId);
}
