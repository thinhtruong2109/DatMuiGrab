package dat_mui_grab.datmuigrab.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import dat_mui_grab.datmuigrab.entity.Driver;
import dat_mui_grab.datmuigrab.entity.User;
import dat_mui_grab.datmuigrab.entity.enums.DriverOnlineStatus;

@Repository
public interface DriverRepository extends JpaRepository<Driver, UUID> {

    Optional<Driver> findByUser(User user);

    Optional<Driver> findByUserId(UUID userId);

    @Query("SELECT d FROM Driver d WHERE d.onlineStatus = :status")
    List<Driver> findAllByOnlineStatus(@Param("status") DriverOnlineStatus status);

    @Query("""
        SELECT d FROM Driver d
        JOIN DriverCompanyRegistration r ON r.driver = d
        WHERE r.company.id = :companyId
          AND r.status = dat_mui_grab.datmuigrab.entity.enums.RegistrationStatus.ACTIVE
    """)
    List<Driver> findActiveDriversByCompanyId(@Param("companyId") UUID companyId);

    @Query("""
        SELECT d FROM Driver d
        JOIN DriverCompanyRegistration r ON r.driver = d
        WHERE r.company.id = :companyId
          AND r.status = dat_mui_grab.datmuigrab.entity.enums.RegistrationStatus.ACTIVE
          AND d.onlineStatus = dat_mui_grab.datmuigrab.entity.enums.DriverOnlineStatus.ONLINE
          AND d.user.status = dat_mui_grab.datmuigrab.entity.enums.UserStatus.ACTIVE
          AND (d.reputationScore IS NULL OR d.reputationScore >= 3.0)
    """)
    List<Driver> findAvailableDriversByCompanyId(@Param("companyId") UUID companyId);
}
