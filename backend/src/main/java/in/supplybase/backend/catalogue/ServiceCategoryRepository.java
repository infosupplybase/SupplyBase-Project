package in.supplybase.backend.catalogue;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ServiceCategoryRepository extends JpaRepository<ServiceCategory, Long> {

    List<ServiceCategory> findByActiveTrueOrderBySortOrderAsc();

    /** The seven main categories — a sub-service (parent_slug set) is left out. */
    List<ServiceCategory> findByActiveTrueAndParentSlugIsNullOrderBySortOrderAsc();

    List<ServiceCategory> findAllByOrderBySortOrderAsc();

    Optional<ServiceCategory> findBySlugAndActiveTrue(String slug);

    Optional<ServiceCategory> findBySlug(String slug);

    boolean existsBySlug(String slug);

    /**
     * Every active category (main or sub-service) whose name, tagline or
     * description mentions the search text — the catalogue search box reads
     * from this rather than a separate index.
     */
    @Query("""
            SELECT c FROM ServiceCategory c
            WHERE c.active = true
              AND (LOWER(c.name) LIKE LOWER(CONCAT('%', :q, '%'))
                   OR LOWER(c.tagline) LIKE LOWER(CONCAT('%', :q, '%'))
                   OR LOWER(c.description) LIKE LOWER(CONCAT('%', :q, '%')))
            ORDER BY CASE WHEN c.parentSlug IS NULL THEN 0 ELSE 1 END, c.sortOrder ASC
            """)
    List<ServiceCategory> search(@Param("q") String q);
}
