package in.supplybase.backend.enquiry;

import java.time.Instant;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EnquiryRepository extends JpaRepository<Enquiry, Long> {

    Optional<Enquiry> findByReference(String reference);

    Page<Enquiry> findByStatusOrderByCreatedAtDesc(EnquiryStatus status, Pageable pageable);

    Page<Enquiry> findAllByOrderByCreatedAtDesc(Pageable pageable);

    /** Backs the flood check in EnquiryService. */
    long countByPhoneAndCreatedAtAfter(String phone, Instant since);
}
