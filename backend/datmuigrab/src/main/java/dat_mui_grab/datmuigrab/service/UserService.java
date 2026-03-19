package dat_mui_grab.datmuigrab.service;

import dat_mui_grab.datmuigrab.dto.request.ChangePasswordRequest;
import dat_mui_grab.datmuigrab.dto.request.UpdateUserRequest;
import dat_mui_grab.datmuigrab.dto.response.UserResponse;
import dat_mui_grab.datmuigrab.entity.User;
import dat_mui_grab.datmuigrab.entity.enums.UserStatus;
import dat_mui_grab.datmuigrab.exception.AppException;
import dat_mui_grab.datmuigrab.exception.ErrorCode;
import dat_mui_grab.datmuigrab.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthService authService;

    public UserResponse getMe(UUID userId) {
        User user = findById(userId);
        return authService.mapToUserResponse(user);
    }

    @Transactional
    public UserResponse updateMe(UUID userId, UpdateUserRequest request) {
        User user = findById(userId);

        if (request.getFullName() != null) {
            user.setFullName(request.getFullName());
        }
        if (request.getPhoneNumber() != null) {
            user.setPhoneNumber(request.getPhoneNumber());
        }

        userRepository.save(user);
        return authService.mapToUserResponse(user);
    }

    @Transactional
    public void changePassword(UUID userId, ChangePasswordRequest request) {
        User user = findById(userId);

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "Mat khau hien tai khong dung");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }

    public List<UserResponse> getAllUsers() {
        return userRepository.findAll().stream()
                .map(authService::mapToUserResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public void banUser(UUID userId) {
        User user = findById(userId);
        user.setStatus(UserStatus.BANNED);
        userRepository.save(user);
    }

    @Transactional
    public void unbanUser(UUID userId) {
        User user = findById(userId);
        user.setStatus(UserStatus.ACTIVE);
        userRepository.save(user);
    }

    public User findById(UUID userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Khong tim thay nguoi dung"));
    }
}
