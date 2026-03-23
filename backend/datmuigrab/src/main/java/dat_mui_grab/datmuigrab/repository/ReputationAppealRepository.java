package dat_mui_grab.datmuigrab.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import dat_mui_grab.datmuigrab.entity.ReputationAppeal;
import dat_mui_grab.datmuigrab.entity.enums.AppealStatus;

@Repository
public interface ReputationAppealRepository extends JpaRepository<ReputationAppeal, UUID> {

    @EntityGraph(attributePaths = {"driver", "driver.user", "appealedByUser", "resolvedBy"})
    List<ReputationAppeal> findAllByOrderByCreatedAtDesc();

    @EntityGraph(attributePaths = {"driver", "driver.user", "appealedByUser", "resolvedBy"})
    List<ReputationAppeal> findAllByStatus(AppealStatus status);
}
