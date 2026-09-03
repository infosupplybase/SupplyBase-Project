package in.supplybase.backend.appointment;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.http.HttpStatus;

import in.supplybase.backend.appointment.dto.BlackoutResponse;
import in.supplybase.backend.appointment.dto.CreateBlackoutRequest;
import in.supplybase.backend.appointment.dto.CreateSlotRuleRequest;
import in.supplybase.backend.appointment.dto.DayAvailabilityResponse;
import in.supplybase.backend.appointment.dto.SlotRuleResponse;
import in.supplybase.backend.appointment.dto.UpdateSlotRuleRequest;
import in.supplybase.backend.common.ApiException;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class AppointmentServiceTest {

    private static final Long CATEGORY_ID = 1L;

    @Mock
    private AppointmentSlotRepository slots;
    @Mock
    private AppointmentSlotRuleRepository rules;
    @Mock
    private AppointmentBlackoutRepository blackouts;

    private AppointmentService service;

    @BeforeEach
    void setUp() {
        service = new AppointmentService(slots, rules, blackouts);
        when(slots.save(any(AppointmentSlot.class))).thenAnswer(inv -> inv.getArgument(0));
        when(rules.save(any(AppointmentSlotRule.class))).thenAnswer(inv -> inv.getArgument(0));
        when(blackouts.save(any(AppointmentBlackout.class))).thenAnswer(inv -> inv.getArgument(0));
    }

    /** A date far enough out that the 12-hour minimum-notice rule never bites. */
    private LocalDate farFutureDateOn(DayOfWeek dow) {
        LocalDate date = LocalDate.now().plusDays(14);
        while (date.getDayOfWeek() != dow) {
            date = date.plusDays(1);
        }
        return date;
    }

    private AppointmentSlotRule rule(DayOfWeek dow, LocalTime start, LocalTime end, int slotMinutes, int max) {
        return AppointmentSlotRule.builder()
                .id(1L).categoryId(null).dayOfWeek(dow.getValue())
                .startTime(start).endTime(end).slotMinutes(slotMinutes).maxBookings(max).active(true)
                .build();
    }

    @Nested
    @DisplayName("forDay")
    class ForDay {

        @Test
        @DisplayName("is closed on a blackout day, with no slots offered")
        void blackoutDay() {
            LocalDate date = farFutureDateOn(DayOfWeek.MONDAY);
            when(blackouts.existsByDay(date)).thenReturn(true);

            DayAvailabilityResponse response = service.forDay(CATEGORY_ID, date);

            assertThat(response.open()).isFalse();
            assertThat(response.closedReason()).isEqualTo("We are closed on this date");
            assertThat(response.slots()).isEmpty();
            verify(rules, never()).findByDayOfWeekAndActiveTrue(anyInt());
        }

        @Test
        @DisplayName("is closed when no rule covers that day of week")
        void noMatchingRule() {
            LocalDate date = farFutureDateOn(DayOfWeek.SUNDAY);
            when(blackouts.existsByDay(date)).thenReturn(false);
            when(rules.findByDayOfWeekAndActiveTrue(DayOfWeek.SUNDAY.getValue())).thenReturn(List.of());

            DayAvailabilityResponse response = service.forDay(CATEGORY_ID, date);

            assertThat(response.open()).isFalse();
            assertThat(response.closedReason()).isEqualTo("We do not visit on this day");
            assertThat(response.slots()).isEmpty();
        }

        @Test
        @DisplayName("marks an already-full slot unavailable while later slots stay open")
        void partiallyBookedSlot() {
            LocalDate date = farFutureDateOn(DayOfWeek.MONDAY);
            when(blackouts.existsByDay(date)).thenReturn(false);
            when(rules.findByDayOfWeekAndActiveTrue(DayOfWeek.MONDAY.getValue()))
                    .thenReturn(List.of(rule(DayOfWeek.MONDAY, LocalTime.of(10, 0), LocalTime.of(12, 0), 60, 2)));

            AppointmentSlot fullSlot = AppointmentSlot.builder()
                    .id(1L).slotDate(date).slotTime(LocalTime.of(10, 0))
                    .categoryId(CATEGORY_ID).capacity(2).bookedCount(2).build();
            when(slots.findBySlotDate(date)).thenReturn(List.of(fullSlot));

            DayAvailabilityResponse response = service.forDay(CATEGORY_ID, date);

            assertThat(response.open()).isTrue();
            assertThat(response.slots()).hasSize(2);
            assertThat(response.slots().get(0).time()).isEqualTo(LocalTime.of(10, 0));
            assertThat(response.slots().get(0).available()).isFalse();
            assertThat(response.slots().get(1).time()).isEqualTo(LocalTime.of(11, 0));
            assertThat(response.slots().get(1).available()).isTrue();
        }

        @Test
        @DisplayName("closes the day when every slot is either full or too soon")
        void noAvailableSlotsLeftsDayClosed() {
            LocalDate date = farFutureDateOn(DayOfWeek.MONDAY);
            when(blackouts.existsByDay(date)).thenReturn(false);
            when(rules.findByDayOfWeekAndActiveTrue(DayOfWeek.MONDAY.getValue()))
                    .thenReturn(List.of(rule(DayOfWeek.MONDAY, LocalTime.of(10, 0), LocalTime.of(11, 0), 60, 1)));
            AppointmentSlot fullSlot = AppointmentSlot.builder()
                    .id(1L).slotDate(date).slotTime(LocalTime.of(10, 0))
                    .categoryId(CATEGORY_ID).capacity(1).bookedCount(1).build();
            when(slots.findBySlotDate(date)).thenReturn(List.of(fullSlot));

            DayAvailabilityResponse response = service.forDay(CATEGORY_ID, date);

            assertThat(response.open()).isFalse();
            assertThat(response.closedReason()).isEqualTo("No times left on this date");
        }
    }

    @Nested
    @DisplayName("availability")
    class Availability {

        @Test
        @DisplayName("returns one entry per day for the requested span")
        void returnsRequestedSpan() {
            when(blackouts.existsByDay(any(LocalDate.class))).thenReturn(true);
            LocalDate from = LocalDate.now().plusDays(1);

            List<DayAvailabilityResponse> result = service.availability(CATEGORY_ID, from, 5);

            assertThat(result).hasSize(5);
            assertThat(result.get(0).date()).isEqualTo(from);
            assertThat(result.get(4).date()).isEqualTo(from.plusDays(4));
        }

        @Test
        @DisplayName("caps the span at the bookable-days limit")
        void capsAtBookableDays() {
            when(blackouts.existsByDay(any(LocalDate.class))).thenReturn(true);

            List<DayAvailabilityResponse> result =
                    service.availability(CATEGORY_ID, LocalDate.now(), AppointmentService.BOOKABLE_DAYS + 50);

            assertThat(result).hasSize(AppointmentService.BOOKABLE_DAYS);
        }
    }

    @Nested
    @DisplayName("reserve")
    class Reserve {

        @Test
        @DisplayName("creates a new slot row on the first booking into a time")
        void createsNewSlot() {
            LocalDate date = farFutureDateOn(DayOfWeek.MONDAY);
            LocalTime time = LocalTime.of(10, 0);
            when(blackouts.existsByDay(date)).thenReturn(false);
            when(rules.findByDayOfWeekAndActiveTrue(DayOfWeek.MONDAY.getValue()))
                    .thenReturn(List.of(rule(DayOfWeek.MONDAY, LocalTime.of(10, 0), LocalTime.of(12, 0), 60, 3)));
            when(slots.findBySlotDate(date)).thenReturn(List.of());
            when(slots.findBySlotDateAndSlotTimeAndCategoryId(date, time, CATEGORY_ID))
                    .thenReturn(Optional.empty());

            AppointmentSlot result = service.reserve(CATEGORY_ID, date, time);

            assertThat(result.getCapacity()).isEqualTo(3);
            assertThat(result.getBookedCount()).isEqualTo(1);
            verify(slots).save(any(AppointmentSlot.class));
        }

        @Test
        @DisplayName("takes the next seat in an already-existing slot")
        void incrementsExistingSlot() {
            LocalDate date = farFutureDateOn(DayOfWeek.MONDAY);
            LocalTime time = LocalTime.of(10, 0);
            when(blackouts.existsByDay(date)).thenReturn(false);
            when(rules.findByDayOfWeekAndActiveTrue(DayOfWeek.MONDAY.getValue()))
                    .thenReturn(List.of(rule(DayOfWeek.MONDAY, LocalTime.of(10, 0), LocalTime.of(12, 0), 60, 3)));

            AppointmentSlot existing = AppointmentSlot.builder()
                    .id(9L).slotDate(date).slotTime(time).categoryId(CATEGORY_ID)
                    .capacity(3).bookedCount(1).build();
            when(slots.findBySlotDate(date)).thenReturn(List.of(existing));
            when(slots.findBySlotDateAndSlotTimeAndCategoryId(date, time, CATEGORY_ID))
                    .thenReturn(Optional.of(existing));

            AppointmentSlot result = service.reserve(CATEGORY_ID, date, time);

            assertThat(result.getBookedCount()).isEqualTo(2);
        }

        @Test
        @DisplayName("refuses a time that is not on offer at all")
        void timeNotOffered() {
            LocalDate date = farFutureDateOn(DayOfWeek.MONDAY);
            when(blackouts.existsByDay(date)).thenReturn(false);
            when(rules.findByDayOfWeekAndActiveTrue(DayOfWeek.MONDAY.getValue()))
                    .thenReturn(List.of(rule(DayOfWeek.MONDAY, LocalTime.of(10, 0), LocalTime.of(11, 0), 60, 1)));
            when(slots.findBySlotDate(date)).thenReturn(List.of());

            assertThatThrownBy(() -> service.reserve(CATEGORY_ID, date, LocalTime.of(9, 0)))
                    .isInstanceOf(ApiException.class)
                    .extracting("status").isEqualTo(HttpStatus.CONFLICT);
            verify(slots, never()).save(any());
        }

        @Test
        @DisplayName("refuses when the slot fills up between the availability check and the reservation")
        void slotFullsDuringRace() {
            LocalDate date = farFutureDateOn(DayOfWeek.MONDAY);
            LocalTime time = LocalTime.of(10, 0);
            when(blackouts.existsByDay(date)).thenReturn(false);
            when(rules.findByDayOfWeekAndActiveTrue(DayOfWeek.MONDAY.getValue()))
                    .thenReturn(List.of(rule(DayOfWeek.MONDAY, LocalTime.of(10, 0), LocalTime.of(12, 0), 60, 1)));
            // forDay sees no existing row yet, so the time is offered...
            when(slots.findBySlotDate(date)).thenReturn(List.of());
            // ...but by the time reserve() looks it up directly, someone else won the seat.
            AppointmentSlot raceWinner = AppointmentSlot.builder()
                    .id(9L).slotDate(date).slotTime(time).categoryId(CATEGORY_ID)
                    .capacity(1).bookedCount(1).build();
            when(slots.findBySlotDateAndSlotTimeAndCategoryId(date, time, CATEGORY_ID))
                    .thenReturn(Optional.of(raceWinner));

            assertThatThrownBy(() -> service.reserve(CATEGORY_ID, date, time))
                    .isInstanceOf(ApiException.class)
                    .extracting("status").isEqualTo(HttpStatus.CONFLICT);
            verify(slots, never()).save(any());
        }
    }

    @Nested
    @DisplayName("release")
    class Release {

        @Test
        @DisplayName("gives back one seat")
        void decrementsBookedCount() {
            AppointmentSlot slot = AppointmentSlot.builder().id(1L).capacity(2).bookedCount(1).build();

            service.release(slot);

            assertThat(slot.getBookedCount()).isEqualTo(0);
            verify(slots).save(slot);
        }

        @Test
        @DisplayName("does nothing for a null slot")
        void nullSlotIsNoOp() {
            service.release(null);
            verify(slots, never()).save(any());
        }

        @Test
        @DisplayName("does nothing for a slot already at zero bookings")
        void zeroBookedIsNoOp() {
            AppointmentSlot slot = AppointmentSlot.builder().id(1L).capacity(2).bookedCount(0).build();

            service.release(slot);

            assertThat(slot.getBookedCount()).isEqualTo(0);
            verify(slots, never()).save(any());
        }
    }

    @Nested
    @DisplayName("slot rule CRUD")
    class SlotRuleCrud {

        private CreateSlotRuleRequest createRequest(LocalTime start, LocalTime end) {
            return new CreateSlotRuleRequest(null, 1, start, end, 60, 2);
        }

        @Test
        @DisplayName("listRules maps every stored rule")
        void listRulesMapsAll() {
            when(rules.findAll()).thenReturn(List.of(rule(DayOfWeek.MONDAY, LocalTime.of(9, 0), LocalTime.of(17, 0), 60, 2)));

            List<SlotRuleResponse> result = service.listRules();

            assertThat(result).hasSize(1);
            assertThat(result.get(0).dayOfWeek()).isEqualTo(DayOfWeek.MONDAY.getValue());
        }

        @Test
        @DisplayName("creates a rule when the time range is valid")
        void createRuleSuccess() {
            SlotRuleResponse response = service.createRule(createRequest(LocalTime.of(9, 0), LocalTime.of(17, 0)));

            assertThat(response.active()).isTrue();
            verify(rules).save(any(AppointmentSlotRule.class));
        }

        @Test
        @DisplayName("refuses an end time that is not after the start time")
        void createRuleInvalidRange() {
            assertThatThrownBy(() -> service.createRule(createRequest(LocalTime.of(17, 0), LocalTime.of(9, 0))))
                    .isInstanceOf(ApiException.class)
                    .extracting("status").isEqualTo(HttpStatus.BAD_REQUEST);
            verify(rules, never()).save(any());
        }

        @Test
        @DisplayName("updates every field of an existing rule")
        void updateRuleSuccess() {
            AppointmentSlotRule existing = rule(DayOfWeek.MONDAY, LocalTime.of(9, 0), LocalTime.of(17, 0), 60, 2);
            when(rules.findById(1L)).thenReturn(Optional.of(existing));
            UpdateSlotRuleRequest request = new UpdateSlotRuleRequest(5L, 3, LocalTime.of(10, 0),
                    LocalTime.of(14, 0), 30, 4);

            SlotRuleResponse response = service.updateRule(1L, request);

            assertThat(response.categoryId()).isEqualTo(5L);
            assertThat(response.dayOfWeek()).isEqualTo(3);
            assertThat(response.slotMinutes()).isEqualTo(30);
            assertThat(response.maxBookings()).isEqualTo(4);
        }

        @Test
        @DisplayName("refuses an invalid time range before looking the rule up")
        void updateRuleInvalidRange() {
            UpdateSlotRuleRequest request = new UpdateSlotRuleRequest(null, 1, LocalTime.of(17, 0),
                    LocalTime.of(9, 0), 60, 2);

            assertThatThrownBy(() -> service.updateRule(1L, request))
                    .isInstanceOf(ApiException.class)
                    .extracting("status").isEqualTo(HttpStatus.BAD_REQUEST);
            verify(rules, never()).findById(any());
        }

        @Test
        @DisplayName("404s for an unknown rule id")
        void updateRuleNotFound() {
            when(rules.findById(99L)).thenReturn(Optional.empty());
            UpdateSlotRuleRequest request = new UpdateSlotRuleRequest(null, 1, LocalTime.of(9, 0),
                    LocalTime.of(17, 0), 60, 2);

            assertThatThrownBy(() -> service.updateRule(99L, request))
                    .isInstanceOf(ApiException.class)
                    .extracting("status").isEqualTo(HttpStatus.NOT_FOUND);
        }

        @Test
        @DisplayName("deleteRule soft-deletes by flipping active off")
        void deleteRuleSuccess() {
            AppointmentSlotRule existing = rule(DayOfWeek.MONDAY, LocalTime.of(9, 0), LocalTime.of(17, 0), 60, 2);
            when(rules.findById(1L)).thenReturn(Optional.of(existing));

            service.deleteRule(1L);

            assertThat(existing.isActive()).isFalse();
            verify(rules).save(existing);
        }

        @Test
        @DisplayName("deleteRule 404s for an unknown id")
        void deleteRuleNotFound() {
            when(rules.findById(99L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> service.deleteRule(99L))
                    .isInstanceOf(ApiException.class)
                    .extracting("status").isEqualTo(HttpStatus.NOT_FOUND);
        }
    }

    @Nested
    @DisplayName("blackout CRUD")
    class BlackoutCrud {

        @Test
        @DisplayName("listBlackouts maps every stored row")
        void listBlackoutsMapsAll() {
            when(blackouts.findAll()).thenReturn(List.of(
                    AppointmentBlackout.builder().id(1L).day(LocalDate.now().plusDays(3)).reason("Holiday").build()));

            List<BlackoutResponse> result = service.listBlackouts();

            assertThat(result).hasSize(1);
            assertThat(result.get(0).reason()).isEqualTo("Holiday");
        }

        @Test
        @DisplayName("creates a blackout for a day that has none yet")
        void createBlackoutSuccess() {
            LocalDate day = LocalDate.now().plusDays(3);
            when(blackouts.existsByDay(day)).thenReturn(false);

            BlackoutResponse response = service.createBlackout(new CreateBlackoutRequest(day, "Holiday"));

            assertThat(response.day()).isEqualTo(day);
            verify(blackouts).save(any(AppointmentBlackout.class));
        }

        @Test
        @DisplayName("refuses a second blackout on the same day")
        void createBlackoutDuplicateConflict() {
            LocalDate day = LocalDate.now().plusDays(3);
            when(blackouts.existsByDay(day)).thenReturn(true);

            assertThatThrownBy(() -> service.createBlackout(new CreateBlackoutRequest(day, "Holiday")))
                    .isInstanceOf(ApiException.class)
                    .extracting("status").isEqualTo(HttpStatus.CONFLICT);
            verify(blackouts, never()).save(any());
        }

        @Test
        @DisplayName("deletes an existing blackout")
        void deleteBlackoutSuccess() {
            when(blackouts.existsById(1L)).thenReturn(true);

            service.deleteBlackout(1L);

            verify(blackouts).deleteById(1L);
        }

        @Test
        @DisplayName("404s deleting an unknown blackout")
        void deleteBlackoutNotFound() {
            when(blackouts.existsById(99L)).thenReturn(false);

            assertThatThrownBy(() -> service.deleteBlackout(99L))
                    .isInstanceOf(ApiException.class)
                    .extracting("status").isEqualTo(HttpStatus.NOT_FOUND);
            verify(blackouts, never()).deleteById(any());
        }
    }
}
