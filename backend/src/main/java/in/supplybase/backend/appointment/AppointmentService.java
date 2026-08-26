package in.supplybase.backend.appointment;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import in.supplybase.backend.appointment.dto.DayAvailabilityResponse;
import in.supplybase.backend.appointment.dto.SlotResponse;
import in.supplybase.backend.common.ApiException;

/**
 * Decides what can be booked, and takes the seat.
 *
 * Availability is computed from the admin's rules, minus blackouts, minus what
 * is already taken. Nothing about it lives in the frontend.
 */
@Service
public class AppointmentService {

    private static final DateTimeFormatter LABEL =
            DateTimeFormatter.ofPattern("h:mm a", Locale.ENGLISH);

    /** How far ahead the calendar opens. */
    public static final int BOOKABLE_DAYS = 30;

    /**
     * A visit needs arranging, so today is never offered and tomorrow only
     * after the office would still have time to call.
     */
    private static final int MIN_NOTICE_HOURS = 12;

    private final AppointmentSlotRepository slots;
    private final AppointmentSlotRuleRepository rules;
    private final AppointmentBlackoutRepository blackouts;

    public AppointmentService(AppointmentSlotRepository slots,
                              AppointmentSlotRuleRepository rules,
                              AppointmentBlackoutRepository blackouts) {
        this.slots = slots;
        this.rules = rules;
        this.blackouts = blackouts;
    }

    @Transactional(readOnly = true)
    public List<DayAvailabilityResponse> availability(Long categoryId, LocalDate from, int days) {
        LocalDate start = from == null ? LocalDate.now() : from;
        int span = Math.min(Math.max(days, 1), BOOKABLE_DAYS);

        List<DayAvailabilityResponse> out = new ArrayList<>(span);
        for (int i = 0; i < span; i++) {
            out.add(forDay(categoryId, start.plusDays(i)));
        }
        return out;
    }

    @Transactional(readOnly = true)
    public DayAvailabilityResponse forDay(Long categoryId, LocalDate date) {
        if (blackouts.existsByDay(date)) {
            return new DayAvailabilityResponse(date, false, "We are closed on this date", List.of());
        }

        List<AppointmentSlotRule> dayRules =
                rules.findByDayOfWeekAndActiveTrue(date.getDayOfWeek().getValue()).stream()
                        .filter(rule -> rule.getCategoryId() == null
                                || rule.getCategoryId().equals(categoryId))
                        .toList();

        if (dayRules.isEmpty()) {
            return new DayAvailabilityResponse(date, false, "We do not visit on this day", List.of());
        }

        // One query for the day, then a lookup — not a query per slot.
        Map<LocalTime, AppointmentSlot> taken = new HashMap<>();
        for (AppointmentSlot slot : slots.findBySlotDate(date)) {
            if (slot.getCategoryId() == null || slot.getCategoryId().equals(categoryId)) {
                taken.put(slot.getSlotTime(), slot);
            }
        }

        LocalDateTime earliest = LocalDateTime.now().plusHours(MIN_NOTICE_HOURS);
        List<SlotResponse> result = new ArrayList<>();

        for (AppointmentSlotRule rule : dayRules) {
            for (LocalTime time = rule.getStartTime();
                 !time.plusMinutes(rule.getSlotMinutes()).isAfter(rule.getEndTime());
                 time = time.plusMinutes(rule.getSlotMinutes())) {

                AppointmentSlot existing = taken.get(time);
                boolean hasRoom = existing == null || existing.hasRoom();
                boolean farEnoughAhead = LocalDateTime.of(date, time).isAfter(earliest);

                result.add(new SlotResponse(date, time, time.format(LABEL),
                        hasRoom && farEnoughAhead));
            }
        }

        result.sort((a, b) -> a.time().compareTo(b.time()));
        boolean anyOpen = result.stream().anyMatch(SlotResponse::available);
        return new DayAvailabilityResponse(date, anyOpen,
                anyOpen ? null : "No times left on this date", result);
    }

    /**
     * Takes one seat in a slot, creating the row if this is the first booking.
     *
     * REQUIRED, not a new transaction: this must commit or roll back with the
     * booking it belongs to. A seat taken for a booking that then failed to
     * save would block a slot nobody is actually visiting.
     *
     * The caller is expected to retry once on a concurrency failure — by then
     * the slot is genuinely full and the customer is told so.
     */
    @Transactional(propagation = Propagation.REQUIRED)
    public AppointmentSlot reserve(Long categoryId, LocalDate date, LocalTime time) {
        DayAvailabilityResponse day = forDay(categoryId, date);
        boolean offered = day.slots().stream()
                .anyMatch(s -> s.time().equals(time) && s.available());
        if (!offered) {
            throw ApiException.conflict(
                    "This time slot is no longer available. Please select another time.");
        }

        AppointmentSlot slot = slots
                .findBySlotDateAndSlotTimeAndCategoryId(date, time, categoryId)
                .orElseGet(() -> AppointmentSlot.builder()
                        .slotDate(date)
                        .slotTime(time)
                        .categoryId(categoryId)
                        .capacity(capacityFor(categoryId, date))
                        .bookedCount(0)
                        .build());

        if (!slot.hasRoom()) {
            throw ApiException.conflict(
                    "This time slot is no longer available. Please select another time.");
        }
        slot.setBookedCount(slot.getBookedCount() + 1);
        return slots.save(slot);
    }

    /** Gives a seat back when a booking is cancelled. */
    @Transactional
    public void release(AppointmentSlot slot) {
        if (slot == null || slot.getBookedCount() <= 0) {
            return;
        }
        slot.setBookedCount(slot.getBookedCount() - 1);
        slots.save(slot);
    }

    private int capacityFor(Long categoryId, LocalDate date) {
        return rules.findByDayOfWeekAndActiveTrue(date.getDayOfWeek().getValue()).stream()
                .filter(r -> r.getCategoryId() == null || r.getCategoryId().equals(categoryId))
                .mapToInt(AppointmentSlotRule::getMaxBookings)
                .max()
                .orElse(1);
    }
}
