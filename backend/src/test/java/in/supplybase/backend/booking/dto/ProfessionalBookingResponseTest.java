package in.supplybase.backend.booking.dto;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;

import in.supplybase.backend.booking.Booking;
import in.supplybase.backend.booking.BookingStatus;

/** What a partner is shown of the customer, by job status. */
class ProfessionalBookingResponseTest {

    private static Booking job(BookingStatus status) {
        return Booking.builder().id(1L).status(status)
                .name("Asha").phone("9876543210").whatsapp("9876543210")
                .address("Flat 4, Sunrise Towers").location("Andheri West, Mumbai")
                .build();
    }

    @ParameterizedTest
    @EnumSource(value = BookingStatus.class, names = {"WORK_COMPLETED", "CANCELLED"}, mode = EnumSource.Mode.EXCLUDE)
    @DisplayName("while the job is open the partner gets the customer's contact details and address")
    void openJobsCarryContactDetails(BookingStatus status) {
        ProfessionalBookingResponse response = ProfessionalBookingResponse.from(job(status));

        assertThat(response.phone()).isEqualTo("9876543210");
        assertThat(response.whatsapp()).isEqualTo("9876543210");
        assertThat(response.address()).isEqualTo("Flat 4, Sunrise Towers");
    }

    @ParameterizedTest
    @EnumSource(value = BookingStatus.class, names = {"WORK_COMPLETED", "CANCELLED"})
    @DisplayName("a finished job withholds phone, WhatsApp and street address but keeps the name and area")
    void finishedJobsWithholdContactDetails(BookingStatus status) {
        ProfessionalBookingResponse response = ProfessionalBookingResponse.from(job(status));

        assertThat(response.phone()).isNull();
        assertThat(response.whatsapp()).isNull();
        assertThat(response.address()).isNull();
        assertThat(response.name()).isEqualTo("Asha");
        assertThat(response.location()).isEqualTo("Andheri West, Mumbai");
    }
}
