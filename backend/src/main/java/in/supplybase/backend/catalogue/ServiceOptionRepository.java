package in.supplybase.backend.catalogue;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface ServiceOptionRepository extends JpaRepository<ServiceOption, Long> {

    List<ServiceOption> findByCategoryIdAndActiveTrueOrderByStepNoAscSortOrderAsc(Long categoryId);

    List<ServiceOption> findByCategoryIdAndQuestionKey(Long categoryId, String questionKey);

    void deleteByCategoryIdAndQuestionKey(Long categoryId, String questionKey);
}
