package in.supplybase.backend.project;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProjectRepository extends JpaRepository<Project, Long> {

    /** EntityGraph so the dashboard's stage list is one query, not N+1. */
    @EntityGraph(attributePaths = "stages")
    List<Project> findByClientIdOrderByCreatedAtDesc(Long clientId);

    @EntityGraph(attributePaths = "stages")
    Optional<Project> findWithStagesById(Long id);

    Page<Project> findAllByOrderByCreatedAtDesc(Pageable pageable);

    boolean existsByCode(String code);
}
