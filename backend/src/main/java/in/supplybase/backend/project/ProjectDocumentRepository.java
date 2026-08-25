package in.supplybase.backend.project;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface ProjectDocumentRepository extends JpaRepository<ProjectDocument, Long> {

    List<ProjectDocument> findByProjectIdOrderByCreatedAtDesc(Long projectId);
}
