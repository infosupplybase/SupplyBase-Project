package in.supplybase.backend.common;

import java.time.Duration;
import java.time.Instant;
import java.util.Deque;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentLinkedDeque;

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
}
