package in.supplybase.backend.auth.dto;

import in.supplybase.backend.auth.Role;
import in.supplybase.backend.auth.User;

public record UserResponse(
        Long id,
        String fullName,
        String email,
        String phone,
        String gender,
        String addressLine1,
        String addressLine2,
        String city,
        String pinCode,
        String landmark,
        Role role,
        String pictureUrl,
        boolean hasPassword,
        boolean enabled,
        boolean emailVerified) {

    public static UserResponse from(User user) {
        return new UserResponse(
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getPhone(),
                user.getGender(),
                user.getAddressLine1(),
                user.getAddressLine2(),
                user.getCity(),
                user.getPinCode(),
                user.getLandmark(),
                user.getRole(),
                user.getPictureUrl(),
                user.hasPassword(),
                user.isEnabled(),
                user.isEmailVerified());
    }
}