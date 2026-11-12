package in.supplybase.backend.auth.otp;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import in.supplybase.backend.auth.AuthService;
import in.supplybase.backend.auth.CurrentUser;
import in.supplybase.backend.auth.JwtAuthenticationFilter;
import in.supplybase.backend.auth.JwtService;
import in.supplybase.backend.auth.Role;
import in.supplybase.backend.auth.UserRepository;
import in.supplybase.backend.auth.dto.AuthResponse;
import in.supplybase.backend.auth.dto.UserResponse;
import in.supplybase.backend.common.ApiException;
import in.supplybase.backend.common.RestAccessDeniedHandler;
import in.supplybase.backend.common.RestAuthenticationEntryPoint;
import in.supplybase.backend.config.AppProperties;
import in.supplybase.backend.config.SecurityConfig;

/** Slice test for the OTP login endpoints, with the real security rules. */
@WebMvcTest(OtpController.class)
@Import({ SecurityConfig.class, JwtAuthenticationFilter.class, RestAuthenticationEntryPoint.class,
        RestAccessDeniedHandler.class, OtpControllerTest.SecurityTestConfig.class })
class OtpControllerTest {

    @MockitoBean
    private PhoneOtpService otp;

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private AuthService authService;
    @MockitoBean
    private CurrentUser currentUser;
    @MockitoBean
    private JwtService jwtService;
    @MockitoBean
    private UserRepository userRepository;

    @TestConfiguration
    static class SecurityTestConfig {
        @Bean
        AppProperties appProperties() {
            return new AppProperties(
                    List.of("http://localhost:5173"),
                    new AppProperties.Jwt("test-secret-key-at-least-32-bytes-long!!", 15, 30, "supplybase"),
                    new AppProperties.Razorpay(null, null, null, "INR"),
                    new AppProperties.Google(null),
                    new AppProperties.Notifications(null),
                    "http://localhost:5173",
                    new AppProperties.Bootstrap(null, null),
                    new AppProperties.Booking(48),
                    "/tmp/storage");
        }
    }

    private UserResponse sampleUser() {
    return new UserResponse(
            1L,
            "Jane Doe",
            "jane@example.com",
            "9820011223",
            "FEMALE",
            "101 MG Road",
            "Apartment 2A",
            "Mumbai",
            "400001",
            "Near Central Park",
            Role.CUSTOMER,
            null,
            true,
            true,
            true,
            null,
            null);
}

    private AuthResponse sampleAuthResponse() {
        return AuthResponse.of("access-token", "refresh-token", 900, sampleUser());
    }

    @Test
    void sendIsPublicAndNormalisesTheNumber() throws Exception {
        mockMvc.perform(post("/api/auth/otp/send")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"phone\":\"+91 98200 11223\"}"))
                .andExpect(status().isNoContent());
        verify(otp).send(eq("9820011223"), any());
    }

    @Test
    void sendRejectsANonMobileNumber() throws Exception {
        mockMvc.perform(post("/api/auth/otp/send")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"phone\":\"12345\"}"))
                .andExpect(status().isBadRequest());
        verify(otp, never()).send(any(), any());
    }

    @Test
    void verifySignsInAKnownNumberAndUsesUpTheCode() throws Exception {
        when(authService.loginWithVerifiedPhone("9820011223", null, null)).thenReturn(sampleAuthResponse());
        mockMvc.perform(post("/api/auth/otp/verify")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"phone\":\"9820011223\",\"code\":\"123456\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").value("access-token"));
        verify(otp).verify("9820011223", "123456");
        verify(otp).consume("9820011223");
    }

    @Test
    void verifyAsksANewNumberForDetailsAndKeepsTheCode() throws Exception {
        when(authService.loginWithVerifiedPhone("9820011223", null, null)).thenReturn(null);
        mockMvc.perform(post("/api/auth/otp/verify")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"phone\":\"9820011223\",\"code\":\"123456\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.needsDetails").value(true));
        verify(otp, never()).consume(any());
    }

    @Test
    void aWrongCodeNeverReachesSignIn() throws Exception {
        doThrow(ApiException.badRequest("That code is not right. 4 tries left."))
                .when(otp).verify("9820011223", "000000");
        mockMvc.perform(post("/api/auth/otp/verify")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"phone\":\"9820011223\",\"code\":\"000000\"}"))
                .andExpect(status().isBadRequest());
        verify(authService, never()).loginWithVerifiedPhone(any(), any(), any());
    }

    @Test
    void statusIsPublic() throws Exception {
        when(otp.enabled()).thenReturn(true);
        mockMvc.perform(get("/api/auth/otp/status"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.enabled").value(true));
    }
}
