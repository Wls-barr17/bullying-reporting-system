package edu.umb.bullyblock.cases;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface CaseUpdateRepository extends JpaRepository<CaseUpdate, Long> {
    List<CaseUpdate> findAllByCaseRecord_IdAndVisibleToReporterTrueOrderByCreatedAtAsc(Long caseId);
    List<CaseUpdate> findAllByCaseRecord_IdOrderByCreatedAtAsc(Long caseId);
}
