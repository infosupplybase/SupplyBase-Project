package in.supplybase.backend.booking.dto;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * What the booking form posts.
 *
 * `answers` is deliberately open-ended: the questions are data, so the request
 * carries whatever the form was told to ask rather than a fixed field per
 * question. The server checks each answer against the catalogue before storing
 * it, so an open shape is not an unvalidated one.
 */
public record CreateBookingRequest(
        @NotBlank(message = "Please choose a service") String serviceSlug,

        @Valid List<AnswerInput> answers,

        @NotNull(message = "Please choose a date") LocalDate preferredDate,
        @NotNull(message = "Please choose a time") LocalTime preferredTime,

        @NotBlank(message = "Please enter your name") @Size(max = 120) String name,
        @NotBlank(message = "Please enter your mobile number") String phone,
        String whatsapp,
        @Email(message = "That email address does not look right") @Size(max = 190) String email,

        @NotBlank(message = "Please enter your address") @Size(max = 400) String address,
        @NotBlank(message = "Please enter your city") @Size(max = 80) String city,

        @Pattern(regexp = "^[1-9][0-9]{5}$", message = "Enter a 6-digit pincode")
        String pincode,

        Integer areaSqft) {

    public record AnswerInput(
            @NotBlank @Size(max = 60) String key,
            @NotBlank @Size(max = 400) String value,
            @Size(max = 300) String label,
            /** Cart quantity — only meaningful for a 'cart_item' answer; null/absent means 1. */
            @jakarta.validation.constraints.Min(1) Integer quantity) {
    }
}
