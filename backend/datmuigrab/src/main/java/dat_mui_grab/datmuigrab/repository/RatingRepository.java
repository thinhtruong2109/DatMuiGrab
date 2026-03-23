package dat_mui_grab.datmuigrab.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import dat_mui_grab.datmuigrab.entity.Driver;
import dat_mui_grab.datmuigrab.entity.Rating;
import dat_mui_grab.datmuigrab.entity.Ride;

@Repository
public interface RatingRepository extends JpaRepository<Rating, UUID> {

    @EntityGraph(attributePaths = {"ride", "customer", "driver"})
    Optional<Rating> findByRide(Ride ride);

    boolean existsByRide(Ride ride);

    @EntityGraph(attributePaths = {"ride", "customer", "driver"})
    List<Rating> findAllByDriver(Driver driver);

    @Query("SELECT AVG(r.stars) FROM Rating r WHERE r.driver = :driver")
    Double calculateAverageScoreByDriver(@Param("driver") Driver driver);
}
