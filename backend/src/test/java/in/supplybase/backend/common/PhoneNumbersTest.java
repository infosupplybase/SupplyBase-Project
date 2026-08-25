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
