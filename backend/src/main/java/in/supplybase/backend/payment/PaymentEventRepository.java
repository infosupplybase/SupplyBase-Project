package in.supplybase.backend.payment;

import org.springframework.data.jpa.repository.JpaRepository;

public interface PaymentEventRepository extends JpaRepository<PaymentEvent, Long> {

    boolean existsByRazorpayEventId(String razorpayEventId);
}
