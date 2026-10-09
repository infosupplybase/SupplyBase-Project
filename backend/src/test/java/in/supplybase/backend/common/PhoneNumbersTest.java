package in.supplybase.backend.common;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.ValueSource;

/**
 * Phone numbers identify accounts now, so the same number typed three ways has
 * to reduce to one value. If it does not, "sign in with your phone number"
 * works on Tuesday and fails on Wednesday.
 */
class PhoneNumbersTest {

    @ParameterizedTest
    @CsvSource({
            "9820011223,       9820011223",
            "'98200 11223',    9820011223",
            "+919820011223,    9820011223",
            "'+91 98200 11223',9820011223",
            "'+91-98200-11223',9820011223",
            "09820011223,      9820011223",
            "'(98200) 11223',  9820011223",
            "919820011223,     9820011223"
    })
    @DisplayName("every way of writing one number reduces to the same ten digits")
    void normalisesToNationalDigits(String typed, String expected) {
        assertThat(PhoneNumbers.normalise(typed)).isEqualTo(expected);
    }

    @Test
    @DisplayName("blank input is absent, not invalid — phone is optional for Google sign-ups")
    void blankIsNull() {
        assertThat(PhoneNumbers.normalise(null)).isNull();
        assertThat(PhoneNumbers.normalise("   ")).isNull();
    }

    @ParameterizedTest
    @ValueSource(strings = { "12345", "98200112234567", "abcdefghij", "+1 555 010 9999" })
    @DisplayName("anything that cannot be a ten-digit number is refused")
    void rejectsNonsense(String typed) {
        assertThatThrownBy(() -> PhoneNumbers.normalise(typed))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("10-digit");
    }

    @ParameterizedTest
    @ValueSource(strings = { "5876543210", "0000000000", "1234567890", "+91 58765 43210", "00000000000" })
    @DisplayName("ten digits that are not an Indian mobile number are refused")
    void rejectsNonMobiles(String typed) {
        assertThatThrownBy(() -> PhoneNumbers.normalise(typed))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("10-digit");
    }

    @ParameterizedTest
    @ValueSource(strings = { "6000000000", "7000000000", "8000000000", "9123456780" })
    @DisplayName("every mobile series, 6 to 9, is accepted")
    void acceptsEveryMobileSeries(String typed) {
        assertThat(PhoneNumbers.normalise(typed)).isEqualTo(typed);
    }

    @Test
    @DisplayName("the sign-in box still finds an account saved before the mobile rule")
    void lenientFormKeepsOlderNumbers() {
        assertThat(PhoneNumbers.normaliseOrNull("58765 43210")).isEqualTo("5876543210");
    }

    @Test
    @DisplayName("the lenient form returns null instead of throwing, for the sign-in box")
    void lenientFormSwallows() {
        assertThat(PhoneNumbers.normaliseOrNull("not a number")).isNull();
        assertThat(PhoneNumbers.normaliseOrNull("+91 98200 11223")).isEqualTo("9820011223");
    }

    @Test
    @DisplayName("an @ is what separates an email from a phone number")
    void tellsEmailFromPhone() {
        assertThat(PhoneNumbers.looksLikeEmail("someone@example.com")).isTrue();
        assertThat(PhoneNumbers.looksLikeEmail("9820011223")).isFalse();
        assertThat(PhoneNumbers.looksLikeEmail(null)).isFalse();
    }
}
