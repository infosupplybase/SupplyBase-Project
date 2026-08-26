package in.supplybase.backend.appointment;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface AppointmentBlackoutRepository extends JpaRepository<AppointmentBlackout, Long> {

    boolean existsByDay(LocalDate day);

    List<AppointmentBlackout> findByDayBetween(LocalDate from, LocalDate to);
}
