package in.supplybase.backend.auth.otp;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import in.supplybase.backend.common.ApiException;
import in.supplybase.backend.common.InMemoryRateLimiter;

/**
 * Issues and checks six-digit login codes sent by SMS.
 *
 * Codes live only in this process's memory, hashed: a code is good for five
 * minutes, so losing the pending ones on a restart costs a person one resend.
 * Single-instance, like {@link InMemoryRateLimiter}.
 *
 * Limits, because every SMS costs a credit and a code is only six digits:
 *   - one send per number every 30 seconds, 5 per number per hour
 *   - 20 sends per IP address per hour, 300 for the whole site per hour
 *   - 5 wrong guesses kill a code; 15 guesses per number per hour overall
 */
@Service
public class PhoneOtpService {

    static final Duration CODE_LIFETIME = Duration.ofMinutes(5);
    /** After a correct code, how long a new customer has to type name and email. */
    static final Duration VERIFIED_LIFETIME = Duration.ofMinutes(15);
    static final Duration RESEND_COOLDOWN = Duration.ofSeconds(30);
    static final int MAX_WRONG_GUESSES = 5;

    private static final int SEND_PER_PHONE_MAX = 5;
    private static final int SEND_PER_IP_MAX = 20;
    private static final int SEND_SITE_MAX = 300;
    private static final int VERIFY_PER_PHONE_MAX = 15;
    private static final Duration HOUR = Duration.ofHours(1);

    private final OtpSender sender;
    private final InMemoryRateLimiter rateLimiter;
    private final Clock clock;
    private final SecureRandom random = new SecureRandom();
    private final ConcurrentHashMap<String, Pending> pending = new ConcurrentHashMap<>();

    @Autowired
    public PhoneOtpService(OtpSender sender, InMemoryRateLimiter rateLimiter) {
        this(sender, rateLimiter, Clock.systemUTC());
    }

    PhoneOtpService(OtpSender sender, InMemoryRateLimiter rateLimiter, Clock clock) {
        this.sender = sender;
        this.rateLimiter = rateLimiter;
        this.clock = clock;
    }

    /** One code waiting for a phone number. Guarded by synchronizing on itself. */
    private static final class Pending {
        final byte[] codeHash;
        final Instant sentAt;
        final Instant expiresAt;
        int wrongGuesses;
        Instant verifiedUntil;

        Pending(byte[] codeHash, Instant sentAt, Instant expiresAt) {
            this.codeHash = codeHash;
            this.sentAt = sentAt;
            this.expiresAt = expiresAt;
        }
    }

    /** Sends a fresh code to a ten-digit number (already normalised). */
    public void send(String phone, String clientIp) {
        if (!sender.configured()) {
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE,
                    "Login with OTP is not available right now. Please sign in with your password.");
        }
        Instant now = clock.instant();
        Pending previous = pending.get(phone);
        if (previous != null && previous.sentAt.plus(RESEND_COOLDOWN).isAfter(now)) {
            long wait = Duration.between(now, previous.sentAt.plus(RESEND_COOLDOWN)).toSeconds() + 1;
            throw ApiException.tooManyRequests("Please wait " + wait + " seconds before asking for a new code.");
        }
        if (!rateLimiter.tryAcquire("otp-send:phone:" + phone, SEND_PER_PHONE_MAX, HOUR)
                || !rateLimiter.tryAcquire("otp-send:ip:" + (clientIp == null ? "unknown" : clientIp),
                        SEND_PER_IP_MAX, HOUR)
                || !rateLimiter.tryAcquire("otp-send:site", SEND_SITE_MAX, HOUR)) {
            throw ApiException.tooManyRequests("Too many codes asked for. Please wait a while and try again.");
        }

        String code = String.format("%06d", random.nextInt(1_000_000));
        // Stored before sending so a fast typist never races the save.
        pending.put(phone, new Pending(hash(phone, code), now, now.plus(CODE_LIFETIME)));
        if (!sender.send(phone, code)) {
            pending.remove(phone);
            throw new ApiException(HttpStatus.BAD_GATEWAY,
                    "We could not send the code just now. Please try again in a minute.");
        }
    }

    /**
     * Checks a code. A correct code stays usable for {@link #VERIFIED_LIFETIME}
     * so a new customer can finish sign-up with it; call {@link #consume} once
     * the person is signed in.
     */
    public void verify(String phone, String code) {
        if (!rateLimiter.tryAcquire("otp-verify:phone:" + phone, VERIFY_PER_PHONE_MAX, HOUR)) {
            throw ApiException.tooManyRequests("Too many attempts. Please wait a while and try again.");
        }
        Pending entry = pending.get(phone);
        if (entry == null) {
            throw ApiException.badRequest("This code has expired. Please ask for a new one.");
        }
        synchronized (entry) {
            Instant now = clock.instant();
            if (entry.verifiedUntil != null) {
                if (now.isAfter(entry.verifiedUntil)) {
                    pending.remove(phone, entry);
                    throw ApiException.badRequest("This code has expired. Please ask for a new one.");
                }
            } else if (now.isAfter(entry.expiresAt)) {
                pending.remove(phone, entry);
                throw ApiException.badRequest("This code has expired. Please ask for a new one.");
            }
            boolean matches = code != null && code.matches("\\d{6}")
                    && MessageDigest.isEqual(entry.codeHash, hash(phone, code));
            if (!matches) {
                entry.wrongGuesses++;
                if (entry.wrongGuesses >= MAX_WRONG_GUESSES) {
                    pending.remove(phone, entry);
                    throw ApiException.badRequest("Too many wrong codes. Please ask for a new one.");
                }
                int left = MAX_WRONG_GUESSES - entry.wrongGuesses;
                throw ApiException.badRequest("That code is not right. " + left
                        + (left == 1 ? " try" : " tries") + " left.");
            }
            if (entry.verifiedUntil == null) {
                entry.verifiedUntil = now.plus(VERIFIED_LIFETIME);
            }
        }
    }

    /** Used up: the code cannot sign anyone in again. */
    public void consume(String phone) {
        pending.remove(phone);
    }

    public boolean enabled() {
        return sender.configured();
    }

    @Scheduled(fixedRate = 10, initialDelay = 10, timeUnit = TimeUnit.MINUTES)
    void evictExpired() {
        Instant now = clock.instant();
        pending.entrySet().removeIf(e -> {
            Pending p = e.getValue();
            synchronized (p) {
                Instant end = p.verifiedUntil != null ? p.verifiedUntil : p.expiresAt;
                return now.isAfter(end);
            }
        });
    }

    int pendingCount() {
        return pending.size();
    }

    private static byte[] hash(String phone, String code) {
        try {
            return MessageDigest.getInstance("SHA-256")
                    .digest((phone + ":" + code).getBytes(StandardCharsets.UTF_8));
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException(ex);
        }
    }
}
