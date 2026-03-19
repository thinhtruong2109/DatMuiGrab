package dat_mui_grab.datmuigrab.service;

import dat_mui_grab.datmuigrab.dto.request.LoginRequest;
import dat_mui_grab.datmuigrab.dto.request.RegisterRequest;
import dat_mui_grab.datmuigrab.dto.request.VerifyEmailRequest;
import dat_mui_grab.datmuigrab.dto.response.AuthResponse;
import dat_mui_grab.datmuigrab.dto.response.UserResponse;
import dat_mui_grab.datmuigrab.entity.Driver;
import dat_mui_grab.datmuigrab.entity.User;
import dat_mui_grab.datmuigrab.entity.enums.UserRole;
import dat_mui_grab.datmuigrab.entity.enums.UserStatus;
import dat_mui_grab.datmuigrab.exception.AppException;
import dat_mui_grab.datmuigrab.exception.ErrorCode;
import dat_mui_grab.datmuigrab.repository.DriverRepository;
import dat_mui_grab.datmuigrab.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final DriverRepository driverRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final RedisService redisService;
    private final EmailService emailService;

    @Transactional
    public void register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "Email da duoc su dung");
        }

        User user = User.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName())
                .phoneNumber(request.getPhoneNumber())
                .role(request.getRole())
                .status(UserStatus.INACTIVE)
                .build();

        user = userRepository.save(user);

        if (request.getRole() == UserRole.DRIVER) {
            Driver driver = Driver.builder()
                    .user(user)
                    .phoneNumber(request.getPhoneNumber())
                    .build();
            driverRepository.save(driver);
        }

        String otp = generateOtp();
        redisService.saveOtp(request.getEmail(), otp);
        emailService.sendOtp(request.getEmail(), otp);
    }

    @Transactional
    public void verifyEmail(VerifyEmailRequest request) {
        String storedOtp = redisService.getOtp(request.getEmail());
        if (storedOtp == null || !storedOtp.equals(request.getOtp())) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "OTP khong hop le hoac da het han");
        }

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Khong tim thay nguoi dung"));

        user.setStatus(UserStatus.ACTIVE);
        userRepository.save(user);
        redisService.deleteOtp(request.getEmail());
    }

    public void resendOtp(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Khong tim thay nguoi dung"));

        if (user.getStatus() == UserStatus.ACTIVE) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "Tai khoan da duoc xac thuc");
        }

        String otp = generateOtp();
        redisService.saveOtp(email, otp);
        emailService.sendOtp(email, otp);
    }

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new AppException(ErrorCode.VALIDATION_ERROR, "Email hoac mat khau khong dung"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "Email hoac mat khau khong dung");
        }

        if (user.getStatus() == UserStatus.INACTIVE) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "Tai khoan chua duoc xac thuc email");
        }

        if (user.getStatus() == UserStatus.BANNED) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "Tai khoan da bi khoa");
        }

        if (user.getStatus() == UserStatus.SUSPENDED) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "Tai khoan dang bi tam hoan");
        }

        String accessToken = jwtService.generateAccessToken(user.getId(), user.getRole().name());
        String refreshToken = jwtService.generateRefreshToken(user.getId());

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .user(mapToUserResponse(user))
                .build();
    }

    public AuthResponse refreshToken(String refreshToken) {
        if (!jwtService.isTokenValid(refreshToken)) {
            throw new AppException(ErrorCode.UNAUTHORIZED, "Refresh token khong hop le");
        }

        String userId = jwtService.extractUserId(refreshToken);
        User user = userRepository.findById(UUID.fromString(userId))
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Khong tim thay nguoi dung"));

        String newAccessToken = jwtService.generateAccessToken(user.getId(), user.getRole().name());
        String newRefreshToken = jwtService.generateRefreshToken(user.getId());

        return AuthResponse.builder()
                .accessToken(newAccessToken)
                .refreshToken(newRefreshToken)
                .user(mapToUserResponse(user))
                .build();
    }

    public void logout(String token) {
        if (token != null && jwtService.isTokenValid(token)) {
            Duration ttl = Duration.between(
                    Instant.now(),
                    jwtService.extractExpiration(token).toInstant()
            );
            if (!ttl.isNegative()) {
                redisService.blacklistToken(token, ttl);
            }
        }
    }

    private String generateOtp() {
        SecureRandom random = new SecureRandom();
        int otp = 100000 + random.nextInt(900000);
        return String.valueOf(otp);
    }

    public UserResponse mapToUserResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .phoneNumber(user.getPhoneNumber())
                .role(user.getRole())
                .status(user.getStatus())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
