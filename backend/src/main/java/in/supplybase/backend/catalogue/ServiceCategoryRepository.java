package in.supplybase.backend.catalogue;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface ServiceCategoryRepository extends JpaRepository<ServiceCategory, Long> {

    List<ServiceCategory> findByActiveTrueOrderBySortOrderAsc();

    List<ServiceCategory> findAllByOrderBySortOrderAsc();

    Optional<ServiceCategory> findBySlugAndActiveTrue(String slug);

    Optional<ServiceCategory> findBySlug(String slug);

    boolean existsBySlug(String slug);
}
