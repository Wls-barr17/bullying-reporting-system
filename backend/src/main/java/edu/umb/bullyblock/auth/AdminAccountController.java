package edu.umb.bullyblock.auth;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;
import java.util.Locale;

@RestController
@RequestMapping("/api/admin/accounts")
@PreAuthorize("hasRole('ADMIN')")
public class AdminAccountController {
    private final AccountRepository accounts;
    private final RoleChangeRepository changes;

    public AdminAccountController(AccountRepository accounts, RoleChangeRepository changes) {
        this.accounts = accounts; this.changes = changes;
    }

    public record RoleRequest(@Email @NotNull @Size(max = 180) String email,
                              @NotNull AccountRole role) { }
    public record AccountSummary(Long id, String name, String email, AccountRole role, Instant createdAt) {
        static AccountSummary from(Account account) {
            return new AccountSummary(account.getId(), account.getName(), account.getEmail(), account.getRole(), account.getCreatedAt());
        }
    }
    public record RoleChangeView(Long id, String targetName, String targetEmail, String changedByEmail,
                                 AccountRole previousRole, AccountRole newRole, Instant changedAt) {
        static RoleChangeView from(RoleChange change) {
            return new RoleChangeView(change.getId(), change.getTarget().getName(), change.getTarget().getEmail(),
                    change.getChangedBy().getEmail(), change.getPreviousRole(), change.getNewRole(), change.getChangedAt());
        }
    }
    public record PageView<T>(List<T> content, int page, int size, long totalElements, int totalPages) { }

    @GetMapping
    @Transactional(readOnly = true)
    PageView<AccountSummary> list(@RequestParam(defaultValue = "") String query,
                                  @RequestParam(defaultValue = "0") int page,
                                  @RequestParam(defaultValue = "50") int size) {
        var pageable = PageRequest.of(Math.max(page, 0), Math.max(1, Math.min(size, 100)),
                Sort.by(Sort.Direction.DESC, "createdAt"));
        var results = query.isBlank() ? accounts.findAll(pageable)
                : accounts.findByEmailContainingIgnoreCaseOrNameContainingIgnoreCase(query.strip(), query.strip(), pageable);
        return new PageView<>(results.getContent().stream().map(AccountSummary::from).toList(),
                results.getNumber(), results.getSize(), results.getTotalElements(), results.getTotalPages());
    }

    @PatchMapping("/role")
    @Transactional
    AccountSummary changeRole(@Valid @RequestBody RoleRequest request,
                              @AuthenticationPrincipal Account actor) {
        String email = request.email().strip().toLowerCase(Locale.ROOT);
        Account target = accounts.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "No existe una cuenta con ese correo. La persona debe registrarse primero."));
        AccountRole current = target.getRole();
        if (current == request.role()) return AccountSummary.from(target);
        if (current == AccountRole.ADMIN && request.role() != AccountRole.ADMIN
                && accounts.countByRole(AccountRole.ADMIN) <= 1) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "No se puede quitar el rol al último administrador del sistema.");
        }
        target.changeRole(request.role());
        accounts.save(target);
        changes.save(new RoleChange(target, actor, current, request.role()));
        return AccountSummary.from(target);
    }

    @GetMapping("/role-history")
    @Transactional(readOnly = true)
    PageView<RoleChangeView> history(@RequestParam(defaultValue = "0") int page,
                                     @RequestParam(defaultValue = "50") int size) {
        var results = changes.findAllByOrderByChangedAtDesc(PageRequest.of(Math.max(page, 0), Math.max(1, Math.min(size, 100))));
        return new PageView<>(results.getContent().stream().map(RoleChangeView::from).toList(),
                results.getNumber(), results.getSize(), results.getTotalElements(), results.getTotalPages());
    }
}
