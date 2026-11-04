package in.supplybase.backend.auth;

import java.time.Instant;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface LoginEventRepository extends JpaRepository<LoginEvent, Long> {

    long countByCreatedAtGreaterThanEqual(Instant since);

    @Query("SELECT COUNT(DISTINCT e.userId) FROM LoginEvent e WHERE e.createdAt >= :since")
    long countDistinctUsersSince(@Param("since") Instant since);
}
