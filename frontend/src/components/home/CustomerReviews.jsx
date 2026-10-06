import { useEffect, useMemo, useState } from "react";

const REVIEW_VERSION = "reviews-v5";

const names = [
  "Aarav Sharma",
  "Ananya Patil",
  "Rohan Mehta",
  "Priya Shah",
  "Aditya Joshi",
  "Sneha Kulkarni",
  "Rahul Deshmukh",
  "Neha Kapoor",
  "Karan Malhotra",
  "Pooja Verma",
  "Akash More",
  "Riya Jain",
  "Siddharth Rao",
  "Isha Gupta",
  "Vivek Nair",
  "Meera Singh",
  "Arjun Kulkarni",
  "Tanvi Shah",
  "Yash Patil",
  "Kavya Mehta",
  "Omkar Joshi",
  "Shreya Desai",
  "Nikhil Sharma",
  "Aditi Kapoor",
  "Manish Verma",
  "Simran Jain",
  "Ritesh More",
  "Nikita Rao",
  "Varun Gupta",
  "Mitali Singh",
  "Harsh Nair",
  "Sakshi Patil",
  "Ayush Shah",
  "Divya Mehta",
  "Rohit Joshi",
  "Kritika Desai",
  "Saurabh Sharma",
  "Pallavi Kapoor",
  "Aman Verma",
  "Nisha Jain",
  "Raj More",
  "Komal Rao",
  "Ankit Gupta",
  "Swati Singh",
  "Mohit Nair",
  "Payal Patil",
  "Deepak Shah",
  "Rashmi Mehta",
  "Abhishek Joshi",
  "Sonali Desai",
  "Vishal Sharma",
  "Shruti Kapoor",
  "Gaurav Verma",
  "Priti Jain",
  "Sanjay More",
  "Ritu Rao",
  "Neel Singh",
  "Maya Nair",
  "Rajat Patil",
  "Kavita Shah",
  "Aakash Mehta",
  "Ishita Joshi",
  "Naman Desai",
  "Reema Sharma",
  "Jay Kapoor",
  "Bhavna Verma",
  "Dev Jain",
  "Anjali More",
  "Kunal Rao",
  "Rhea Gupta",
  "Manav Singh",
  "Tina Nair",
  "Sahil Patil",
  "Nandini Shah",
  "Ravi Mehta",
  "Muskan Joshi",
  "Varsha Desai",
];

const reviewTexts = {
  5: [
    "Absolutely loved the design. Everything feels elegant and perfectly planned.",
    "The team understood our requirements very well and delivered beautifully.",
    "Very professional service with excellent attention to detail.",
    "Our living room looks completely different and feels much more spacious.",
    "The design quality exceeded our expectations.",
    "Beautiful work from start to finish. Highly recommended.",
    "The entire process was smooth and well managed.",
    "Loved the modern and premium look of our home.",
    "Excellent suggestions and very practical design ideas.",
    "The final result looks even better than the original concept.",
    "Very happy with the furniture selection and overall styling.",
    "The team was creative, patient and professional.",
    "Our home finally has the luxury look we wanted.",
    "Great experience with a very talented design team.",
    "The attention given to small details was impressive.",
    "The colour combination and lighting design are perfect.",
    "Very professional communication throughout the project.",
    "The design is stylish but still comfortable for everyday living.",
    "Really impressed with the final transformation.",
    "The team made the entire interior process easy for us.",
    "Wonderful design ideas and excellent execution.",
    "The space feels much more organized and beautiful now.",
    "They understood our taste perfectly.",
    "Excellent service and beautiful results.",
    "The final interior looks premium and elegant.",
    "Very happy with the overall experience.",
    "Creative designs with practical solutions.",
    "The bedroom design is exactly what we wanted.",
    "Amazing work and great coordination.",
    "The final result looks classy and timeless.",
    "The team gave us many useful ideas within our budget.",
    "Very satisfied with the quality of work.",
    "The whole home feels fresh and modern now.",
    "Professional, creative and reliable team.",
    "Would definitely recommend their interior design service.",
  ],

  4: [
    "Really good design and professional team.",
    "The final result was beautiful and well planned.",
    "Good experience overall with some excellent design ideas.",
    "The team was helpful and understood our requirements.",
    "Very nice work and good attention to detail.",
    "Happy with the overall interior transformation.",
    "The design looks modern and elegant.",
    "Good communication and professional service.",
    "The space looks much better after the makeover.",
    "Really liked the furniture and colour selection.",
    "The team provided practical and stylish solutions.",
    "Good quality work and smooth execution.",
    "Very satisfied with the final design.",
    "The bedroom and living room turned out beautifully.",
    "Nice experience and good customer support.",
    "The design matched most of our expectations.",
    "Professional team with creative ideas.",
    "Good service and attractive final result.",
    "The overall look is stylish and comfortable.",
    "We are happy with the transformation.",
    "Good planning and neat execution.",
    "Would recommend the service to others.",
  ],

  3: [
    "The design was good and the team was cooperative.",
    "Overall a decent experience with some nice ideas.",
    "The final result was satisfactory.",
    "Good design but the process took a little longer.",
    "The team understood most of our requirements.",
    "Some areas could have been planned better.",
    "The interior looks good overall.",
    "Decent service with a nice final result.",
    "The design ideas were useful and practical.",
    "Overall satisfied with the project.",
  ],

  2: [
    "The design was okay but the project took longer than expected.",
    "Some of the requirements were not understood properly.",
    "The final result was average compared to our expectations.",
    "There were some delays during the project.",
  ],

  1: [
    "The project had several delays and communication issues.",
    "The final result did not match our expectations.",
    "There were multiple issues during the execution.",
    "The overall experience was not satisfactory.",
  ],
};

function createDefaultReviews() {
  const result = [];
  let index = 0;

  [5, 4, 3, 2, 1].forEach((rating) => {
    reviewTexts[rating].forEach((text) => {
      result.push({
        id: `default-${index + 1}`,
        name: names[index % names.length],
        location: "",
        rating,
        review: text,
        verified: true,
      });

      index += 1;
    });
  });

  return result;
}

function Stars({ rating }) {
  return (
    <div
      className="review-stars"
      aria-label={`${rating} out of 5 stars`}
    >
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
  const [reviews, setReviews] = useState(() => {
    try {
      const savedVersion =
        localStorage.getItem("customerReviewsVersion");

      const savedReviews =
        localStorage.getItem("customerReviews");

      if (savedVersion !== REVIEW_VERSION || !savedReviews) {
        return createDefaultReviews();
      }

      const parsed = JSON.parse(savedReviews);

      if (!Array.isArray(parsed) || parsed.length === 0) {
        return createDefaultReviews();
      }

      return parsed;
    } catch {
      return createDefaultReviews();
    }
  });

  const [selectedRating, setSelectedRating] = useState("all");
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showModal, setShowModal] = useState(false);

  const [form, setForm] = useState({
    name: "",
    location: "",
    rating: "5",
    review: "",
  });

  useEffect(() => {
    localStorage.setItem(
      "customerReviewsVersion",
      REVIEW_VERSION
    );

    localStorage.setItem(
      "customerReviews",
      JSON.stringify(reviews)
    );
  }, [reviews]);

  const filteredReviews = useMemo(() => {
    let result = [...reviews];

    if (selectedRating !== "all") {
      result = result.filter(
        (item) =>
          Number(item.rating) === Number(selectedRating)
      );
    }

    result.sort((a, b) => {
      const ratingDifference =
        Number(b.rating) - Number(a.rating);

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
    Math.ceil(
      filteredReviews.length / REVIEWS_PER_SLIDE
    )
  );

  const safeCurrentSlide =
    ((currentSlide % totalSlides) + totalSlides) %
    totalSlides;

  const startIndex =
    safeCurrentSlide * REVIEWS_PER_SLIDE;

  const currentReviews = filteredReviews.slice(
    startIndex,
    startIndex + REVIEWS_PER_SLIDE
  );

  const goToNextSlide = () => {
    setCurrentSlide((previous) => {
      if (totalSlides <= 1) {
        return 0;
      }

      return (previous + 1) % totalSlides;
    });
  };

  const goToPreviousSlide = () => {
    setCurrentSlide((previous) => {
      if (totalSlides <= 1) {
        return 0;
      }

      return (
        (previous - 1 + totalSlides) %
        totalSlides
      );
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

  const handleInputChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!form.name.trim() || !form.review.trim()) {
      return;
    }

    const newReview = {
      id: `user-${Date.now()}`,
      name: form.name.trim(),
      location: form.location.trim(),
      rating: Number(form.rating),
      review: form.review.trim(),
      verified: false,
    };

    setReviews((previous) => [
      newReview,
      ...previous,
    ]);

    setForm({
      name: "",
      location: "",
      rating: "5",
      review: "",
    });

    setSelectedRating("all");
    setCurrentSlide(0);
    setShowModal(false);
  };

  return (
    <section
      className="customer-reviews"
      id="customer-reviews"
    >
      <div className="container">

        <div className="reviews-heading">
          <span className="reviews-label">
            CLIENT STORIES
          </span>

          <h2>
            What Our <span>Clients Say</span>
          </h2>

          <p>
            Real experiences from clients who trusted us
            with their spaces.
          </p>
        </div>

        <div className="review-filters">
          <button
            type="button"
            className={
              selectedRating === "all"
                ? "active"
                : ""
            }
            onClick={() => changeRating("all")}
          >
            ALL
          </button>

          {[5, 4, 3, 2, 1].map((rating) => (
            <button
              type="button"
              key={rating}
              className={
                selectedRating === String(rating)
                  ? "active"
                  : ""
              }
              onClick={() =>
                changeRating(String(rating))
              }
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
              <article
                className="review-card"
                key={item.id}
              >
                <span className="quote-mark">
                  “
                </span>

                <Stars
                  rating={Number(item.rating)}
                />

                <p className="review-text">
                  {item.review}
                </p>

                <div className="review-client">

                  <div className="client-avatar">
                    {item.name
                      .charAt(0)
                      .toUpperCase()}
                  </div>

                  <div className="client-info">
                    <strong>
                      {item.name}
                    </strong>

                    {item.location && (
                      <span className="client-location">
                        {item.location}
                      </span>
                    )}

                    {item.verified && (
                      <span className="verified">
                        ✓ Verified Client
                      </span>
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
          {Array.from({
            length: totalSlides,
          }).map((_, index) => (
            <button
              type="button"
              key={index}
              className={
                index === safeCurrentSlide
                  ? "active"
                  : ""
              }
              onClick={() => goToSlide(index)}
              aria-label={`Go to review slide ${
                index + 1
              }`}
            />
          ))}
        </div>

        <div className="write-review-wrapper">
          <button
            type="button"
            className="write-review-btn"
            onClick={() => setShowModal(true)}
          >
            Write a Review
          </button>
        </div>

      </div>

      {showModal && (
        <div
          className="review-modal-overlay"
          onClick={() => setShowModal(false)}
        >
          <div
            className="review-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <button
              type="button"
              className="review-close"
              onClick={() => setShowModal(false)}
              aria-label="Close review form"
            >
              ×
            </button>

            <h2>Write a Review</h2>

            <p className="modal-description">
              Share your experience with our design
              team.
            </p>

            <form onSubmit={handleSubmit}>

              <div className="form-group">
                <label
                  className="modal-label"
                  htmlFor="review-name"
                >
                  Your Name
                </label>

                <input
                  id="review-name"
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleInputChange}
                  placeholder="Enter your name"
                  required
                />
              </div>

              <div className="form-group">
                <label
                  className="modal-label"
                  htmlFor="review-location"
                >
                  Location
                </label>

                <input
                  id="review-location"
                  type="text"
                  name="location"
                  value={form.location}
                  onChange={handleInputChange}
                  placeholder="Enter your city"
                />
              </div>

              <div className="form-group">
                <label
                  className="modal-label"
                  htmlFor="review-rating"
                >
                  Rating
                </label>

                <select
                  id="review-rating"
                  name="rating"
                  value={form.rating}
                  onChange={handleInputChange}
                  className="rating-select"
                >
                  <option value="5">
                    ★★★★★ — Excellent
                  </option>

                  <option value="4">
                    ★★★★ — Very Good
                  </option>

                  <option value="3">
                    ★★★ — Good
                  </option>

                  <option value="2">
                    ★★ — Average
                  </option>

                  <option value="1">
                    ★ — Poor
                  </option>
                </select>
              </div>

              <div className="form-group">
                <label
                  className="modal-label"
                  htmlFor="review-message"
                >
                  Your Review
                </label>

                <textarea
                  id="review-message"
                  name="review"
                  value={form.review}
                  onChange={handleInputChange}
                  placeholder="Write your experience..."
                  rows="5"
                  required
                />
              </div>

              <button
                type="submit"
                className="submit-review-btn"
              >
                Submit Review
              </button>

            </form>
          </div>
        </div>
      )}
    </section>
  );
}