package in.supplybase.backend.appointment;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface AppointmentSlotRepository extends JpaRepository<AppointmentSlot, Long> {

    List<AppointmentSlot> findBySlotDate(LocalDate slotDate);

    Optional<AppointmentSlot> findBySlotDateAndSlotTimeAndCategoryId(
            LocalDate slotDate, LocalTime slotTime, Long categoryId);
}
