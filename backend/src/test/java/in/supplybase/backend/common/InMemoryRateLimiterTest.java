package in.supplybase.backend.common;

import static org.assertj.core.api.Assertions.assertThat;

import java.lang.reflect.Field;
import java.time.Duration;
import java.time.Instant;
import java.util.Deque;
import java.util.Map;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * {@link InMemoryRateLimiter} is mocked everywhere it is actually used
 * (AuthServiceTest et al.), so nothing else exercises its real sliding
 * window or the stale-key sweep — the class has no injectable clock (by
 * design, to stay a plain, dependency-free component), so the sweep tests
 * reach into its private state via reflection to simulate the passage of
 * time rather than adding test-only production complexity.
 */
class InMemoryRateLimiterTest {

    @Test
    @DisplayName("allows up to max attempts in the window, then blocks")
    void slidingWindow() {
        InMemoryRateLimiter limiter = new InMemoryRateLimiter();

        assertThat(limiter.tryAcquire("key", 3, Duration.ofMinutes(1))).isTrue();
        assertThat(limiter.tryAcquire("key", 3, Duration.ofMinutes(1))).isTrue();
        assertThat(limiter.tryAcquire("key", 3, Duration.ofMinutes(1))).isTrue();
        assertThat(limiter.tryAcquire("key", 3, Duration.ofMinutes(1))).isFalse();
    }

    @Test
    @DisplayName("tracks each key independently")
    void independentKeys() {
        InMemoryRateLimiter limiter = new InMemoryRateLimiter();

        assertThat(limiter.tryAcquire("a", 1, Duration.ofMinutes(1))).isTrue();
        assertThat(limiter.tryAcquire("a", 1, Duration.ofMinutes(1))).isFalse();
        // A different key is not affected by "a" already being exhausted.
        assertThat(limiter.tryAcquire("b", 1, Duration.ofMinutes(1))).isTrue();
    }

    @Test
    @DisplayName("the stale-key sweep leaves a recently-touched key alone")
    void sweepKeepsFreshKeys() {
        InMemoryRateLimiter limiter = new InMemoryRateLimiter();
        limiter.tryAcquire("fresh", 5, Duration.ofMinutes(1));

        limiter.evictStaleKeys();

        assertThat(limiter.trackedKeyCount()).isEqualTo(1);
    }

    @Test
    @DisplayName("the stale-key sweep removes a key nobody has touched in hours")
    void sweepRemovesStaleKeys() throws Exception {
        InMemoryRateLimiter limiter = new InMemoryRateLimiter();
        // A single-use key, the way AuthService.refresh keys by the refresh
        // token itself: queried exactly once, then never again — its own
        // sliding-window eviction inside tryAcquire never gets a second
        // chance to run, so only the sweep can ever clean it up.
        limiter.tryAcquire("one-time-refresh-token", 30, Duration.ofHours(1));

        backdateOnlyEntry(limiter, "one-time-refresh-token", Duration.ofHours(7));

        limiter.evictStaleKeys();

        assertThat(limiter.trackedKeyCount()).isZero();
    }

    /** Rewrites the single recorded attempt for {@code key} to {@code age} ago. */
    @SuppressWarnings("unchecked")
    private static void backdateOnlyEntry(InMemoryRateLimiter limiter, String key, Duration age)
            throws Exception {
        Field hitsField = InMemoryRateLimiter.class.getDeclaredField("hits");
        hitsField.setAccessible(true);
        Map<String, Deque<Instant>> hits = (Map<String, Deque<Instant>>) hitsField.get(limiter);

        Deque<Instant> attempts = hits.get(key);
        attempts.clear();
        attempts.addLast(Instant.now().minus(age));
    }
}
