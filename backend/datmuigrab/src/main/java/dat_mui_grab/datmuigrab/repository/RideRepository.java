package dat_mui_grab.datmuigrab.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import dat_mui_grab.datmuigrab.entity.Driver;
import dat_mui_grab.datmuigrab.entity.Ride;
import dat_mui_grab.datmuigrab.entity.TransportCompany;
import dat_mui_grab.datmuigrab.entity.User;

@Repository
public interface RideRepository extends JpaRepository<Ride, UUID> {

    List<Ride> findAllByCustomerOrderByCreatedAtDesc(User customer);

    List<Ride> findAllByDriverOrderByCreatedAtDesc(Driver driver);

    List<Ride> findAllByCompanyOrderByCreatedAtDesc(TransportCompany company);
}
