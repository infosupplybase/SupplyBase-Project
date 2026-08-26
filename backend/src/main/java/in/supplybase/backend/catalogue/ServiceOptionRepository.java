package in.supplybase.backend.catalogue;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface ServiceOptionRepository extends JpaRepository<ServiceOption, Long> {

    List<ServiceOption> findByCategoryIdAndActiveTrueOrderByStepNoAscSortOrderAsc(Long categoryId);
}
