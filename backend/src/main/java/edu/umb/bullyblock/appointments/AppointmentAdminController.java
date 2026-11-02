package edu.umb.bullyblock.appointments;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import edu.umb.bullyblock.auth.AccountRepository;
import edu.umb.bullyblock.auth.AccountRole;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/admin/appointments")
@PreAuthorize("hasAnyRole('SUPPORT', 'ADMIN')")
public class AppointmentAdminController {
    private final AppointmentService service;
    private final AccountRepository accounts;
    public AppointmentAdminController(AppointmentService service, AccountRepository accounts) { this.service = service; this.accounts = accounts; }

    public record StatusRequest(@NotNull AppointmentStatus status) { }
    public record AssignmentRequest(@Size(max = 180) String psychologist) { }
    public record PsychologistView(Long id, String name, String email) { }
    public record AppointmentView(Long id, String accountName, String accountEmail, String reason,
                                  LocalDateTime preferredAt, AppointmentModality modality,
                                  AppointmentStatus status, String assignedPsychologist,
                                  String assignedPsychologistEmail, Instant createdAt) {
        static AppointmentView from(Appointment a) { return new AppointmentView(a.getId(), a.getAccount().getName(),
                a.getAccount().getEmail(), a.getReason(), a.getPreferredAt(), a.getModality(), a.getStatus(),
                a.getAssignedPsychologist() == null ? null : a.getAssignedPsychologist().getName(),
                a.getAssignedPsychologist() == null ? null : a.getAssignedPsychologist().getEmail(), a.getCreatedAt()); }
    }
    public record PageView<T>(List<T> content, int page, int size, long totalElements, int totalPages) { }

    @GetMapping
    PageView<AppointmentView> list(@RequestParam(defaultValue = "0") int page,
                                   @RequestParam(defaultValue = "20") int size) {
        var results = service.all(PageRequest.of(Math.max(page, 0), Math.max(1, Math.min(size, 100)),
                Sort.by(Sort.Direction.ASC, "preferredAt")));
        return new PageView<>(results.getContent().stream().map(AppointmentView::from).toList(),
                results.getNumber(), results.getSize(), results.getTotalElements(), results.getTotalPages());
    }

    @PatchMapping("/{id}/status")
    AppointmentView updateStatus(@PathVariable Long id, @Valid @RequestBody StatusRequest request) {
        return AppointmentView.from(service.changeStatus(id, request.status()));
    }

    @PatchMapping("/{id}/assignment")
    AppointmentView assign(@PathVariable Long id, @Valid @RequestBody AssignmentRequest request) {
        return AppointmentView.from(service.assignPsychologist(id, request.psychologist().strip()));
    }

    @GetMapping("/psychologists")
    List<PsychologistView> psychologists() {
        return accounts.findAllByRoleOrderByNameAsc(AccountRole.SUPPORT).stream()
                .map(account -> new PsychologistView(account.getId(), account.getName(), account.getEmail())).toList();
    }
}
