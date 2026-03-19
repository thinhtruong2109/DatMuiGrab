package dat_mui_grab.datmuigrab.service;

import dat_mui_grab.datmuigrab.dto.request.CreateAppealRequest;
import dat_mui_grab.datmuigrab.dto.request.ResolveAppealRequest;
import dat_mui_grab.datmuigrab.dto.response.AppealResponse;
import dat_mui_grab.datmuigrab.entity.Driver;
import dat_mui_grab.datmuigrab.entity.ReputationAppeal;
import dat_mui_grab.datmuigrab.entity.User;
import dat_mui_grab.datmuigrab.entity.enums.AppealStatus;
import dat_mui_grab.datmuigrab.entity.enums.AppealedBy;
import dat_mui_grab.datmuigrab.entity.enums.UserRole;
import dat_mui_grab.datmuigrab.entity.enums.UserStatus;
import dat_mui_grab.datmuigrab.exception.AppException;
import dat_mui_grab.datmuigrab.exception.ErrorCode;
import dat_mui_grab.datmuigrab.repository.ReputationAppealRepository;
import dat_mui_grab.datmuigrab.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AppealService {

    private final ReputationAppealRepository appealRepository;
    private final DriverService driverService;
    private final UserService userService;
    private final UserRepository userRepository;

    @Transactional
    public AppealResponse createAppeal(UUID requesterId, CreateAppealRequest request) {
        User requester = userService.findById(requesterId);
        Driver driver = driverService.findById(request.getDriverId());

        AppealedBy appealedBy = requester.getRole() == UserRole.DRIVER
                ? AppealedBy.DRIVER : AppealedBy.COMPANY;

        ReputationAppeal appeal = ReputationAppeal.builder()
                .driver(driver)
                .appealedBy(appealedBy)
                .appealedByUser(requester)
                .reason(request.getReason())
                .status(AppealStatus.PENDING)
                .build();

        return mapToResponse(appealRepository.save(appeal));
    }

    public List<AppealResponse> getAllAppeals() {
        return appealRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public AppealResponse resolveAppeal(UUID appealId, UUID adminId, ResolveAppealRequest request) {
        ReputationAppeal appeal = appealRepository.findById(appealId)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Khong tim thay khang cao"));

        User admin = userService.findById(adminId);

        appeal.setStatus(request.getStatus());
        appeal.setAdminNote(request.getAdminNote());
        appeal.setResolvedBy(admin);
        appeal.setResolvedAt(LocalDateTime.now());

        if (request.getStatus() == AppealStatus.APPROVED) {
            Driver driver = appeal.getDriver();
            User driverUser = driver.getUser();
            driverUser.setStatus(UserStatus.ACTIVE);
            userRepository.save(driverUser);
        }

        return mapToResponse(appealRepository.save(appeal));
    }

    private AppealResponse mapToResponse(ReputationAppeal appeal) {
        return AppealResponse.builder()
                .id(appeal.getId())
                .driverId(appeal.getDriver().getId())
                .driverName(appeal.getDriver().getUser().getFullName())
                .appealedBy(appeal.getAppealedBy())
                .appealedByUserId(appeal.getAppealedByUser().getId())
                .reason(appeal.getReason())
                .status(appeal.getStatus())
                .adminNote(appeal.getAdminNote())
                .createdAt(appeal.getCreatedAt())
                .resolvedAt(appeal.getResolvedAt())
                .build();
    }
}
