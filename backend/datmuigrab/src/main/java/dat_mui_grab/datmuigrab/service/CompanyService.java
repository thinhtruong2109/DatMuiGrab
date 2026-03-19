package dat_mui_grab.datmuigrab.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.text.NumberFormat;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import dat_mui_grab.datmuigrab.dto.request.CreateCompanyRequest;
import dat_mui_grab.datmuigrab.dto.request.SuspendCompanyRequest;
import dat_mui_grab.datmuigrab.dto.request.UpdateCompanyRequest;
import dat_mui_grab.datmuigrab.dto.request.UpdatePriceRequest;
import dat_mui_grab.datmuigrab.dto.response.CompanyEstimateResponse;
import dat_mui_grab.datmuigrab.dto.response.CompanyResponse;
import dat_mui_grab.datmuigrab.entity.CompanyWallet;
import dat_mui_grab.datmuigrab.entity.TransportCompany;
import dat_mui_grab.datmuigrab.entity.User;
import dat_mui_grab.datmuigrab.entity.enums.CompanyStatus;
import dat_mui_grab.datmuigrab.exception.AppException;
import dat_mui_grab.datmuigrab.exception.ErrorCode;
import dat_mui_grab.datmuigrab.repository.CompanyWalletRepository;
import dat_mui_grab.datmuigrab.repository.TransportCompanyRepository;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class CompanyService {

    private final TransportCompanyRepository companyRepository;
    private final CompanyWalletRepository walletRepository;
    private final OsrmService osrmService;

    public List<CompanyResponse> getActiveCompanies() {
        return companyRepository.findAllByStatus(CompanyStatus.ACTIVE)
                .stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    public CompanyResponse getById(UUID companyId) {
        return mapToResponse(findById(companyId));
    }

    public List<CompanyEstimateResponse> getEstimates(double pickupLat, double pickupLng,
                                                       double destLat, double destLng) {
        BigDecimal distanceKm = osrmService.getDistanceKm(pickupLat, pickupLng, destLat, destLng);

        return companyRepository.findAllByStatus(CompanyStatus.ACTIVE)
                .stream()
                .map(company -> {
                    BigDecimal basePrice = calculatePrice(company.getPricePerKm(), distanceKm);
                    BigDecimal priceForCustomer = basePrice.multiply(BigDecimal.valueOf(1.05))
                            .setScale(0, RoundingMode.HALF_UP);

                    return CompanyEstimateResponse.builder()
                            .companyId(company.getId())
                            .companyName(company.getCompanyName())
                            .pricePerKm(company.getPricePerKm())
                            .distanceKm(distanceKm)
                            .estimatedPrice(priceForCustomer)
                            .estimatedPriceDisplay(formatCurrency(priceForCustomer) + " (da bao gom phi)")
                            .build();
                })
                .collect(Collectors.toList());
    }

    @Transactional
    public CompanyResponse createCompany(User user, CreateCompanyRequest request) {
        companyRepository.findByUser(user).ifPresent(c -> {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "Nguoi dung da co cong ty");
        });

        TransportCompany company = TransportCompany.builder()
                .user(user)
                .companyName(request.getCompanyName())
                .licenseNumber(request.getLicenseNumber())
                .address(request.getAddress())
                .description(request.getDescription())
                .pricePerKm(request.getPricePerKm())
                .driverRevenuePercent(request.getDriverRevenuePercent())
                .status(CompanyStatus.PENDING)
                .build();

        company = companyRepository.save(company);

        CompanyWallet wallet = CompanyWallet.builder()
                .company(company)
                .balance(BigDecimal.ZERO)
                .totalEarned(BigDecimal.ZERO)
                .totalWithdrawn(BigDecimal.ZERO)
                .build();
        walletRepository.save(wallet);

        return mapToResponse(company);
    }

    @Transactional
    public CompanyResponse updateCompany(UUID companyId, User user, UpdateCompanyRequest request) {
        TransportCompany company = findById(companyId);
        verifyOwner(company, user);

        if (request.getDescription() != null) {
            company.setDescription(request.getDescription());
        }
        if (request.getDriverRevenuePercent() != null) {
            company.setDriverRevenuePercent(request.getDriverRevenuePercent());
        }

        return mapToResponse(companyRepository.save(company));
    }

    @Transactional
    public void updatePrice(UUID companyId, User user, UpdatePriceRequest request) {
        TransportCompany company = findById(companyId);
        verifyOwner(company, user);
        company.setPricePerKm(request.getPricePerKm());
        companyRepository.save(company);
    }

    public List<CompanyResponse> getAllForAdmin() {
        return companyRepository.findAll()
                .stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Transactional
    public void approveCompany(UUID companyId) {
        TransportCompany company = findById(companyId);
        company.setStatus(CompanyStatus.ACTIVE);
        company.setApprovedAt(LocalDateTime.now());
        companyRepository.save(company);
    }

    @Transactional
    public void suspendCompany(UUID companyId, SuspendCompanyRequest request) {
        TransportCompany company = findById(companyId);
        company.setStatus(CompanyStatus.SUSPENDED);
        companyRepository.save(company);
    }

    public TransportCompany findById(UUID companyId) {
        return companyRepository.findById(companyId)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Khong tim thay cong ty"));
    }

    public TransportCompany findByUser(User user) {
        return companyRepository.findByUser(user)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Nguoi dung chua co cong ty"));
    }

    public TransportCompany findByUserId(UUID userId) {
        return companyRepository.findByUserId(userId)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Nguoi dung chua co cong ty"));
    }

    private void verifyOwner(TransportCompany company, User user) {
        if (!company.getUser().getId().equals(user.getId())) {
            throw new AppException(ErrorCode.UNAUTHORIZED, "Khong co quyen thao tac");
        }
    }

    public BigDecimal calculatePrice(BigDecimal pricePerKm, BigDecimal distanceKm) {
        double dist = distanceKm.doubleValue();
        double effectiveDist = dist <= 2.0 ? 2.0 : dist;
        return pricePerKm.multiply(BigDecimal.valueOf(effectiveDist))
                .setScale(0, RoundingMode.HALF_UP);
    }

    private String formatCurrency(BigDecimal amount) {
        NumberFormat fmt = NumberFormat.getNumberInstance(new Locale("vi", "VN"));
        return fmt.format(amount) + "d";
    }

    public CompanyResponse mapToResponse(TransportCompany company) {
        return CompanyResponse.builder()
                .id(company.getId())
                .userId(company.getUser().getId())
                .companyName(company.getCompanyName())
                .licenseNumber(company.getLicenseNumber())
                .address(company.getAddress())
                .description(company.getDescription())
                .pricePerKm(company.getPricePerKm())
                .driverRevenuePercent(company.getDriverRevenuePercent())
                .status(company.getStatus())
                .approvedAt(company.getApprovedAt())
                .createdAt(company.getCreatedAt())
                .build();
    }
}