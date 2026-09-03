package in.supplybase.backend.auth.dto;

/** `enabled` is a primitive: false is as valid a request as true, so it needs no @NotNull. */
public record UpdateUserStatusRequest(boolean enabled) {
}
