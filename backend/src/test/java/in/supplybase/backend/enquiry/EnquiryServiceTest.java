package in.supplybase.backend.enquiry;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;

import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.http.HttpStatus;
import org.springframework.mail.javamail.JavaMailSender;

import in.supplybase.backend.common.ApiException;
import in.supplybase.backend.common.InMemoryRateLimiter;
import in.supplybase.backend.config.AppProperties;
import in.supplybase.backend.enquiry.dto.CreateEnquiryRequest;

/** Mockito-only: the repository is mocked, the rate limiter is the real one. */
@ExtendWith(MockitoExtension.class)
class EnquiryServiceTest {

    @Mock EnquiryRepository enquiries;
    @Mock ObjectProvider<JavaMailSender> mailSender;

    EnquiryService service;

    @BeforeEach
    void setUp() {
        AppProperties props = new AppProperties(
                List.of("*"), null, null, null,
                new AppProperties.Notifications(null), // email disabled
                null, null, new AppProperties.Booking(30), null);
        service = new EnquiryService(enquiries, props, mailSender, new InMemoryRateLimiter());
        lenient().when(enquiries.save(any())).thenAnswer(inv -> inv.getArgument(0));
    }

    private static CreateEnquiryRequest enquiry(String phone) {
        return new CreateEnquiryRequest("Rahul D'Souza", phone, null, "Other", null, null, null,
                "Need two rooms painted before Diwali.", EnquirySource.CONTACT_FORM);
    }

    @Test
    @DisplayName("one connection is cut off after 20 enquiries in an hour, even with a new phone each time")
    void limitsEnquiriesPerIp() {
        for (int i = 0; i < 20; i++) {
            service.create(enquiry("98765" + String.format("%05d", i)), "203.0.113.7");
        }

        assertThatThrownBy(() -> service.create(enquiry("9123456780"), "203.0.113.7"))
                .isInstanceOf(ApiException.class)
                .satisfies(e -> assertThat(((ApiException) e).getStatus()).isEqualTo(HttpStatus.TOO_MANY_REQUESTS));
    }

    @Test
    @DisplayName("another connection is not affected by someone else hitting the limit")
    void otherIpsUnaffected() {
        for (int i = 0; i < 20; i++) {
            service.create(enquiry("98765" + String.format("%05d", i)), "203.0.113.7");
        }

        assertThat(service.create(enquiry("9123456780"), "198.51.100.4")).isNotNull();
    }
}
