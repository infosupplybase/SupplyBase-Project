package in.supplybase.backend.payment;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PaymentRepository extends JpaRepository<Payment, Long> {

    Optional<Payment> findByReference(String reference);

    Optional<Payment> findByRazorpayOrderId(String razorpayOrderId);

    List<Payment> findByUserIdOrderByCreatedAtDesc(Long userId);

    List<Payment> findByProjectIdOrderByCreatedAtDesc(Long projectId);

    Page<Payment> findAllByOrderByCreatedAtDesc(Pageable pageable);
}
