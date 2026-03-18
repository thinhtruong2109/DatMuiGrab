package dat_mui_grab.datmuigrab.entity;

import dat_mui_grab.datmuigrab.entity.enums.CancelledBy;
import dat_mui_grab.datmuigrab.entity.enums.RideStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "rides")
@Getter @Setter @Builder
@NoArgsConstructor @AllArgsConstructor
public class Ride {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private User customer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "driver_id")
    private Driver driver;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", nullable = false)
    private TransportCompany company;

    @Column(nullable = false, precision = 10, scale = 7)
    private BigDecimal pickupLat;

    @Column(nullable = false, precision = 10, scale = 7)
    private BigDecimal pickupLng;

    @Column(nullable = false)
    private String pickupAddress;

    @Column(nullable = false, precision = 10, scale = 7)
    private BigDecimal destinationLat;

    @Column(nullable = false, precision = 10, scale = 7)
    private BigDecimal destinationLng;

    @Column(nullable = false)
    private String destinationAddress;

    @Column(precision = 8, scale = 3)
    private BigDecimal distanceKm;

    @Column(precision = 15, scale = 2)
    private BigDecimal estimatedPrice;

    @Column(precision = 15, scale = 2)
    private BigDecimal finalPrice;

    @Column(precision = 15, scale = 2)
    private BigDecimal platformFee;

    @Column(precision = 15, scale = 2)
    private BigDecimal companyRevenue;

    @Column(precision = 15, scale = 2)
    private BigDecimal driverRevenue;

    @Column(precision = 15, scale = 2)
    private BigDecimal pricePerKmAtBooking;

    @Enumerated(jakarta.persistence.EnumType.STRING)
    @Column(nullable = false)
    private RideStatus status = RideStatus.SEARCHING;

    @Enumerated(jakarta.persistence.EnumType.STRING)
    private CancelledBy cancelledBy;

    @Column(columnDefinition = "TEXT")
    private String cancelReason;

    private LocalDateTime startedAt;
    private LocalDateTime completedAt;

    @CreationTimestamp
    private LocalDateTime createdAt;
}
