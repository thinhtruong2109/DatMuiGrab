package dat_mui_grab.datmuigrab.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Locale;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class OsrmService {

    private final WebClient osrmWebClient;

    @SuppressWarnings("unchecked")
    public BigDecimal getDistanceKm(double pickupLat, double pickupLng,
                                    double destLat, double destLng) {
        try {
            String url = String.format(
                    Locale.US,
                    "/route/v1/driving/%f,%f;%f,%f?overview=false",
                    pickupLng, pickupLat, destLng, destLat
            );

            Map<String, Object> response = osrmWebClient.get()
                    .uri(url)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();

            if (response != null && response.containsKey("routes")) {
                List<Map<String, Object>> routes = (List<Map<String, Object>>) response.get("routes");
                if (!routes.isEmpty()) {
                    Map<String, Object> route = routes.get(0);
                    Number distanceMeters = (Number) route.get("distance");
                    double km = distanceMeters.doubleValue() / 1000.0;
                    return BigDecimal.valueOf(km).setScale(3, RoundingMode.HALF_UP);
                }
            }
        } catch (Exception e) {
            log.warn("OSRM API error, dung haversine fallback: {}", e.getMessage());
        }

        return haversineDistance(pickupLat, pickupLng, destLat, destLng);
    }

    private BigDecimal haversineDistance(double lat1, double lng1, double lat2, double lng2) {
        final int R = 6371;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLng = Math.toRadians(lng2 - lng1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLng / 2) * Math.sin(dLng / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        double distance = R * c;
        return BigDecimal.valueOf(distance).setScale(3, RoundingMode.HALF_UP);
    }
}
