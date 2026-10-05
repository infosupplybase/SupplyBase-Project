package in.supplybase.backend.config;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import in.supplybase.backend.booking.BookingController;
import in.supplybase.backend.booking.BookingService;
import in.supplybase.backend.support.WebSecurityTestConfig;

/**
 * The API docs list every endpoint (admin ones included), so unless
 * API_DOCS_ENABLED=true they must not be readable without signing in.
 */
@WebMvcTest(BookingController.class)
@Import(WebSecurityTestConfig.class)
class ApiDocsAccessTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private BookingService service;

    @Test
    @DisplayName("the OpenAPI spec needs a token while the docs are switched off")
    void specIsNotPublic() throws Exception {
        mockMvc.perform(get("/v3/api-docs")).andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Swagger UI needs a token while the docs are switched off")
    void swaggerUiIsNotPublic() throws Exception {
        mockMvc.perform(get("/swagger-ui/index.html")).andExpect(status().isUnauthorized());
        mockMvc.perform(get("/swagger-ui.html")).andExpect(status().isUnauthorized());
    }
}
