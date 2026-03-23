package dat_mui_grab.datmuigrab.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import dat_mui_grab.datmuigrab.entity.Driver;
import dat_mui_grab.datmuigrab.entity.DriverCompanyRegistration;
import dat_mui_grab.datmuigrab.entity.TransportCompany;
import dat_mui_grab.datmuigrab.entity.enums.RegistrationStatus;

@Repository
public interface DriverCompanyRegistrationRepository extends JpaRepository<DriverCompanyRegistration, UUID> {

    @EntityGraph(attributePaths = {"driver", "company"})
    List<DriverCompanyRegistration> findAllByDriver(Driver driver);

    @EntityGraph(attributePaths = {"driver", "company"})
    List<DriverCompanyRegistration> findAllByCompanyAndStatus(TransportCompany company, RegistrationStatus status);

    List<DriverCompanyRegistration> findAllByCompany(TransportCompany company);

    Optional<DriverCompanyRegistration> findByDriverAndCompany(Driver driver, TransportCompany company);

    boolean existsByDriverAndCompany(Driver driver, TransportCompany company);
}
