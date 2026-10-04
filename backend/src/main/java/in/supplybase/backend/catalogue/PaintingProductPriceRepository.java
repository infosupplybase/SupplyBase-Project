package in.supplybase.backend.catalogue;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PaintingProductPriceRepository
        extends JpaRepository<PaintingProductPrice, Long> {

    List<PaintingProductPrice> findAllByOrderByIdAsc();

    Optional<PaintingProductPrice>
        findByFlowKeyAndPaintingTypeAndBrandAndHomeTypeAndProductValue(
            String flowKey,
            String paintingType,
            String brand,
            String homeType,
            String productValue);
}