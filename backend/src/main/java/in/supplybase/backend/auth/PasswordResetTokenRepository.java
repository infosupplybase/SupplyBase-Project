package in.supplybase.backend.auth;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {

    Optional<PasswordResetToken> findByTokenHash(String tokenHash);

    /** Invalidates any earlier, still-unused reset links before a new one is issued. */
    void deleteByUserIdAndUsedAtIsNull(Long userId);
}
