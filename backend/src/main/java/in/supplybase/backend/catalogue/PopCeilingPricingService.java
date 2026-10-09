package in.supplybase.backend.catalogue;

import java.util.List;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

@Service
public class PopCeilingPricingService {

    private final JdbcTemplate jdbc;

    public PopCeilingPricingService(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public record StartingPrice(
            String homeType,
            String ceilingType,
            long pricePaise) {
    }

    public List<StartingPrice> listPrices() {
        return jdbc.query("""
                SELECT home_type, ceiling_type, price_paise
                FROM pop_ceiling_package_prices
                UNION ALL
                SELECT CONCAT('room:', room_type) AS home_type,
                       '*' AS ceiling_type, price_paise
                FROM pop_ceiling_room_prices
                UNION ALL
                SELECT CONCAT('room:', room_type) AS home_type,
                       ceiling_type, price_paise
                FROM pop_ceiling_room_design_prices
                ORDER BY home_type, ceiling_type
                """, (rs, rowNum) -> new StartingPrice(
                        rs.getString("home_type"),
                        rs.getString("ceiling_type"),
                        rs.getLong("price_paise")));
    }

    public Long findRoomPricePaise(String roomType, String ceilingType) {
        if (roomType == null || ceilingType == null) {
            return null;
        }

        List<Long> prices;

        if ("living-room".equals(roomType) || "bedroom".equals(roomType)) {
            prices = jdbc.query("""
                    SELECT price_paise
                    FROM pop_ceiling_room_design_prices
                    WHERE room_type = ? AND ceiling_type = ?
                    """, (rs, rowNum) -> rs.getLong("price_paise"),
                    roomType, ceilingType);
        } else {
            prices = jdbc.query("""
                    SELECT price_paise
                    FROM pop_ceiling_room_prices
                    WHERE room_type = ?
                    """, (rs, rowNum) -> rs.getLong("price_paise"), roomType);
        }

        return prices.isEmpty() ? null : prices.get(0);
    }

    public Long findPricePaise(String homeType, String ceilingType) {
        if (homeType == null || ceilingType == null
                || "4bhk".equals(homeType)) {
            return null;
        }

        List<Long> prices = jdbc.query("""
                SELECT price_paise
                FROM pop_ceiling_package_prices
                WHERE home_type = ? AND ceiling_type = ?
                """, (rs, rowNum) -> rs.getLong("price_paise"),
                homeType, ceilingType);

        return prices.isEmpty() ? null : prices.get(0);
    }
}
