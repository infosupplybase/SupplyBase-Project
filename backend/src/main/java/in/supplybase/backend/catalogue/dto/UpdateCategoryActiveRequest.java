package in.supplybase.backend.catalogue.dto;

/** What an admin submits to reactivate or deactivate a category. */
public record UpdateCategoryActiveRequest(boolean active) {
}
