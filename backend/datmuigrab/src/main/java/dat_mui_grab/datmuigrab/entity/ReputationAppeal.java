package dat_mui_grab.datmuigrab.entity;

import dat_mui_grab.datmuigrab.entity.enums.AppealStatus;
import dat_mui_grab.datmuigrab.entity.enums.AppealedBy;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.FetchType;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.JoinColumn;
import javax.persistence.ManyToOne;
import javax.persistence.Table;
import java.time.LocalDateTime;
import java.util.UUID;

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

    @Enumerated(javax.persistence.EnumType.STRING)
    @Column(nullable = false)
    private AppealedBy appealedBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "appealed_by_user_id", nullable = false)
    private User appealedByUser;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String reason;

    @Enumerated(javax.persistence.EnumType.STRING)
    @Column(nullable = false)
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
