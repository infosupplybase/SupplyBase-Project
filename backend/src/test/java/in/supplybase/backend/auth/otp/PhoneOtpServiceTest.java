package in.supplybase.backend.auth.otp;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;

import in.supplybase.backend.common.ApiException;
import in.supplybase.backend.common.InMemoryRateLimiter;

class PhoneOtpServiceTest {

    private static final String PHONE = "9820011223";

    /** Records codes instead of sending them. */
    static class FakeSender implements OtpSender {
        boolean configured = true;
        boolean accept = true;
        final List<String> codes = new ArrayList<>();

        @Override
        public boolean configured() {
            return configured;
        }

        @Override
        public boolean send(String phone, String code) {
            codes.add(code);
            return accept;
        }

        String last() {
            return codes.get(codes.size() - 1);
        }
    }

    /** A clock the test moves by hand. */
    static class MovableClock extends Clock {
        Instant now = Instant.parse("2026-11-12T10:00:00Z");

        @Override
        public ZoneOffset getZone() {
            return ZoneOffset.UTC;
        }

        @Override
        public Clock withZone(java.time.ZoneId zone) {
            return this;
        }

        @Override
        public Instant instant() {
            return now;
        }

        void advance(Duration d) {
            now = now.plus(d);
        }
    }

    private FakeSender sender;
    private MovableClock clock;
    private PhoneOtpService service;

    @BeforeEach
    void setUp() {
        sender = new FakeSender();
        clock = new MovableClock();
        service = new PhoneOtpService(sender, new InMemoryRateLimiter(), clock);
    }

    private static HttpStatus statusOf(Throwable ex) {
        return ((ApiException) ex).getStatus();
    }

    private static String wrong(String code) {
        return code.equals("000000") ? "111111" : "000000";
    }

    @Test
    void sendsASixDigitCodeAndAcceptsIt() {
        service.send(PHONE, "1.1.1.1");
        assertThat(sender.last()).matches("\\d{6}");
        service.verify(PHONE, sender.last());
    }

    @Test
    void aCorrectCodeStaysUsableUntilConsumed() {
        service.send(PHONE, "1.1.1.1");
        String code = sender.last();
        service.verify(PHONE, code);
        // The new-customer step sends the same code again with name and email.
        clock.advance(Duration.ofMinutes(10));
        service.verify(PHONE, code);
        service.consume(PHONE);
        assertThatThrownBy(() -> service.verify(PHONE, code)).isInstanceOf(ApiException.class);
    }

    @Test
    void wrongCodesAreCountedAndTheFifthKillsTheCode() {
        service.send(PHONE, "1.1.1.1");
        String code = sender.last();
        for (int i = 1; i < PhoneOtpService.MAX_WRONG_GUESSES; i++) {
            assertThatThrownBy(() -> service.verify(PHONE, wrong(code)))
                    .hasMessageContaining("not right");
        }
        assertThatThrownBy(() -> service.verify(PHONE, wrong(code)))
                .hasMessageContaining("Too many wrong codes");
        // Even the right code no longer works.
        assertThatThrownBy(() -> service.verify(PHONE, code)).hasMessageContaining("expired");
    }

    @Test
    void codeExpiresAfterFiveMinutes() {
        service.send(PHONE, "1.1.1.1");
        String code = sender.last();
        clock.advance(PhoneOtpService.CODE_LIFETIME.plusSeconds(1));
        assertThatThrownBy(() -> service.verify(PHONE, code)).hasMessageContaining("expired");
    }

    @Test
    void resendNeedsThirtySeconds() {
        service.send(PHONE, "1.1.1.1");
        assertThatThrownBy(() -> service.send(PHONE, "1.1.1.1"))
                .satisfies(ex -> assertThat(statusOf(ex)).isEqualTo(HttpStatus.TOO_MANY_REQUESTS));
        clock.advance(PhoneOtpService.RESEND_COOLDOWN);
        service.send(PHONE, "1.1.1.1");
        assertThat(sender.codes).hasSize(2);
    }

    @Test
    void aNewCodeReplacesTheOldOne() {
        service.send(PHONE, "1.1.1.1");
        String first = sender.last();
        clock.advance(Duration.ofMinutes(1));
        service.send(PHONE, "1.1.1.1");
        String second = sender.last();
        if (!first.equals(second)) {
            assertThatThrownBy(() -> service.verify(PHONE, first)).isInstanceOf(ApiException.class);
        }
        service.verify(PHONE, second);
    }

    @Test
    void atMostFiveSendsPerNumberPerHour() {
        for (int i = 0; i < 5; i++) {
            service.send(PHONE, "1.1.1." + i);
            clock.advance(Duration.ofMinutes(1));
        }
        assertThatThrownBy(() -> service.send(PHONE, "9.9.9.9"))
                .satisfies(ex -> assertThat(statusOf(ex)).isEqualTo(HttpStatus.TOO_MANY_REQUESTS));
    }

    @Test
    void offWithoutAKey() {
        sender.configured = false;
        assertThat(service.enabled()).isFalse();
        assertThatThrownBy(() -> service.send(PHONE, "1.1.1.1"))
                .satisfies(ex -> assertThat(statusOf(ex)).isEqualTo(HttpStatus.SERVICE_UNAVAILABLE));
    }

    @Test
    void aFailedSendLeavesNoCodeBehind() {
        sender.accept = false;
        assertThatThrownBy(() -> service.send(PHONE, "1.1.1.1"))
                .satisfies(ex -> assertThat(statusOf(ex)).isEqualTo(HttpStatus.BAD_GATEWAY));
        assertThat(service.pendingCount()).isZero();
    }

    @Test
    void verifyWithoutASendIsRefused() {
        assertThatThrownBy(() -> service.verify(PHONE, "123456")).hasMessageContaining("expired");
    }
}
