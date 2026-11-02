package edu.umb.bullyblock.cases;

import edu.umb.bullyblock.auth.Account;
import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "case_updates")
public class CaseUpdate {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "case_id", nullable = false)
    private CaseRecord caseRecord;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "author_id")
    private Account author;
    @Column(nullable = false, length = 1500)
    private String message;
    @Column(name = "visible_to_reporter", nullable = false)
    private boolean visibleToReporter = true;
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected CaseUpdate() { }
    public CaseUpdate(CaseRecord caseRecord, Account author, String message, boolean visibleToReporter) {
        this.caseRecord = caseRecord; this.author = author; this.message = message;
        this.visibleToReporter = visibleToReporter;
    }
    @PrePersist void onCreate() { createdAt = Instant.now(); }
    public Long getId() { return id; }
    public CaseRecord getCaseRecord() { return caseRecord; }
    public String getMessage() { return message; }
    public boolean isVisibleToReporter() { return visibleToReporter; }
    public Instant getCreatedAt() { return createdAt; }
}
