package dat_mui_grab.datmuigrab.service;

import dat_mui_grab.datmuigrab.dto.request.PaymentRequest;
import dat_mui_grab.datmuigrab.dto.response.PaymentResponse;
import dat_mui_grab.datmuigrab.entity.Payment;
import dat_mui_grab.datmuigrab.entity.Ride;
import dat_mui_grab.datmuigrab.entity.User;
import dat_mui_grab.datmuigrab.entity.enums.PaymentStatus;
import dat_mui_grab.datmuigrab.entity.enums.RideStatus;
import dat_mui_grab.datmuigrab.exception.AppException;
import dat_mui_grab.datmuigrab.exception.ErrorCode;
import dat_mui_grab.datmuigrab.repository.PaymentRepository;
import dat_mui_grab.datmuigrab.repository.RideRepository;
import dat_mui_grab.datmuigrab.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final RideRepository rideRepository;
    private final UserRepository userRepository;

    @Transactional
    public PaymentResponse pay(UUID customerId, PaymentRequest request) {
        Ride ride = rideRepository.findById(request.getRideId())
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Khong tim thay chuyen di"));

        User customer = userRepository.findById(customerId)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Khong tim thay nguoi dung"));

        if (ride.getStatus() != RideStatus.COMPLETED) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "Chuyen di chua hoan thanh");
        }

        if (paymentRepository.findByRide(ride).isPresent()) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "Chuyen di nay da duoc thanh toan");
        }

        Payment payment = Payment.builder()
                .ride(ride)
                .customer(customer)
                .amount(ride.getFinalPrice() != null ? ride.getFinalPrice() : ride.getEstimatedPrice())
                .method(request.getMethod())
                .status(PaymentStatus.SUCCESS)
                .build();

        payment = paymentRepository.save(payment);
        return mapToResponse(payment);
    }

    public PaymentResponse getByRide(UUID rideId) {
        Ride ride = rideRepository.findById(rideId)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Khong tim thay chuyen di"));

        Payment payment = paymentRepository.findByRide(ride)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Chuyen di nay chua duoc thanh toan"));

        return mapToResponse(payment);
    }

    private PaymentResponse mapToResponse(Payment payment) {
        return PaymentResponse.builder()
                .id(payment.getId())
                .rideId(payment.getRide().getId())
                .amount(payment.getAmount())
                .method(payment.getMethod())
                .status(payment.getStatus())
                .transactionCode(payment.getTransactionCode())
                .paidAt(payment.getPaidAt())
                .createdAt(payment.getCreatedAt())
                .build();
    }
}
