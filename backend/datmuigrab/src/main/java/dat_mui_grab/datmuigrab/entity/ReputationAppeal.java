package dat_mui_grab.datmuigrab.entity;

import java.time.LocalDateTime;
import java.util.UUID;

import org.hibernate.annotations.CreationTimestamp;

import dat_mui_grab.datmuigrab.entity.enums.AppealStatus;
import dat_mui_grab.datmuigrab.entity.enums.AppealedBy;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "reputation_appeals")
@Getter @Setter @Builder
@NoArgsConstructor @AllArgsConstructor
public class ReputationAppeal {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "driver_id", nullable = false)
    private Driver driver;

    @Enumerated(jakarta.persistence.EnumType.STRING)
    @Column(nullable = false)
    private AppealedBy appealedBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "appealed_by_user_id", nullable = false)
    private User appealedByUser;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String reason;

    @Enumerated(jakarta.persistence.EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private AppealStatus status = AppealStatus.PENDING;

    @Column(columnDefinition = "TEXT")
    private String adminNote;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "resolved_by")
    private User resolvedBy;

    @CreationTimestamp
    private LocalDateTime createdAt;

    private LocalDateTime resolvedAt;
}
