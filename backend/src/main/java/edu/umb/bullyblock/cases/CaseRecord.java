package edu.umb.bullyblock.cases;

import edu.umb.bullyblock.auth.Account;
import jakarta.persistence.*;
import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "cases")
public class CaseRecord {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "tracking_code", nullable = false, unique = true, length = 40)
    private String trackingCode;
    @Enumerated(EnumType.STRING) @Column(name = "case_type", nullable = false, length = 40)
    private CaseCategory category;
    @Column(nullable = false, length = 4000)
    private String description;
    @Column(nullable = false, length = 180)
    private String location;
    @Column(name = "incident_date")
    private LocalDate incidentDate;
    @Column(nullable = false)
    private boolean confidential;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 32)
    private CaseStatus status = CaseStatus.RECEIVED;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "reporter_id")
    private Account reporter;
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected CaseRecord() { }
    public CaseRecord(String trackingCode, CaseCategory category, String description,
                      String location, LocalDate incidentDate, boolean confidential, Account reporter) {
        this.trackingCode = trackingCode; this.category = category; this.description = description;
        this.location = location; this.incidentDate = incidentDate; this.confidential = confidential;
        this.reporter = reporter;
    }
    @PrePersist void onCreate() { createdAt = updatedAt = Instant.now(); }
    @PreUpdate void onUpdate() { updatedAt = Instant.now(); }
    public Long getId() { return id; }
    public String getTrackingCode() { return trackingCode; }
    public CaseCategory getCategory() { return category; }
    public String getDescription() { return description; }
    public String getLocation() { return location; }
    public LocalDate getIncidentDate() { return incidentDate; }
    public boolean isConfidential() { return confidential; }
    public CaseStatus getStatus() { return status; }
    public Account getReporter() { return reporter; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setStatus(CaseStatus status) { this.status = status; }
}
