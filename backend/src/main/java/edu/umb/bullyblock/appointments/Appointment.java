package edu.umb.bullyblock.appointments;

import edu.umb.bullyblock.auth.Account;
import jakarta.persistence.*;
import java.time.Instant;
import java.time.LocalDateTime;

@Entity
@Table(name = "appointments")
public class Appointment {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "account_id", nullable = false)
    private Account account;
    @Column(nullable = false, length = 500)
    private String reason;
    @Column(name = "preferred_at", nullable = false)
    private LocalDateTime preferredAt;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 20)
    private AppointmentModality modality;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 24)
    private AppointmentStatus status = AppointmentStatus.REQUESTED;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_psychologist_id")
    private Account assignedPsychologist;
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected Appointment() { }
    public Appointment(Account account, String reason, LocalDateTime preferredAt, AppointmentModality modality) {
        this.account = account; this.reason = reason; this.preferredAt = preferredAt; this.modality = modality;
    }
    @PrePersist void onCreate() { createdAt = Instant.now(); }
    public Long getId() { return id; }
    public Account getAccount() { return account; }
    public String getReason() { return reason; }
    public LocalDateTime getPreferredAt() { return preferredAt; }
    public AppointmentModality getModality() { return modality; }
    public AppointmentStatus getStatus() { return status; }
    public Account getAssignedPsychologist() { return assignedPsychologist; }
    public Instant getCreatedAt() { return createdAt; }
    public void setStatus(AppointmentStatus status) { this.status = status; }
    public void setAssignedPsychologist(Account assignedPsychologist) { this.assignedPsychologist = assignedPsychologist; }
}
