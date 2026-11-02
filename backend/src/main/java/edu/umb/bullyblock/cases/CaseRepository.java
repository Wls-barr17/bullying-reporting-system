package edu.umb.bullyblock.cases;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface CaseRepository extends JpaRepository<CaseRecord, Long> {
    Optional<CaseRecord> findByTrackingCode(String trackingCode);
    List<CaseRecord> findAllByReporter_IdOrderByCreatedAtDesc(Long reporterId);
    @EntityGraph(attributePaths = "reporter")
    Page<CaseRecord> findAllByStatus(CaseStatus status, Pageable pageable);
    @Override @EntityGraph(attributePaths = "reporter")
    Page<CaseRecord> findAll(Pageable pageable);
    @Override @EntityGraph(attributePaths = "reporter")
    Optional<CaseRecord> findById(Long id);
}
