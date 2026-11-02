package edu.umb.bullyblock.auth;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RoleChangeRepository extends JpaRepository<RoleChange, Long> {
    @EntityGraph(attributePaths = {"target", "changedBy"})
    Page<RoleChange> findAllByOrderByChangedAtDesc(Pageable pageable);
}
