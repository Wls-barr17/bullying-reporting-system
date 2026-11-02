package edu.umb.bullyblock.auth;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "role_change_history")
public class RoleChange {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "target_account_id", nullable = false)
    private Account target;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "changed_by_account_id", nullable = false)
    private Account changedBy;
    @Enumerated(EnumType.STRING) @Column(name = "previous_role", nullable = false, length = 24)
    private AccountRole previousRole;
    @Enumerated(EnumType.STRING) @Column(name = "new_role", nullable = false, length = 24)
    private AccountRole newRole;
    @Column(name = "changed_at", nullable = false, updatable = false)
    private Instant changedAt;

    protected RoleChange() { }
    public RoleChange(Account target, Account changedBy, AccountRole previousRole, AccountRole newRole) {
        this.target = target; this.changedBy = changedBy;
        this.previousRole = previousRole; this.newRole = newRole;
    }
    @PrePersist void onCreate() { changedAt = Instant.now(); }
    public Long getId() { return id; }
    public Account getTarget() { return target; }
    public Account getChangedBy() { return changedBy; }
    public AccountRole getPreviousRole() { return previousRole; }
    public AccountRole getNewRole() { return newRole; }
    public Instant getChangedAt() { return changedAt; }
}
