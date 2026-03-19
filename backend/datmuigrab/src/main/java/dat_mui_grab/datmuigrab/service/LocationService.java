package dat_mui_grab.datmuigrab.service;

import dat_mui_grab.datmuigrab.dto.request.LocationRequest;
import dat_mui_grab.datmuigrab.entity.Driver;
import dat_mui_grab.datmuigrab.repository.DriverRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class LocationService {

    private final RedisService redisService;
    private final DriverService driverService;
    private final DriverRepository driverRepository;
    private final SimpMessagingTemplate messagingTemplate;

    public void broadcastLocation(UUID driverUserId, LocationRequest request) {
        Driver driver = driverService.findByUserId(driverUserId);

        redisService.saveDriverLocation(
                driver.getId().toString(),
                request.getLat(),
                request.getLng()
        );

        driver.setCurrentLat(BigDecimal.valueOf(request.getLat()));
        driver.setCurrentLng(BigDecimal.valueOf(request.getLng()));
        driverRepository.save(driver);
    }

    public void broadcastLocationForRide(UUID rideId, LocationRequest request) {
        messagingTemplate.convertAndSend(
                "/topic/ride/" + rideId + "/location",
                request
        );
    }
}
