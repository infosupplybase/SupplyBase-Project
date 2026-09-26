package in.supplybase.backend.booking.dto;

import java.time.LocalDate;
import java.util.List;

public record ProfessionalEarningsResponse(
        long totalEarningsPaise,
        long thisMonthEarningsPaise,
        long completedJobs,
        List<EarningItem> recentEarnings) {

    public record EarningItem(
            Long bookingId,
            String bookingNumber,
            String serviceLabel,
            LocalDate date,
            long amountPaise) {
    }
}