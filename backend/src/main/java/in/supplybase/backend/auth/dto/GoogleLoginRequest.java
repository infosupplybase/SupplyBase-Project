package in.supplybase.backend.auth.dto;

import jakarta.validation.constraints.NotBlank;

/** The credential string Google Identity Services hands the browser. */
public record GoogleLoginRequest(@NotBlank(message = "A Google credential is required") String credential) {
}
