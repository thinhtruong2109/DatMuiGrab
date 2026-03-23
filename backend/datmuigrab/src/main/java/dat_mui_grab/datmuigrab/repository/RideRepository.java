package dat_mui_grab.datmuigrab.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import dat_mui_grab.datmuigrab.entity.Driver;
import dat_mui_grab.datmuigrab.entity.Ride;
import dat_mui_grab.datmuigrab.entity.TransportCompany;
import dat_mui_grab.datmuigrab.entity.User;

@Repository
public interface RideRepository extends JpaRepository<Ride, UUID> {

    @EntityGraph(attributePaths = {"customer", "company", "driver", "driver.user"})
    @Override
    Optional<Ride> findById(UUID id);

    @EntityGraph(attributePaths = {"customer", "company", "driver", "driver.user"})
    List<Ride> findAllByCustomerOrderByCreatedAtDesc(User customer);

    @EntityGraph(attributePaths = {"customer", "company", "driver", "driver.user"})
    List<Ride> findAllByDriverOrderByCreatedAtDesc(Driver driver);

    @EntityGraph(attributePaths = {"customer", "company", "driver", "driver.user"})
    List<Ride> findAllByCompanyOrderByCreatedAtDesc(TransportCompany company);
}
