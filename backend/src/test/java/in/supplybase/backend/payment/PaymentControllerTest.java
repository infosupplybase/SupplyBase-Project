package in.supplybase.backend.payment;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.math.BigDecimal;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.PageImpl;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.RequestPostProcessor;

import in.supplybase.backend.auth.AuthenticatedUser;
import in.supplybase.backend.auth.JwtAuthenticationFilter;
import in.supplybase.backend.auth.Role;
import in.supplybase.backend.config.AppProperties;
import in.supplybase.backend.config.SecurityConfig;
import in.supplybase.backend.payment.dto.PaymentResponse;
import in.supplybase.backend.payment.dto.RazorpayOrderResponse;

/**
 * @WebMvcTest slice for PaymentController with the real SecurityConfig wired
 * in, so the 401/403 boundary is exercised for real rather than assumed.
 *
 * The one thing @WebMvcTest cannot give us for free is JwtAuthenticationFilter
 * — it needs a real JwtService and UserRepository, neither of which this
 * slice loads. Rather than drag the whole JWT stack in, the filter bean is a
 * Mockito mock stubbed to pass every request straight through the chain
 * (see passJwtFilterThrough below); the actual principal for each test is
 * then supplied with Spring Security Test's `authentication(...)` request
 * post-processor, which lands in the SecurityContext ahead of the rest of
 * the chain. This exercises SecurityConfig's real authorizeHttpRequests
 * rules (permitAll / hasRole("ADMIN") / authenticated()) without needing a
 * real bearer token anywhere.
 */
@WebMvcTest(PaymentController.class)
@Import({ SecurityConfig.class, in.supplybase.backend.common.RestAuthenticationEntryPoint.class,
        in.supplybase.backend.common.RestAccessDeniedHandler.class, in.supplybase.backend.auth.CurrentUser.class,
        PaymentControllerTest.TestSecurityBeans.class })
class PaymentControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private PaymentService service;

    @MockitoBean
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @Autowired
    private SecurityFilterChain securityFilterChain; // forces SecurityConfig to actually initialise

    @BeforeEach
    void passJwtFilterThrough() throws Exception {
        doAnswer(invocation -> {
            jakarta.servlet.ServletRequest request = invocation.getArgument(0);
            jakarta.servlet.ServletResponse response = invocation.getArgument(1);
            jakarta.servlet.FilterChain chain = invocation.getArgument(2);
            chain.doFilter(request, response);
            return null;
        }).when(jwtAuthenticationFilter).doFilter(any(), any(), any());
    }

    @TestConfiguration
    static class TestSecurityBeans {
        @Bean
        AppProperties appProperties() {
            return new AppProperties(List.of(), null, null, null, null, null, null, null, null);
        }
    }

    private static RequestPostProcessor as(long id, Role role) {
        AuthenticatedUser principal = new AuthenticatedUser(id, "user" + id + "@supplybase.in", role);
        return authentication(new UsernamePasswordAuthenticationToken(principal, null,
                List.of(new SimpleGrantedAuthority(role.authority()))));
    }

    private static RequestPostProcessor asCustomer() {
        return as(1L, Role.CUSTOMER);
    }

    private static RequestPostProcessor asAdmin() {
        return as(99L, Role.ADMIN);
    }

    private static PaymentResponse samplePaymentResponse() {
        return new PaymentResponse(1L, "PAY-260101-ABCD", PaymentType.INVOICE, "Site visit",
                new BigDecimal("500.00"), "₹500.00", "INR", PaymentStatus.PENDING,
                null, null, null, null, null);
    }

    /* ------------------------------------------------------------ mine */

    @Nested
    class Mine {

        @Test
        @DisplayName("GET /api/payments/mine refuses an anonymous caller")
        void anonymousIsRejected() throws Exception {
            mockMvc.perform(get("/api/payments/mine"))
                    .andExpect(status().isUnauthorized());
        }

        @Test
        @DisplayName("GET /api/payments/mine returns the caller's payments")
        void authenticatedSucceeds() throws Exception {
            when(service.myPayments(1L)).thenReturn(List.of(samplePaymentResponse()));

            mockMvc.perform(get("/api/payments/mine").with(asCustomer()))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$[0].reference").value("PAY-260101-ABCD"));
        }
    }

    /* ---------------------------------------------------------- checkout */

    @Nested
    class Checkout {

        @Test
        @DisplayName("POST /api/payments/{id}/order returns the Razorpay order for an authenticated caller")
        void startCheckoutSucceeds() throws Exception {
            RazorpayOrderResponse response = new RazorpayOrderResponse("order_1", "rzp_test_key", 50000L,
                    "INR", "PAY-260101-ABCD", "Site visit", "A. Client", "client@x.com", "9820011223");
            when(service.startCheckout(eq(1L), any())).thenReturn(response);

            mockMvc.perform(post("/api/payments/1/order").with(asCustomer()))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.orderId").value("order_1"));
        }

        @Test
        @DisplayName("POST /api/payments/{id}/order refuses an anonymous caller")
        void startCheckoutAnonymousRejected() throws Exception {
            mockMvc.perform(post("/api/payments/1/order"))
                    .andExpect(status().isUnauthorized());
        }

        @Test
        @DisplayName("POST /api/payments/verify rejects a body missing required fields")
        void verifyRejectsInvalidBody() throws Exception {
            mockMvc.perform(post("/api/payments/verify").with(asCustomer())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"razorpayOrderId\":\"\",\"razorpayPaymentId\":\"\",\"razorpaySignature\":\"\"}"))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("POST /api/payments/verify succeeds with a valid body")
        void verifySucceeds() throws Exception {
            when(service.confirmFromCheckout(any(), any())).thenReturn(samplePaymentResponse());

            mockMvc.perform(post("/api/payments/verify").with(asCustomer())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"razorpayOrderId\":\"order_1\",\"razorpayPaymentId\":\"pay_1\",\"razorpaySignature\":\"sig_1\"}"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.reference").value("PAY-260101-ABCD"));
        }
    }

    /* ----------------------------------------------------------- invoice */

    @Nested
    class Invoice {

        @Test
        @DisplayName("GET /api/payments/{id}/invoice returns a PDF with the right filename")
        void invoiceReturnsPdf() throws Exception {
            byte[] pdfBytes = { '%', 'P', 'D', 'F' };
            when(service.getInvoicePdf(eq(1L), any())).thenReturn(new InvoiceFile("PAY-260101-ABCD", pdfBytes));

            mockMvc.perform(get("/api/payments/1/invoice").with(asCustomer()))
                    .andExpect(status().isOk())
                    .andExpect(content().contentType(MediaType.APPLICATION_PDF))
                    .andExpect(header().string("Content-Disposition",
                            "attachment; filename=\"invoice-PAY-260101-ABCD.pdf\""));
        }
    }

    /* ----------------------------------------------------------- staff */

    @Nested
    class Admin {

        @Test
        @DisplayName("GET /api/admin/payments refuses an anonymous caller")
        void listAnonymousRejected() throws Exception {
            mockMvc.perform(get("/api/admin/payments"))
                    .andExpect(status().isUnauthorized());
        }

        @Test
        @DisplayName("GET /api/admin/payments refuses a non-admin caller")
        void listNonAdminForbidden() throws Exception {
            mockMvc.perform(get("/api/admin/payments").with(asCustomer()))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("GET /api/admin/payments succeeds for an admin")
        void listAdminSucceeds() throws Exception {
            when(service.listAll(any())).thenReturn(new PageImpl<>(List.of(samplePaymentResponse())));

            mockMvc.perform(get("/api/admin/payments").with(asAdmin()))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.content[0].reference").value("PAY-260101-ABCD"));
        }

        @Test
        @DisplayName("POST /api/admin/payments refuses an anonymous caller")
        void raiseAnonymousRejected() throws Exception {
            mockMvc.perform(post("/api/admin/payments")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(validRaiseBody()))
                    .andExpect(status().isUnauthorized());
        }

        @Test
        @DisplayName("POST /api/admin/payments refuses a non-admin caller")
        void raiseNonAdminForbidden() throws Exception {
            mockMvc.perform(post("/api/admin/payments").with(asCustomer())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(validRaiseBody()))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("POST /api/admin/payments rejects an invalid body even for an admin")
        void raiseRejectsInvalidBody() throws Exception {
            mockMvc.perform(post("/api/admin/payments").with(asAdmin())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"userId\":null,\"description\":\"\",\"amount\":0}"))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("POST /api/admin/payments creates a payment for an admin")
        void raiseSucceedsForAdmin() throws Exception {
            when(service.raise(any())).thenReturn(samplePaymentResponse());

            mockMvc.perform(post("/api/admin/payments").with(asAdmin())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(validRaiseBody()))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.reference").value("PAY-260101-ABCD"));
        }

        @Test
        @DisplayName("POST /api/admin/payments/{id}/refund refuses an anonymous caller")
        void refundAnonymousRejected() throws Exception {
            mockMvc.perform(post("/api/admin/payments/1/refund")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(validRefundBody()))
                    .andExpect(status().isUnauthorized());
        }

        @Test
        @DisplayName("POST /api/admin/payments/{id}/refund refuses a non-admin caller")
        void refundNonAdminForbidden() throws Exception {
            mockMvc.perform(post("/api/admin/payments/1/refund").with(asCustomer())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(validRefundBody()))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("POST /api/admin/payments/{id}/refund rejects a negative amount")
        void refundRejectsInvalidBody() throws Exception {
            mockMvc.perform(post("/api/admin/payments/1/refund").with(asAdmin())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"amountPaise\":-500,\"reason\":\"Client cancelled\"}"))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("POST /api/admin/payments/{id}/refund initiates a refund for an admin")
        void refundSucceedsForAdmin() throws Exception {
            when(service.initiateRefund(eq(1L), any(), any())).thenReturn("rfnd_1");

            mockMvc.perform(post("/api/admin/payments/1/refund").with(asAdmin())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(validRefundBody()))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.refundId").value("rfnd_1"))
                    .andExpect(jsonPath("$.status").value("initiated"));
        }

        private String validRaiseBody() {
            return "{\"userId\":1,\"paymentType\":\"INVOICE\",\"description\":\"Site visit\",\"amount\":500.00}";
        }

        private String validRefundBody() {
            return "{\"amountPaise\":5000,\"reason\":\"Client requested a partial refund\"}";
        }
    }
}
