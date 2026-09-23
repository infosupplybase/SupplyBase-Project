package in.supplybase.backend.catalogue.dto;

import java.math.BigDecimal;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * What an admin submits to edit a service category.
 *
 * The slug is not here — it is the path identifier and stays immutable once
 * created, since bookings and enquiries reference a category by slug.
 */
public record UpdateCategoryRequest(
        @NotBlank(message = "A name is required")
        @Size(max = 80) String name,

        @Size(max = 160) String tagline,
        String description,
        @Size(max = 40) String icon,
        String heroImage,

        BigDecimal visitFee,
        int sortOrder) {
}
