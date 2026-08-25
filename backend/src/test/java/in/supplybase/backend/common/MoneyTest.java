package in.supplybase.backend.common;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.math.BigDecimal;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

/**
 * These run without a database on purpose.
 *
 * Money conversion and Indian digit grouping are the two pieces of pure logic
 * here that are easy to get subtly wrong and expensive to get wrong in an
 * invoice, so they are the parts worth pinning down.
 */
class MoneyTest {

    @ParameterizedTest
    @CsvSource({
            "1.00,        100",
            "0.01,        1",
            "1000.00,     100000",
            "125000.50,   12500050",
            "99999999.99, 9999999999"
    })
    @DisplayName("rupees convert to paise without losing anything")
    void rupeesToPaise(String rupees, long expectedPaise) {
        assertThat(Money.rupeesToPaise(new BigDecimal(rupees))).isEqualTo(expectedPaise);
    }

    @Test
    @DisplayName("a fraction of a paisa is refused rather than silently rounded")
    void rejectsSubPaisePrecision() {
        assertThatThrownBy(() -> Money.rupeesToPaise(new BigDecimal("10.005")))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("more precise than paise");
    }

    @Test
    @DisplayName("a missing amount is refused")
    void rejectsNull() {
        assertThatThrownBy(() -> Money.rupeesToPaise(null))
                .isInstanceOf(ApiException.class);
    }

    @Test
    @DisplayName("a round trip through paise changes nothing")
    void roundTrip() {
        BigDecimal original = new BigDecimal("847531.29");
        assertThat(Money.paiseToRupees(Money.rupeesToPaise(original)))
                .isEqualByComparingTo(original);
    }

    @ParameterizedTest
    @CsvSource({
            // Indian grouping: last three digits, then twos - not the western
            // groups of three. 1,25,000 not 125,000.
            "100,          '1.00'",
            "12345,        '123.45'",
            "100000,       '1,000.00'",
            "1000000,      '10,000.00'",
            "12500000,     '1,25,000.00'",
            "10000000000,  '10,00,00,000.00'"
    })
    @DisplayName("amounts are grouped the Indian way")
    void formatsIndianStyle(long paise, String expected) {
        assertThat(Money.formatRupees(paise)).isEqualTo(expected);
    }
}
