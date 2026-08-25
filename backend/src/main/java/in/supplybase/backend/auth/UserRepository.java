package in.supplybase.backend.auth;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmailIgnoreCase(String email);

    Optional<User> findByGoogleSub(String googleSub);

    Optional<User> findByPhone(String phone);

    boolean existsByPhone(String phone);

    boolean existsByEmailIgnoreCase(String email);
}
