package edu.umb.bullyblock.appointments;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.util.List;

public interface AppointmentRepository extends JpaRepository<Appointment, Long> {
    @Override @EntityGraph(attributePaths = {"account", "assignedPsychologist"})
    java.util.Optional<Appointment> findById(Long id);
    @EntityGraph(attributePaths = {"account", "assignedPsychologist"})
    List<Appointment> findAllByAccount_IdOrderByPreferredAtAsc(Long accountId);
    @Override @EntityGraph(attributePaths = {"account", "assignedPsychologist"})
    Page<Appointment> findAll(Pageable pageable);
}
