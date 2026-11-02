package edu.umb.bullyblock.cases;

import edu.umb.bullyblock.auth.Account;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/cases")
@Validated
public class CaseController {
    private final CaseService service;
    public CaseController(CaseService service) { this.service = service; }

    public record CreateCaseRequest(@NotNull CaseCategory category,
                                    @NotBlank @Size(min = 15, max = 4000) String description,
                                    @NotBlank @Size(max = 180) String location,
                                    LocalDate incidentDate, boolean confidential) { }
    public record TrackRequest(@NotBlank @Size(min = 32, max = 40) String trackingCode) { }
    public record CreatedCase(String trackingCode, CaseCategory category, CaseStatus status, Instant createdAt) { }
    public record CaseUpdateView(String message, Instant createdAt) { }
    public record TrackingView(CaseStatus status, Instant createdAt, Instant updatedAt,
                               List<CaseUpdateView> updates) { }
    public record MineView(String trackingCode, CaseCategory category, CaseStatus status,
                           String description, String location, LocalDate incidentDate,
                           Instant createdAt, Instant updatedAt) { }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    CreatedCase create(@Valid @RequestBody CreateCaseRequest request,
                       @AuthenticationPrincipal Account reporter) {
        CaseRecord record = service.create(request.category(), request.description(), request.location(),
                request.incidentDate(), request.confidential(), reporter);
        return new CreatedCase(record.getTrackingCode(), record.getCategory(), record.getStatus(), record.getCreatedAt());
    }

    @PostMapping("/track")
    TrackingView track(@Valid @RequestBody TrackRequest request) {
        CaseRecord record = service.byTrackingCode(request.trackingCode());
        List<CaseUpdateView> updates = service.publicUpdates(record.getId()).stream()
                .map(update -> new CaseUpdateView(update.getMessage(), update.getCreatedAt())).toList();
        return new TrackingView(record.getStatus(), record.getCreatedAt(), record.getUpdatedAt(), updates);
    }

    @GetMapping("/mine")
    List<MineView> mine(@AuthenticationPrincipal Account account) {
        return service.mine(account.getId()).stream().map(record -> new MineView(record.getTrackingCode(),
                record.getCategory(), record.getStatus(), record.getDescription(), record.getLocation(),
                record.getIncidentDate(), record.getCreatedAt(), record.getUpdatedAt())).toList();
    }
}
