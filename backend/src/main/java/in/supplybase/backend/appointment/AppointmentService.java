package in.supplybase.backend.appointment;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import in.supplybase.backend.appointment.dto.BlackoutResponse;
import in.supplybase.backend.appointment.dto.CreateBlackoutRequest;
import in.supplybase.backend.appointment.dto.CreateSlotRuleRequest;
import in.supplybase.backend.appointment.dto.DayAvailabilityResponse;
import in.supplybase.backend.appointment.dto.SlotResponse;
import in.supplybase.backend.appointment.dto.SlotRuleResponse;
import in.supplybase.backend.appointment.dto.UpdateSlotRuleRequest;
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
     * A customer may also ask for their own date and time instead of one of
     * the listed slots: any day up to this far ahead...
     */
    public static final int CUSTOM_BOOKABLE_DAYS = 90;

    /** ...at a start time on a quarter hour, inside that day's working hours. */
    public static final int CUSTOM_STEP_MINUTES = 15;

    private static final ZoneId BUSINESS_ZONE = ZoneId.of("Asia/Kolkata");

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
        LocalDate start = from == null ? LocalDate.now(BUSINESS_ZONE) : from;
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

        LocalDateTime earliest = earliestBookable();
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
        if (!offered && !isCustomTimeAllowed(categoryId, date, time)) {
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

    /* ----------------------------------------------------------- staff */

    @Transactional(readOnly = true)
    public List<SlotRuleResponse> listRules() {
        return rules.findAll().stream().map(SlotRuleResponse::from).toList();
    }

    @Transactional
    public SlotRuleResponse createRule(CreateSlotRuleRequest request) {
        if (!request.endTime().isAfter(request.startTime())) {
            throw ApiException.badRequest("The end time must be after the start time.");
        }
        AppointmentSlotRule rule = AppointmentSlotRule.builder()
                .categoryId(request.categoryId())
                .dayOfWeek(request.dayOfWeek())
                .startTime(request.startTime())
                .endTime(request.endTime())
                .slotMinutes(request.slotMinutes())
                .maxBookings(request.maxBookings())
                .active(true)
                .build();
        return SlotRuleResponse.from(rules.save(rule));
    }

    @Transactional
    public SlotRuleResponse updateRule(Long id, UpdateSlotRuleRequest request) {
        if (!request.endTime().isAfter(request.startTime())) {
            throw ApiException.badRequest("The end time must be after the start time.");
        }
        AppointmentSlotRule rule = rules.findById(id)
                .orElseThrow(() -> ApiException.notFound("That rule"));
        rule.setCategoryId(request.categoryId());
        rule.setDayOfWeek(request.dayOfWeek());
        rule.setStartTime(request.startTime());
        rule.setEndTime(request.endTime());
        rule.setSlotMinutes(request.slotMinutes());
        rule.setMaxBookings(request.maxBookings());
        return SlotRuleResponse.from(rules.save(rule));
    }

    /**
     * Soft delete: a rule isn't referenced by FK from anything, but flipping
     * active off rather than removing the row keeps it reversible, matching
     * how the rest of this system treats deletes on rows others may depend on.
     */
    @Transactional
    public void deleteRule(Long id) {
        AppointmentSlotRule rule = rules.findById(id)
                .orElseThrow(() -> ApiException.notFound("That rule"));
        rule.setActive(false);
        rules.save(rule);
    }

    @Transactional(readOnly = true)
    public List<BlackoutResponse> listBlackouts() {
        return blackouts.findAll().stream().map(BlackoutResponse::from).toList();
    }

    @Transactional
    public BlackoutResponse createBlackout(CreateBlackoutRequest request) {
        if (blackouts.existsByDay(request.day())) {
            throw ApiException.conflict("That day already has a blackout.");
        }
        AppointmentBlackout blackout = AppointmentBlackout.builder()
                .day(request.day())
                .reason(request.reason())
                .build();
        return BlackoutResponse.from(blackouts.save(blackout));
    }

    /** Hard delete: a blackout is just "is the office open", nothing references it historically. */
    @Transactional
    public void deleteBlackout(Long id) {
        if (!blackouts.existsById(id)) {
            throw ApiException.notFound("That blackout");
        }
        blackouts.deleteById(id);
    }

    /**
     * A time the customer chose themselves rather than from the list: allowed
     * when the office is open that day, the visit starts on a quarter hour and
     * fits inside a working-hours rule (start at or after the opening time,
     * finish by the closing time), it is far enough ahead to arrange, and it
     * is no more than {@link #CUSTOM_BOOKABLE_DAYS} away. Whether there is
     * still room at that exact time is checked by {@link #reserve} as usual.
     */
    public boolean isCustomTimeAllowed(Long categoryId, LocalDate date, LocalTime time) {
        if (date == null || time == null) {
            return false;
        }
        if (time.getSecond() != 0 || time.getNano() != 0 || time.getMinute() % CUSTOM_STEP_MINUTES != 0) {
            return false;
        }
        if (date.isAfter(LocalDate.now(BUSINESS_ZONE).plusDays(CUSTOM_BOOKABLE_DAYS))) {
            return false;
        }
        if (!LocalDateTime.of(date, time).isAfter(earliestBookable())) {
            return false;
        }
        if (blackouts.existsByDay(date)) {
            return false;
        }
        return rules.findByDayOfWeekAndActiveTrue(date.getDayOfWeek().getValue()).stream()
                .filter(rule -> rule.getCategoryId() == null || rule.getCategoryId().equals(categoryId))
                .anyMatch(rule -> !time.isBefore(rule.getStartTime())
                        && !time.plusMinutes(rule.getSlotMinutes()).isAfter(rule.getEndTime())
                        // a visit cannot run past midnight
                        && time.plusMinutes(rule.getSlotMinutes()).isAfter(time));
    }

    /** The first moment a visit can be booked for: now in India, plus the notice period. */
    private LocalDateTime earliestBookable() {
        return LocalDateTime.now(BUSINESS_ZONE).plusHours(MIN_NOTICE_HOURS);
    }

    private int capacityFor(Long categoryId, LocalDate date) {
        return rules.findByDayOfWeekAndActiveTrue(date.getDayOfWeek().getValue()).stream()
                .filter(r -> r.getCategoryId() == null || r.getCategoryId().equals(categoryId))
                .mapToInt(AppointmentSlotRule::getMaxBookings)
                .max()
                .orElse(1);
    }
}
