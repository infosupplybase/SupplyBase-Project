package in.supplybase.backend.auth;

import java.time.Instant;
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

    long countByCreatedAtGreaterThanEqual(Instant since);

    String SEARCH_WHERE = "WHERE (:role IS NULL OR u.role = :role) "
            + "AND (:q IS NULL OR LOWER(u.fullName) LIKE LOWER(CONCAT('%', :q, '%')) "
            + "OR LOWER(u.email) LIKE LOWER(CONCAT('%', :q, '%')) OR u.phone LIKE CONCAT('%', :q, '%'))";
    String SEARCH_COUNT = "SELECT COUNT(u) FROM User u " + SEARCH_WHERE;

    /** One flexible query for the admin user list rather than several narrow ones. Account number order. */
    @Query(value = "SELECT u FROM User u " + SEARCH_WHERE + " ORDER BY u.id ASC", countQuery = SEARCH_COUNT)
    Page<User> search(@Param("role") Role role, @Param("q") String q, Pageable pageable);

    @Query(value = "SELECT u FROM User u " + SEARCH_WHERE + " ORDER BY u.id DESC", countQuery = SEARCH_COUNT)
    Page<User> searchNewestFirst(@Param("role") Role role, @Param("q") String q, Pageable pageable);

    /** Most recent login first; people who have not logged in since tracking began go last. */
    @Query(value = "SELECT u FROM User u " + SEARCH_WHERE
            + " ORDER BY CASE WHEN u.lastLoginAt IS NULL THEN 1 ELSE 0 END, u.lastLoginAt DESC, u.id ASC",
            countQuery = SEARCH_COUNT)
    Page<User> searchLatestLoginFirst(@Param("role") Role role, @Param("q") String q, Pageable pageable);

    /** Longest since their last login first; people with no recorded login still go last. */
    @Query(value = "SELECT u FROM User u " + SEARCH_WHERE
            + " ORDER BY CASE WHEN u.lastLoginAt IS NULL THEN 1 ELSE 0 END, u.lastLoginAt ASC, u.id ASC",
            countQuery = SEARCH_COUNT)
    Page<User> searchOldestLoginFirst(@Param("role") Role role, @Param("q") String q, Pageable pageable);
}
