import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import customerReviews from "../../data/customerReviews";
import { contact } from "../../data/siteConfig";

const hasPhotos = (item) => Array.isArray(item.photos) && item.photos.length > 0;

// Longer reviews start collapsed to a few lines, with a "Read more" toggle.
const LONG_REVIEW = 160;

const PHONE_QUERY = "(max-width: 768px)";

/** 3 reviews per page on desktop, 1 on a phone. */
function useReviewsPerSlide() {
  const getCount = () =>
    typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia(PHONE_QUERY).matches
      ? 1
      : 3;

  const [count, setCount] = useState(getCount);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) {
      return undefined;
    }

    const mq = window.matchMedia(PHONE_QUERY);
    const sync = () => setCount(getCount());

    mq.addEventListener("change", sync);
    sync();

    return () => mq.removeEventListener("change", sync);
  }, []);

  return count;
}

function Stars({ rating }) {
  return (
    <div className="review-stars" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={star <= rating ? "star-filled" : "star-empty"}
        >
          ★
        </span>
      ))}
    </div>
  );
}

export default function CustomerReviews() {

  const reviews = customerReviews;
  const [selectedRating, setSelectedRating] = useState("all");
  const [currentSlide, setCurrentSlide] = useState(0);
  const [expanded, setExpanded] = useState({});
  const REVIEWS_PER_SLIDE = useReviewsPerSlide();

  const toggleExpanded = (id) =>
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  const filteredReviews = useMemo(() => {
    let result = [...reviews];

    if (selectedRating !== "all") {
      result = result.filter(
        (item) => Number(item.rating) === Number(selectedRating)
      );
    }

    // Reviews with photos first, then highest rating.
    result.sort((a, b) => {
      const photoDifference = Number(hasPhotos(b)) - Number(hasPhotos(a));

      if (photoDifference !== 0) {
        return photoDifference;
      }

      const ratingDifference = Number(b.rating) - Number(a.rating);

      if (ratingDifference !== 0) {
        return ratingDifference;
      }

      // Otherwise keep the order of the list in customerReviews.js.
      return reviews.indexOf(a) - reviews.indexOf(b);
    });

    return result;
  }, [reviews, selectedRating]);

  const totalSlides = Math.max(
    1,
    Math.ceil(filteredReviews.length / REVIEWS_PER_SLIDE)
  );
  const safeCurrentSlide =
    ((currentSlide % totalSlides) + totalSlides) % totalSlides;

  const startIndex = safeCurrentSlide * REVIEWS_PER_SLIDE;

  const currentReviews = filteredReviews.slice(
    startIndex,
    startIndex + REVIEWS_PER_SLIDE
  );

  const goToNextSlide = () => {
    setCurrentSlide((prev) => {
      if (totalSlides <= 1) {
        return 0;
      }

      return (prev + 1) % totalSlides;
    });
  };

  const goToPreviousSlide = () => {
    setCurrentSlide((prev) => {
      if (totalSlides <= 1) {
        return 0;
      }

      return (prev - 1 + totalSlides) % totalSlides;
    });
  };

  const goToSlide = (index) => {
    if (index >= 0 && index < totalSlides) {
      setCurrentSlide(index);
    }
  };

  const changeRating = (rating) => {
    setSelectedRating(rating);
    setCurrentSlide(0);
  };

  const hasReviews = reviews.length > 0;

  return (
    <section className="customer-reviews" id="customer-reviews">
      <div className="container">
        <div className="reviews-heading">
          <span className="reviews-label">CLIENT STORIES</span>

          <h2>
            What Our <span>Clients Say</span>
          </h2>

          <p>
            Real experiences from clients who trusted us with their spaces.
          </p>
        </div>

        {hasReviews ? (
          <>
            <div className="review-filters">
              <button
                type="button"
                className={selectedRating === "all" ? "active" : ""}
                onClick={() => changeRating("all")}
              >
                ALL
              </button>

              {[5, 4, 3, 2, 1].map((rating) => (
                <button
                  type="button"
                  key={rating}
                  className={selectedRating === String(rating) ? "active" : ""}
                  onClick={() => changeRating(String(rating))}
                >
                  {"★".repeat(rating)}
                </button>
              ))}
            </div>

            <div className="review-slider-wrapper">
              <button
                type="button"
                className="review-arrow review-arrow-left"
                onClick={goToPreviousSlide}
                aria-label="Previous reviews"
              >
                ‹
              </button>

              <div className="review-grid">
                {currentReviews.map((item) => (
                  <article className="review-card" key={item.id}>
                    <span className="quote-mark">“</span>

                    {hasPhotos(item) && (
                      <div className="review-photos">
                        {item.photos.slice(0, 3).map((photo, index) => (
                          <img
                            key={photo}
                            src={photo}
                            alt={`Photo ${index + 1} from ${item.name}'s review`}
                            loading="lazy"
                            decoding="async"
                          />
                        ))}
                      </div>
                    )}

                    <Stars rating={Number(item.rating)} />

                    <p
                      className={`review-text${
                        item.review.length > LONG_REVIEW && !expanded[item.id]
                          ? " review-text--clamped"
                          : ""
                      }`}
                    >
                      {item.review}
                    </p>

                    {item.review.length > LONG_REVIEW && (
                      <button
                        type="button"
                        className="review-more"
                        onClick={() => toggleExpanded(item.id)}
                        aria-expanded={Boolean(expanded[item.id])}
                      >
                        {expanded[item.id] ? "Show less" : "Read more"}
                      </button>
                    )}

                    <div className="review-client">
                      <div className="client-avatar">
                        {item.name.charAt(0).toUpperCase()}
                      </div>

                      <div className="client-info">
                        <strong>{item.name}</strong>

                        {item.location && (
                          <span className="client-location">
                            {item.location}
                          </span>
                        )}

                        {item.verified && (
                          <span className="verified">✓ Verified Client</span>
                        )}
                      </div>
                    </div>
                  </article>
                ))}
              </div>

              <button
                type="button"
                className="review-arrow review-arrow-right"
                onClick={goToNextSlide}
                aria-label="Next reviews"
              >
                ›
              </button>
            </div>

            <div className="review-dots">
              {Array.from({ length: totalSlides }).map((_, index) => (
                <button
                  type="button"
                  key={index}
                  className={index === safeCurrentSlide ? "active" : ""}
                  onClick={() => goToSlide(index)}
                  aria-label={`Go to review slide ${index + 1}`}
                />
              ))}
            </div>

            {contact.googleBusinessUrl && (
              <p className="reviews-google-link">
                <a
                  href={contact.googleBusinessUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  See all our reviews on Google
                </a>
              </p>
            )}
          </>
        ) : (
          <div className="reviews-empty">
            <p>
              We are collecting reviews from our first customers. Book a
              service and yours could be the first story here.
            </p>
            <Link to="/services" className="reviews-empty__cta">
              Book a service
            </Link>
          </div>
        )}
      </div>

    </section>
  );
}