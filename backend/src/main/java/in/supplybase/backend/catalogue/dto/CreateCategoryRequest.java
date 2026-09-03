package in.supplybase.backend.catalogue.dto;

import java.math.BigDecimal;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/** What an admin submits to add a new service category. */
public record CreateCategoryRequest(
        @NotBlank(message = "A slug is required")
        @Pattern(regexp = "^[a-z0-9-]+$", message = "A slug may only contain lowercase letters, numbers and hyphens")
        String slug,

        @NotBlank(message = "A name is required")
        @Size(max = 80) String name,

        @Size(max = 160) String tagline,
        String description,
        @Size(max = 40) String icon,
        String heroImage,

        BigDecimal visitFee,
        int sortOrder) {
}
