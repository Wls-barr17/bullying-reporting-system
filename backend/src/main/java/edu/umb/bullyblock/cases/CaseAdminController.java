package edu.umb.bullyblock.cases;

import edu.umb.bullyblock.auth.Account;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.time.LocalDate;

@RestController
@RequestMapping("/api/admin/cases")
@PreAuthorize("hasAnyRole('SUPPORT', 'ADMIN')")
public class CaseAdminController {
    private final CaseService service;
    public CaseAdminController(CaseService service) { this.service = service; }

    public record AdminCaseView(Long id, String trackingCode, CaseCategory category, CaseStatus status,
                                String description, String location, LocalDate incidentDate,
                                boolean confidential, String reporterName, String reporterEmail,
                                Instant createdAt, Instant updatedAt) {
        static AdminCaseView from(CaseRecord c) { return new AdminCaseView(c.getId(), c.getTrackingCode(),
                c.getCategory(), c.getStatus(), c.getDescription(), c.getLocation(), c.getIncidentDate(),
                c.isConfidential(), c.getReporter() == null ? null : c.getReporter().getName(),
                c.getReporter() == null ? null : c.getReporter().getEmail(), c.getCreatedAt(), c.getUpdatedAt()); }
    }
    public record PageView<T>(java.util.List<T> content, int page, int size, long totalElements, int totalPages) { }
    public record StatusChange(@NotNull CaseStatus status, @Size(max = 1500) String message) { }
    public record AddUpdate(@NotBlank @Size(max = 1500) String message, boolean visibleToReporter) { }
    public record AdminUpdateView(String message, boolean visibleToReporter, Instant createdAt) { }

    @GetMapping
    PageView<AdminCaseView> list(@RequestParam(required = false) CaseStatus status, Pageable pageable) {
        Pageable safePage = org.springframework.data.domain.PageRequest.of(pageable.getPageNumber(),
                Math.min(pageable.getPageSize(), 100), Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<CaseRecord> result = service.manage(status, safePage);
        return new PageView<>(result.getContent().stream().map(AdminCaseView::from).toList(),
                result.getNumber(), result.getSize(), result.getTotalElements(), result.getTotalPages());
    }

    @PatchMapping("/{id}/status")
    AdminCaseView updateStatus(@PathVariable Long id, @Valid @RequestBody StatusChange request,
                               @AuthenticationPrincipal Account account) {
        return AdminCaseView.from(service.changeStatus(id, request.status(), account, request.message()));
    }

    @PostMapping("/{id}/updates")
    CaseController.CaseUpdateView addUpdate(@PathVariable Long id, @Valid @RequestBody AddUpdate request,
                                            @AuthenticationPrincipal Account account) {
        CaseUpdate update = service.addUpdate(id, account, request.message(), request.visibleToReporter());
        return new CaseController.CaseUpdateView(update.getMessage(), update.getCreatedAt());
    }

    @GetMapping("/{id}/updates")
    java.util.List<AdminUpdateView> updates(@PathVariable Long id) {
        service.byId(id);
        return service.allUpdates(id).stream().map(update -> new AdminUpdateView(update.getMessage(),
                update.isVisibleToReporter(), update.getCreatedAt())).toList();
    }
}
