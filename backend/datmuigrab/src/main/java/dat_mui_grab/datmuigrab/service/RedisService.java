package dat_mui_grab.datmuigrab.service;

import java.time.Duration;

import org.springframework.data.geo.Point;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

@Service
public class RedisService {

    private final RedisTemplate<String, Object> redisTemplate;

    private static final String GEO_KEY = "drivers:geo";
    private static final Duration DRIVER_LOCATION_TTL = Duration.ofSeconds(90);
    private static final Duration DRIVER_PENDING_RIDE_TTL = Duration.ofMinutes(2);

    public RedisService(RedisTemplate<String, Object> redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    // ── OTP ────────────────────────────────────────────────
    public void saveOtp(String email, String otp) {
        redisTemplate.opsForValue().set("otp:" + email, otp, Duration.ofMinutes(5));
    }

    public String getOtp(String email) {
        Object val = redisTemplate.opsForValue().get("otp:" + email);
        return val != null ? val.toString() : null;
    }

    public void deleteOtp(String email) {
        redisTemplate.delete("otp:" + email);
    }

    // ── Driver location ────────────────────────────────────
    public void saveDriverLocation(String driverId, double lat, double lng) {
        redisTemplate.opsForValue().set(
                "driver:location:" + driverId,
                lat + "," + lng,
                DRIVER_LOCATION_TTL
        );
        redisTemplate.opsForGeo().add(GEO_KEY, new Point(lng, lat), driverId);
    }

    public String getDriverLocation(String driverId) {
        Object val = redisTemplate.opsForValue().get("driver:location:" + driverId);
        return val != null ? val.toString() : null;
    }

    public void removeDriverLocation(String driverId) {
        redisTemplate.delete("driver:location:" + driverId);
        redisTemplate.opsForGeo().remove(GEO_KEY, (Object) driverId);
    }

    // ── Distributed lock ───────────────────────────────────
    public boolean acquireDriverLock(String driverId) {
        Boolean acquired = redisTemplate.opsForValue()
                .setIfAbsent("lock:driver:" + driverId, "locked", Duration.ofSeconds(10));
        return Boolean.TRUE.equals(acquired);
    }

    public void releaseDriverLock(String driverId) {
        redisTemplate.delete("lock:driver:" + driverId);
    }

    // ── Token blacklist ────────────────────────────────────
    public void blacklistToken(String token, Duration ttl) {
        redisTemplate.opsForValue().set("blacklist:" + token, "revoked", ttl);
    }

    public boolean isTokenBlacklisted(String token) {
        return Boolean.TRUE.equals(redisTemplate.hasKey("blacklist:" + token));
    }

    // ── Driver online status (BUSY flag) ───────────────────
    public void setDriverBusy(String driverId) {
        redisTemplate.opsForValue().set("driver:status:" + driverId, "BUSY");
    }

    public void setDriverOnline(String driverId) {
        redisTemplate.delete("driver:status:" + driverId);
    }

    public boolean isDriverBusy(String driverId) {
        return Boolean.TRUE.equals(redisTemplate.hasKey("driver:status:" + driverId));
    }

    // ── Driver pending ride recovery ──────────────────────
    public void setPendingRideForDriver(String driverId, String rideId) {
        redisTemplate.opsForValue().set(
                "driver:pending-ride:" + driverId,
                rideId,
                DRIVER_PENDING_RIDE_TTL
        );
    }

    public String getPendingRideForDriver(String driverId) {
        Object val = redisTemplate.opsForValue().get("driver:pending-ride:" + driverId);
        return val != null ? val.toString() : null;
    }

    public void clearPendingRideForDriver(String driverId) {
        redisTemplate.delete("driver:pending-ride:" + driverId);
    }
}
