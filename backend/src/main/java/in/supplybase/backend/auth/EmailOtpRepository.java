package in.supplybase.backend.auth;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface EmailOtpRepository extends JpaRepository<EmailOtp, Long> {

    Optional<EmailOtp> findTopByEmailAndUsedAtIsNullOrderByCreatedAtDesc(String email);

    void deleteByEmailAndUsedAtIsNull(String email);
}