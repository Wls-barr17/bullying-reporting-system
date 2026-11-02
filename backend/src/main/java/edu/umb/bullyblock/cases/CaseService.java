package edu.umb.bullyblock.cases;

import edu.umb.bullyblock.auth.Account;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.security.SecureRandom;
import java.time.Clock;
import java.time.LocalDate;
import java.util.Base64;
import java.util.List;

@Service
public class CaseService {
    private static final SecureRandom RANDOM = new SecureRandom();
    private final CaseRepository cases;
    private final CaseUpdateRepository updates;
    private final Clock clock;

    public CaseService(CaseRepository cases, CaseUpdateRepository updates, Clock clock) {
        this.cases = cases; this.updates = updates; this.clock = clock;
    }

    @Transactional
    public CaseRecord create(CaseCategory category, String description, String location,
                            LocalDate incidentDate, boolean confidential, Account reporter) {
        if (incidentDate != null && incidentDate.isAfter(LocalDate.now(clock))) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La fecha del incidente no puede estar en el futuro.");
        }
        if (!confidential && reporter == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED,
                    "Inicia sesión para enviar un reporte asociado a tu cuenta.");
        }
        Account linkedReporter = confidential ? null : reporter;
        CaseRecord record = cases.save(new CaseRecord(newTrackingCode(), category,
                description.strip(), location.strip(), incidentDate, confidential, linkedReporter));
        updates.save(new CaseUpdate(record, null,
                "Recibimos tu reporte. El equipo responsable revisará la información.", true));
        return record;
    }

    @Transactional(readOnly = true)
    public CaseRecord byTrackingCode(String code) {
        return cases.findByTrackingCode(code.strip())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "No encontramos un reporte con ese código."));
    }

    @Transactional(readOnly = true)
    public CaseRecord byId(Long id) {
        return cases.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                "No encontramos ese reporte."));
    }

    @Transactional(readOnly = true)
    public List<CaseRecord> mine(Long accountId) { return cases.findAllByReporter_IdOrderByCreatedAtDesc(accountId); }

    @Transactional(readOnly = true)
    public Page<CaseRecord> manage(CaseStatus status, Pageable pageable) {
        return status == null ? cases.findAll(pageable) : cases.findAllByStatus(status, pageable);
    }

    @Transactional
    public CaseRecord changeStatus(Long id, CaseStatus next, Account author, String message) {
        CaseRecord record = cases.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No encontramos ese reporte."));
        if (!canTransition(record.getStatus(), next)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Ese cambio de estado no está permitido. Revisa el estado actual del reporte.");
        }
        record.setStatus(next);
        String publicMessage = message == null || message.isBlank() ? defaultStatusMessage(next) : message.strip();
        updates.save(new CaseUpdate(record, author, publicMessage, true));
        return record;
    }

    @Transactional(readOnly = true)
    public List<CaseUpdate> publicUpdates(Long caseId) {
        return updates.findAllByCaseRecord_IdAndVisibleToReporterTrueOrderByCreatedAtAsc(caseId);
    }

    @Transactional(readOnly = true)
    public List<CaseUpdate> allUpdates(Long caseId) {
        return updates.findAllByCaseRecord_IdOrderByCreatedAtAsc(caseId);
    }

    @Transactional
    public CaseUpdate addUpdate(Long caseId, Account author, String message, boolean visible) {
        CaseRecord record = cases.findById(caseId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No encontramos ese reporte."));
        return updates.save(new CaseUpdate(record, author, message.strip(), visible));
    }

    private String newTrackingCode() {
        // 24 random bytes create a 192-bit secret used to authorize public status lookups.
        byte[] bytes = new byte[24];
        String code;
        do {
            RANDOM.nextBytes(bytes);
            code = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        } while (cases.findByTrackingCode(code).isPresent());
        return code;
    }

    private boolean canTransition(CaseStatus current, CaseStatus next) {
        return switch (current) {
            case RECEIVED -> next == CaseStatus.REVIEWING || next == CaseStatus.CLOSED;
            case REVIEWING -> next == CaseStatus.SUPPORT_ARRANGED || next == CaseStatus.RESOLVED || next == CaseStatus.CLOSED;
            case SUPPORT_ARRANGED -> next == CaseStatus.RESOLVED || next == CaseStatus.CLOSED;
            case RESOLVED -> next == CaseStatus.CLOSED || next == CaseStatus.REVIEWING;
            case CLOSED -> false;
        };
    }

    private String defaultStatusMessage(CaseStatus status) {
        return switch (status) {
            case RECEIVED -> "El reporte fue recibido.";
            case REVIEWING -> "El equipo comenzó la revisión de tu reporte.";
            case SUPPORT_ARRANGED -> "El equipo está coordinando acompañamiento.";
            case RESOLVED -> "El equipo marcó el reporte como resuelto.";
            case CLOSED -> "El seguimiento de este reporte fue cerrado.";
        };
    }
}
