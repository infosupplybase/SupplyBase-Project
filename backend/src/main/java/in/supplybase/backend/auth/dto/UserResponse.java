package in.supplybase.backend.auth.dto;

import in.supplybase.backend.auth.Role;
import in.supplybase.backend.auth.User;

public record UserResponse(Long id, String fullName, String email, String phone, Role role) {

    public static UserResponse from(User user) {
        return new UserResponse(user.getId(), user.getFullName(), user.getEmail(),
                user.getPhone(), user.getRole());
    }
}
