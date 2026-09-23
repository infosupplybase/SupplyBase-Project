package in.supplybase.backend.booking;

import java.time.Instant;
import java.time.YearMonth;
import java.time.ZoneId;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import in.supplybase.backend.booking.dto.ProfessionalEarningsResponse;

@Service
public class ProfessionalEarningsService {

    private final BookingRepository bookings;

    public ProfessionalEarningsService(BookingRepository bookings) {
        this.bookings = bookings;
    }

    @Transactional(readOnly = true)
    public ProfessionalEarningsResponse getEarnings(Long professionalId) {

        List<Booking> completedBookings = bookings
                .findByAssignedProfessionalIdOrderByCreatedAtDesc(professionalId)
                .stream()
                .filter(b -> b.getStatus() == BookingStatus.WORK_COMPLETED)
                .toList();

        long totalEarningsPaise = completedBookings.stream()
                .mapToLong(Booking::getVisitFeePaise)
                .sum();

        YearMonth currentMonth = YearMonth.now();

        long thisMonthEarningsPaise = completedBookings.stream()
                .filter(b -> {
                    Instant paidAt = b.getPaidAt();

                    if (paidAt == null) {
                        return false;
                    }

                    YearMonth paidMonth = YearMonth.from(
                            paidAt.atZone(ZoneId.systemDefault())
                    );

                    return paidMonth.equals(currentMonth);
                })
                .mapToLong(Booking::getVisitFeePaise)
                .sum();

        List<ProfessionalEarningsResponse.EarningItem> recentEarnings =
                completedBookings.stream()
                        .limit(10)
                        .map(b -> new ProfessionalEarningsResponse.EarningItem(
                                b.getId(),
                                b.getBookingNumber(),
                                b.getServiceLabel(),
                                b.getPreferredDate(),
                                b.getVisitFeePaise()
                        ))
                        .toList();

        return new ProfessionalEarningsResponse(
                totalEarningsPaise,
                thisMonthEarningsPaise,
                completedBookings.size(),
                recentEarnings
        );
    }
}