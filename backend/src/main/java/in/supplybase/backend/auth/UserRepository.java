package in.supplybase.backend.auth;

import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmailIgnoreCase(String email);

    Optional<User> findByGoogleSub(String googleSub);

    Optional<User> findByPhone(String phone);

    boolean existsByPhone(String phone);

    boolean existsByEmailIgnoreCase(String email);

    long countByRole(Role role);

    /** One flexible query for the admin user list rather than several narrow ones. */
    @Query("SELECT u FROM User u WHERE (:role IS NULL OR u.role = :role) "
            + "AND (:q IS NULL OR LOWER(u.fullName) LIKE LOWER(CONCAT('%', :q, '%')) "
            + "OR LOWER(u.email) LIKE LOWER(CONCAT('%', :q, '%')) OR u.phone LIKE CONCAT('%', :q, '%'))")
    Page<User> search(@Param("role") Role role, @Param("q") String q, Pageable pageable);
}
