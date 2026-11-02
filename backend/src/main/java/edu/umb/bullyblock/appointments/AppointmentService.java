package edu.umb.bullyblock.appointments;

import edu.umb.bullyblock.auth.Account;
import edu.umb.bullyblock.auth.AccountRepository;
import edu.umb.bullyblock.auth.AccountRole;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Clock;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class AppointmentService {
    private final AppointmentRepository appointments;
    private final AccountRepository accounts;
    private final Clock clock;
    public AppointmentService(AppointmentRepository appointments, AccountRepository accounts, Clock clock) {
        this.appointments = appointments; this.accounts = accounts; this.clock = clock;
    }

    @Transactional(readOnly = true)
    public List<Appointment> mine(Long accountId) {
        return appointments.findAllByAccount_IdOrderByPreferredAtAsc(accountId);
    }

    @Transactional
    public Appointment create(Account account, String reason, LocalDateTime preferredAt,
                              AppointmentModality modality) {
        if (!preferredAt.isAfter(LocalDateTime.now(clock))) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Selecciona una fecha y hora futuras.");
        }
        return appointments.save(new Appointment(account, reason.strip(), preferredAt, modality));
    }

    @Transactional(readOnly = true)
    public Page<Appointment> all(Pageable pageable) { return appointments.findAll(pageable); }

    @Transactional
    public Appointment changeStatus(Long id, AppointmentStatus status) {
        Appointment appointment = appointments.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No encontramos esa cita."));
        if (!allowed(appointment.getStatus(), status)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Ese cambio de estado no está permitido.");
        }
        appointment.setStatus(status);
        return appointment;
    }

    @Transactional
    public Appointment assignPsychologist(Long id, String psychologist) {
        Appointment appointment = appointments.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No encontramos esa cita."));
        if (psychologist == null || psychologist.isBlank()) {
            appointment.setAssignedPsychologist(null);
            return appointment;
        }
        String email = psychologist.strip().toLowerCase(java.util.Locale.ROOT);
        Account professional = accounts.findByEmailIgnoreCase(email)
                .filter(account -> account.getRole() == AccountRole.SUPPORT)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Solo puedes asignar citas a cuentas activas con rol de psicología o acompañamiento."));
        appointment.setAssignedPsychologist(professional);
        return appointment;
    }

    private boolean allowed(AppointmentStatus current, AppointmentStatus next) {
        return switch (current) {
            case REQUESTED -> next == AppointmentStatus.CONFIRMED || next == AppointmentStatus.CANCELLED;
            case CONFIRMED -> next == AppointmentStatus.COMPLETED || next == AppointmentStatus.CANCELLED;
            case COMPLETED, CANCELLED -> false;
        };
    }
}
