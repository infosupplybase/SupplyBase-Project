package in.supplybase.backend.auth;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface EmailVerificationTokenRepository extends JpaRepository<EmailVerificationToken, Long> {

    Optional<EmailVerificationToken> findByTokenHash(String tokenHash);

    /** Invalidates any earlier, still-unused verification links before a new one is issued. */
    void deleteByUserIdAndUsedAtIsNull(Long userId);
}
