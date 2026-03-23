package dat_mui_grab.datmuigrab.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import dat_mui_grab.datmuigrab.entity.TransportCompany;
import dat_mui_grab.datmuigrab.entity.User;
import dat_mui_grab.datmuigrab.entity.enums.CompanyStatus;

@Repository
public interface TransportCompanyRepository extends JpaRepository<TransportCompany, UUID> {

    @EntityGraph(attributePaths = {"user"})
    @Override
    List<TransportCompany> findAll();

    @EntityGraph(attributePaths = {"user"})
    @Override
    Optional<TransportCompany> findById(UUID id);

    @EntityGraph(attributePaths = {"user"})
    List<TransportCompany> findAllByStatus(CompanyStatus status);

    @EntityGraph(attributePaths = {"user"})
    Optional<TransportCompany> findByUser(User user);

    @EntityGraph(attributePaths = {"user"})
    Optional<TransportCompany> findByUserId(UUID userId);
}
