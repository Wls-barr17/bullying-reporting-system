package edu.umb.bullyblock.auth;

import jakarta.persistence.*;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.time.Instant;
import java.util.Collection;
import java.util.List;

@Entity
@Table(name = "accounts")
public class Account implements UserDetails {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false, length = 120)
    private String name;
    @Column(nullable = false, unique = true, length = 180)
    private String email;
    @Column(name = "password_hash", nullable = false, length = 100)
    private String passwordHash;
    @Column(name = "profile_image", columnDefinition = "LONGTEXT")
    private String profileImage;
    @Enumerated(EnumType.STRING) @Column(name = "account_role", nullable = false, length = 24)
    private AccountRole role = AccountRole.STUDENT;
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected Account() { }
    public Account(String name, String email, String passwordHash) {
        this.name = name;
        this.email = email;
        this.passwordHash = passwordHash;
    }
    @PrePersist void onCreate() { createdAt = Instant.now(); }
    public Long getId() { return id; }
    public Instant getCreatedAt() { return createdAt; }
    public String getName() { return name; }
    public String getEmail() { return email; }
    public AccountRole getRole() { return role; }
    public String getProfileImage() { return profileImage; }
    public void updateProfile(String name, String profileImage) {
        this.name = name;
        this.profileImage = profileImage;
    }
    public void changeRole(AccountRole role) { this.role = role; }
    @Override public String getUsername() { return email; }
    @Override public String getPassword() { return passwordHash; }
    @Override public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_" + role.name()));
    }
    @Override public boolean isAccountNonExpired() { return true; }
    @Override public boolean isAccountNonLocked() { return true; }
    @Override public boolean isCredentialsNonExpired() { return true; }
    @Override public boolean isEnabled() { return true; }
}
