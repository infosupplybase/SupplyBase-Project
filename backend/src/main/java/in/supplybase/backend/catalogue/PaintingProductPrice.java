package in.supplybase.backend.catalogue;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "painting_product_prices")
@Getter
@NoArgsConstructor
public class PaintingProductPrice {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "flow_key", nullable = false, length = 60)
    private String flowKey;

    @Column(name = "painting_type", nullable = false, length = 80)
    private String paintingType;

    @Column(nullable = false, length = 80)
    private String brand;

    @Column(name = "home_type", nullable = false, length = 80)
    private String homeType;

    @Column(name = "product_value", nullable = false, length = 80)
    private String productValue;

    @Column(name = "price_paise", nullable = false)
    private Long pricePaise;
}