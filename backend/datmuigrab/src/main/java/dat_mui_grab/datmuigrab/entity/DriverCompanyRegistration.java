package dat_mui_grab.datmuigrab.entity;

import dat_mui_grab.datmuigrab.entity.enums.RegistrationStatus;
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
import jakarta.persistence.UniqueConstraint;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "driver_company_registrations",
       uniqueConstraints = @UniqueConstraint(columnNames = {"driver_id", "company_id"}))
@Getter @Setter @Builder
@NoArgsConstructor @AllArgsConstructor
public class DriverCompanyRegistration {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "driver_id", nullable = false)
    private Driver driver;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", nullable = false)
    private TransportCompany company;

    @Enumerated(jakarta.persistence.EnumType.STRING)
    @Column(nullable = false)
    private RegistrationStatus status = RegistrationStatus.PENDING;

    @CreationTimestamp
    private LocalDateTime appliedAt;

    private LocalDateTime approvedAt;

    @Column(columnDefinition = "TEXT")
    private String note;
}
