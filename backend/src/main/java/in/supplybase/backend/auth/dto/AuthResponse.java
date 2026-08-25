package in.supplybase.backend.auth.dto;

public record AuthResponse(
        String accessToken,
        String refreshToken,
        String tokenType,
        long expiresInSeconds,
        UserResponse user) {

    public static AuthResponse of(String access, String refresh, long expiresIn, UserResponse user) {
        return new AuthResponse(access, refresh, "Bearer", expiresIn, user);
    }
}
