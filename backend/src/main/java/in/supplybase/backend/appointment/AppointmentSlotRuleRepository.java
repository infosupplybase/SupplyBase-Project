package in.supplybase.backend.appointment;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface AppointmentSlotRuleRepository extends JpaRepository<AppointmentSlotRule, Long> {

    List<AppointmentSlotRule> findByDayOfWeekAndActiveTrue(int dayOfWeek);
}
