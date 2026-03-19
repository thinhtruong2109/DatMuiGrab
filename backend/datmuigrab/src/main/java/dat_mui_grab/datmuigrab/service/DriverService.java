package dat_mui_grab.datmuigrab.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import dat_mui_grab.datmuigrab.dto.request.BanDriverRequest;
import dat_mui_grab.datmuigrab.dto.request.DriverRegistrationRequest;
import dat_mui_grab.datmuigrab.dto.request.RejectRegistrationRequest;
import dat_mui_grab.datmuigrab.dto.request.UpdateDriverRequest;
import dat_mui_grab.datmuigrab.dto.request.UpdateDriverStatusRequest;
import dat_mui_grab.datmuigrab.dto.response.DriverRegistrationResponse;
import dat_mui_grab.datmuigrab.dto.response.DriverResponse;
import dat_mui_grab.datmuigrab.entity.Driver;
import dat_mui_grab.datmuigrab.entity.DriverCompanyRegistration;
import dat_mui_grab.datmuigrab.entity.TransportCompany;
import dat_mui_grab.datmuigrab.entity.User;
import dat_mui_grab.datmuigrab.entity.enums.DriverOnlineStatus;
import dat_mui_grab.datmuigrab.entity.enums.RegistrationStatus;
import dat_mui_grab.datmuigrab.entity.enums.UserStatus;
import dat_mui_grab.datmuigrab.exception.AppException;
import dat_mui_grab.datmuigrab.exception.ErrorCode;
import dat_mui_grab.datmuigrab.repository.DriverCompanyRegistrationRepository;
import dat_mui_grab.datmuigrab.repository.DriverRepository;
import dat_mui_grab.datmuigrab.repository.TransportCompanyRepository;
import dat_mui_grab.datmuigrab.repository.UserRepository;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class DriverService {

    private final DriverRepository driverRepository;
    private final UserRepository userRepository;
    private final DriverCompanyRegistrationRepository registrationRepository;
    private final TransportCompanyRepository companyRepository;
    private final RedisService redisService;

    public DriverResponse getMe(UUID userId) {
        Driver driver = findByUserId(userId);
        return mapToResponse(driver);
    }

    @Transactional
    public DriverResponse updateMe(UUID userId, UpdateDriverRequest request) {
        Driver driver = findByUserId(userId);

        if (request.getLicenseNumber() != null) driver.setLicenseNumber(request.getLicenseNumber());
        if (request.getIdCardNumber() != null) driver.setIdCardNumber(request.getIdCardNumber());
        if (request.getVehiclePlate() != null) driver.setVehiclePlate(request.getVehiclePlate());
        if (request.getVehicleType() != null) driver.setVehicleType(request.getVehicleType());
        if (request.getVehicleModel() != null) driver.setVehicleModel(request.getVehicleModel());

        return mapToResponse(driverRepository.save(driver));
    }

    @Transactional
    public void setStatus(UUID userId, UpdateDriverStatusRequest request) {
        Driver driver = findByUserId(userId);

        if (driver.getOnlineStatus() == DriverOnlineStatus.BUSY) {
            throw new AppException(ErrorCode.VALIDATION_ERROR,
                    "Khong the thay doi trang thai khi dang chay cuoc");
        }

        User user = driver.getUser();
        if (user.getStatus() == UserStatus.SUSPENDED || user.getStatus() == UserStatus.BANNED) {
            throw new AppException(ErrorCode.VALIDATION_ERROR,
                    "Tai khoan bi han che, khong the bat online");
        }

        driver.setOnlineStatus(request.getStatus());
        driverRepository.save(driver);

        if (request.getStatus() == DriverOnlineStatus.OFFLINE) {
            redisService.removeDriverLocation(driver.getId().toString());
        }
    }

    public List<DriverResponse> getByCompany(UUID companyId) {
        return driverRepository.findActiveDriversByCompanyId(companyId)
                .stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Transactional
    public void banDriver(UUID driverId, BanDriverRequest request) {
        Driver driver = findById(driverId);
        User user = driver.getUser();
        user.setStatus(UserStatus.BANNED);
        userRepository.save(user);

        driver.setOnlineStatus(DriverOnlineStatus.OFFLINE);
        driverRepository.save(driver);
        redisService.removeDriverLocation(driverId.toString());
        redisService.releaseDriverLock(driverId.toString());
    }

    @Transactional
    public DriverRegistrationResponse registerToCompany(UUID userId,
                                                         DriverRegistrationRequest request) {
        Driver driver = findByUserId(userId);
        TransportCompany company = companyRepository.findById(request.getCompanyId())
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Khong tim thay cong ty"));

        if (registrationRepository.existsByDriverAndCompany(driver, company)) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "Da dang ky vao cong ty nay roi");
        }

        if (request.getVehiclePlate() != null) driver.setVehiclePlate(request.getVehiclePlate());
        if (request.getVehicleType() != null) driver.setVehicleType(request.getVehicleType());
        if (request.getVehicleModel() != null) driver.setVehicleModel(request.getVehicleModel());
        if (request.getLicenseNumber() != null) driver.setLicenseNumber(request.getLicenseNumber());
        if (request.getIdCardNumber() != null) driver.setIdCardNumber(request.getIdCardNumber());
        if (request.getPhoneNumber() != null) driver.setPhoneNumber(request.getPhoneNumber());
        driverRepository.save(driver);

        DriverCompanyRegistration registration = DriverCompanyRegistration.builder()
                .driver(driver)
                .company(company)
                .status(RegistrationStatus.PENDING)
                .build();

        return mapToRegistrationResponse(registrationRepository.save(registration));
    }

    public List<DriverRegistrationResponse> getMyRegistrations(UUID userId) {
        Driver driver = findByUserId(userId);
        return registrationRepository.findAllByDriver(driver)
                .stream().map(this::mapToRegistrationResponse).collect(Collectors.toList());
    }

    public List<DriverRegistrationResponse> getPendingByCompany(UUID companyId) {
        TransportCompany company = companyRepository.findById(companyId)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Khong tim thay cong ty"));
        return registrationRepository.findAllByCompanyAndStatus(company, RegistrationStatus.PENDING)
                .stream().map(this::mapToRegistrationResponse).collect(Collectors.toList());
    }

    @Transactional
    public void approveRegistration(UUID registrationId) {
        DriverCompanyRegistration reg = findRegistrationById(registrationId);
        reg.setStatus(RegistrationStatus.ACTIVE);
        reg.setApprovedAt(LocalDateTime.now());
        registrationRepository.save(reg);
    }

    @Transactional
    public void rejectRegistration(UUID registrationId, RejectRegistrationRequest request) {
        DriverCompanyRegistration reg = findRegistrationById(registrationId);
        reg.setStatus(RegistrationStatus.REJECTED);
        reg.setNote(request.getNote());
        registrationRepository.save(reg);
    }

    public Driver findByUser(User user) {
        return driverRepository.findByUser(user)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Khong tim thay tai xe"));
    }

    public Driver findByUserId(UUID userId) {
        return driverRepository.findByUserId(userId)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Khong tim thay tai xe"));
    }

    public Driver findById(UUID driverId) {
        return driverRepository.findById(driverId)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Khong tim thay tai xe"));
    }

    private DriverCompanyRegistration findRegistrationById(UUID id) {
        return registrationRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Khong tim thay dang ky"));
    }

    public DriverResponse mapToResponse(Driver driver) {
        return DriverResponse.builder()
                .id(driver.getId())
                .userId(driver.getUser().getId())
                .fullName(driver.getUser().getFullName())
                .phoneNumber(driver.getPhoneNumber())
                .licenseNumber(driver.getLicenseNumber())
                .idCardNumber(driver.getIdCardNumber())
                .vehiclePlate(driver.getVehiclePlate())
                .vehicleType(driver.getVehicleType())
                .vehicleModel(driver.getVehicleModel())
                .reputationScore(driver.getReputationScore())
                .totalRatings(driver.getTotalRatings())
                .onlineStatus(driver.getOnlineStatus())
                .currentLat(driver.getCurrentLat())
                .currentLng(driver.getCurrentLng())
                .build();
    }

    public DriverRegistrationResponse mapToRegistrationResponse(DriverCompanyRegistration reg) {
        return DriverRegistrationResponse.builder()
                .id(reg.getId())
                .driverId(reg.getDriver().getId())
                .companyId(reg.getCompany().getId())
                .companyName(reg.getCompany().getCompanyName())
                .status(reg.getStatus())
                .appliedAt(reg.getAppliedAt())
                .approvedAt(reg.getApprovedAt())
                .note(reg.getNote())
                .build();
    }
}