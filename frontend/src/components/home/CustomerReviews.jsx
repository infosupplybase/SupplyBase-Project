import { useMemo, useState } from "react";
import customerReviews from "../../data/customerReviews";

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

  const filteredReviews = useMemo(() => {
    let result = [...reviews];

    if (selectedRating !== "all") {
      result = result.filter(
        (item) => Number(item.rating) === Number(selectedRating)
      );
    }

    // Highest rating first.
    result.sort((a, b) => {
      const ratingDifference = Number(b.rating) - Number(a.rating);

      if (ratingDifference !== 0) {
        return ratingDifference;
      }

      return String(a.id).localeCompare(String(b.id));
    });

    return result;
  }, [reviews, selectedRating]);

  const REVIEWS_PER_SLIDE = 5;

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

  // Nothing to show until real reviews are added to data/customerReviews.js.
  if (reviews.length === 0) return null;

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

                <Stars rating={Number(item.rating)} />

                <p className="review-text">{item.review}</p>

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
      </div>

    </section>
  );
}