package in.supplybase.backend.catalogue.dto;

import in.supplybase.backend.catalogue.ServiceCategory;

/**
 * One catalogue search hit — a main category or a sub-service (electrician's
 * seven detailed journeys today). {@code parentSlug} tells the frontend which
 * route to build: a sub-service opens under its parent, a main category opens
 * at its own slug.
 */
public record SearchResultResponse(
        String slug, String parentSlug, String name, String tagline, String icon) {

    public static SearchResultResponse from(ServiceCategory c) {
        return new SearchResultResponse(c.getSlug(), c.getParentSlug(), c.getName(),
                c.getTagline(), c.getIcon());
    }
}
