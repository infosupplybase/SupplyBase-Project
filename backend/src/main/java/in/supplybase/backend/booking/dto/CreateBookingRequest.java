package in.supplybase.backend.booking.dto;

import java.time.LocalDate;

import in.supplybase.backend.booking.BookingType;
import in.supplybase.backend.booking.MaterialSupplier;
import in.supplybase.backend.booking.TimeSlot;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * What the booking wizard posts. Only the facts needed to ring someone back
 * are required — every extra field is one more reason to abandon the form.
 */
public record CreateBookingRequest(
        @NotNull(message = "Please choose a booking type") BookingType bookingType,

        @NotBlank(message = "Please choose a service") @Size(max = 60) String serviceSlug,
        @NotBlank @Size(max = 80) String serviceLabel,

        @Size(max = 40) String propertyType,

        @Min(value = 1, message = "Area must be more than zero")
        @Max(value = 10_000_000, message = "That area looks too large")
        Integer areaSqft,

        @Size(max = 30) String workNature,
        @Size(max = 80) String workOption,
        @Size(max = 4000, message = "Please keep this under 4000 characters") String workDetail,

        MaterialSupplier materialSupplier,
        @Size(max = 60) String budgetRange,

        // Future, not FutureOrPresent: by the time someone finishes this form,
        // a same-day slot has usually already passed.
        @Future(message = "Please choose a date in the future") LocalDate preferredDate,
        TimeSlot preferredSlot,

        @NotBlank(message = "Please enter your name") @Size(max = 120) String name,
        @NotBlank(message = "Please enter your mobile number") String phone,
        String whatsapp,

        @Email(message = "That email address does not look right") @Size(max = 190) String email,

        @Size(max = 400) String address,
        @Size(max = 160) String location,

        /**
         * Boxed on purpose. Jackson builds a record through its canonical
         * constructor and passes null for any field the caller omitted, and
         * null cannot go into a primitive boolean — so `boolean` here turned
         * every request that left this field out into a 500.
         */
        Boolean hasAttachments) {

    /** Absent means "no attachments", not an error. */
    public boolean attachmentsPresent() {
        return Boolean.TRUE.equals(hasAttachments);
    }
}
