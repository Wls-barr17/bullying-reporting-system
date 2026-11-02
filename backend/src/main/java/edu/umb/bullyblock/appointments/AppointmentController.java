package edu.umb.bullyblock.appointments;

import edu.umb.bullyblock.auth.Account;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

@RestController
@RequestMapping("/api/appointments")
public class AppointmentController {
    private final AppointmentService service;
    public AppointmentController(AppointmentService service) { this.service = service; }

    public record AppointmentRequest(@NotBlank @Size(max = 500) String reason,
                                     @NotNull LocalDate date, @NotNull LocalTime time,
                                     @NotNull AppointmentModality modality) { }
    public record AppointmentView(Long id, String reason, LocalDateTime preferredAt,
                                  AppointmentModality modality, AppointmentStatus status, String assignedPsychologist, Instant createdAt) {
        static AppointmentView from(Appointment a) { return new AppointmentView(a.getId(), a.getReason(),
                a.getPreferredAt(), a.getModality(), a.getStatus(),
                a.getAssignedPsychologist() == null ? null : a.getAssignedPsychologist().getName(), a.getCreatedAt()); }
    }

    @GetMapping
    List<AppointmentView> mine(@AuthenticationPrincipal Account account) {
        return service.mine(account.getId()).stream()
                .map(AppointmentView::from).toList();
    }

    @PostMapping
    @ResponseStatus(org.springframework.http.HttpStatus.CREATED)
    AppointmentView create(@Valid @RequestBody AppointmentRequest request,
                           @AuthenticationPrincipal Account account) {
        LocalDateTime preferredAt = LocalDateTime.of(request.date(), request.time());
        Appointment appointment = service.create(account, request.reason(), preferredAt, request.modality());
        return AppointmentView.from(appointment);
    }
}
