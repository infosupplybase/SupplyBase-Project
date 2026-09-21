package in.supplybase.backend.partner;

import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PartnerProfileRepository extends JpaRepository<PartnerProfile, Long> {

    Optional<PartnerProfile> findByUserId(Long userId);

    long countByStatus(PartnerStatus status);

    /**
     * The admin Partners list: optional status filter plus a free-text match
     * on name, email or phone. The user is fetched in the same query so the
     * list does not issue one extra select per row.
     */
    @Query(value = "SELECT p FROM PartnerProfile p JOIN FETCH p.user u "
            + "WHERE (:status IS NULL OR p.status = :status) "
            + "AND (:q IS NULL OR LOWER(u.fullName) LIKE LOWER(CONCAT('%', :q, '%')) "
            + "OR LOWER(u.email) LIKE LOWER(CONCAT('%', :q, '%')) OR u.phone LIKE CONCAT('%', :q, '%'))",
            countQuery = "SELECT COUNT(p) FROM PartnerProfile p JOIN p.user u "
            + "WHERE (:status IS NULL OR p.status = :status) "
            + "AND (:q IS NULL OR LOWER(u.fullName) LIKE LOWER(CONCAT('%', :q, '%')) "
            + "OR LOWER(u.email) LIKE LOWER(CONCAT('%', :q, '%')) OR u.phone LIKE CONCAT('%', :q, '%'))")
    Page<PartnerProfile> search(@Param("status") PartnerStatus status, @Param("q") String q, Pageable pageable);
}
