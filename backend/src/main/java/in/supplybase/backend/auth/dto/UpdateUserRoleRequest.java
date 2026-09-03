package in.supplybase.backend.auth.dto;

import in.supplybase.backend.auth.Role;
import jakarta.validation.constraints.NotNull;

public record UpdateUserRoleRequest(@NotNull(message = "Please choose a role") Role role) {
}
