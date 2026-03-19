package dat_mui_grab.datmuigrab.service;

import dat_mui_grab.datmuigrab.entity.Driver;
import dat_mui_grab.datmuigrab.repository.DriverRepository;
import dat_mui_grab.datmuigrab.repository.RideRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class QuarterlyReputationJob {

    private final DriverRepository driverRepository;

    @Scheduled(cron = "0 0 1 1,4,7,10 *")
    @Transactional
    public void addQuarterlyBonus() {
        log.info("Bat dau cong diem thuong hang quy cho tai xe...");

        List<Driver> drivers = driverRepository.findAll();
        int count = 0;

        for (Driver driver : drivers) {
            if (driver.getReputationScore() == null) continue;
            if (driver.getTotalRatings() == 0) continue;

            BigDecimal current = driver.getReputationScore();
            BigDecimal maxScore = BigDecimal.valueOf(5.0);
            BigDecimal bonus = BigDecimal.valueOf(0.1);

            BigDecimal newScore = current.add(bonus);
            if (newScore.compareTo(maxScore) > 0) {
                newScore = maxScore;
            }

            driver.setReputationScore(newScore.setScale(1, RoundingMode.HALF_UP));
            driverRepository.save(driver);
            count++;
        }

        log.info("Da cong diem thuong cho {} tai xe", count);
    }
}
