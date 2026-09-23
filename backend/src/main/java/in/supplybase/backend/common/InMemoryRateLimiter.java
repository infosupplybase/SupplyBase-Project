package in.supplybase.backend.common;

import java.time.Duration;
import java.time.Instant;
import java.util.Deque;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentLinkedDeque;
import java.util.concurrent.TimeUnit;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * A sliding-window rate limiter, kept entirely in this process's memory.
 *
 * Single-instance only: it does not coordinate across multiple app instances,
 * so running two copies of the API behind a load balancer effectively
 * multiplies every limit by the instance count. Fine at this app's current
 * scale — a real multi-instance deployment would need a shared store such as
 * Redis instead.
 */
@Component
public class InMemoryRateLimiter {

    // Comfortably longer than every window any caller currently uses (the
    // longest today is one hour). A key untouched for this long is done
    // being rate-limited and is just sitting in memory doing nothing.
    private static final Duration MAX_KEY_AGE = Duration.ofHours(6);

    private final ConcurrentHashMap<String, Deque<Instant>> hits = new ConcurrentHashMap<>();

    /**
     * @return true if the caller identified by {@code key} may proceed, having
     *         made fewer than {@code max} attempts in the trailing {@code window}
     */
    public boolean tryAcquire(String key, int max, Duration window) {
        Instant now = Instant.now();
        Instant cutoff = now.minus(window);
        Deque<Instant> attempts = hits.computeIfAbsent(key, k -> new ConcurrentLinkedDeque<>());

        synchronized (attempts) {
            while (!attempts.isEmpty() && attempts.peekFirst().isBefore(cutoff)) {
                attempts.pollFirst();
            }
            if (attempts.size() >= max) {
                return false;
            }
            attempts.addLast(now);
            return true;
        }
    }

    /**
     * Removes keys nobody has touched in a long while.
     *
     * The sliding-window eviction inside {@link #tryAcquire} only ever runs
     * when a key is queried again — fine for something hit repeatedly
     * (login, register), but a key that is only ever queried once, such as
     * AuthService.refresh's key (the refresh token itself, which dies after
     * one use since refresh tokens rotate), would otherwise sit in this map
     * forever. This sweep is what actually bounds the map's size on a
     * long-running instance.
     */
    @Scheduled(fixedRate = 30, initialDelay = 30, timeUnit = TimeUnit.MINUTES)
    void evictStaleKeys() {
        Instant cutoff = Instant.now().minus(MAX_KEY_AGE);
        hits.entrySet().removeIf(entry -> {
            Deque<Instant> attempts = entry.getValue();
            synchronized (attempts) {
                Instant last = attempts.peekLast();
                return last == null || last.isBefore(cutoff);
            }
        });
    }

    /** Test-only visibility into how many keys are currently tracked. */
    int trackedKeyCount() {
        return hits.size();
    }
}
