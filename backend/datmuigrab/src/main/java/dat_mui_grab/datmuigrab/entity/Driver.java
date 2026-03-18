package dat_mui_grab.datmuigrab.entity;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import dat_mui_grab.datmuigrab.entity.enums.DriverOnlineStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "drivers")
@Getter @Setter @Builder
@NoArgsConstructor @AllArgsConstructor
public class Driver {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    private String licenseNumber;
    private String idCardNumber;
    private String phoneNumber;
    private String vehiclePlate;
    private String vehicleType;
    private String vehicleModel;

    @Column(precision = 3, scale = 1)
    private BigDecimal reputationScore;

    @Column(nullable = false)
    @Builder.Default
    private Integer totalRatings = 0;

    @Enumerated(jakarta.persistence.EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private DriverOnlineStatus onlineStatus = DriverOnlineStatus.OFFLINE;

    @Column(precision = 10, scale = 7)
    private BigDecimal currentLat;

    @Column(precision = 10, scale = 7)
    private BigDecimal currentLng;

    private LocalDateTime lastActiveAt;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
