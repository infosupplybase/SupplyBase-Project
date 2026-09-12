export default function ReviewsSection() {
  const reviews = [
    {
      stars: 5,
      text: 'The team finished our 3BHK interiors in 52 days. Quality work, no hidden costs, clean site every evening.',
      name: 'Amit Kadam',
      initials: 'AK',
      location: 'Andheri West',
      service: 'Full Home Interior',
    },
    {
      stars: 5,
      text: 'Waterproofing job done neatly. No leaks even after heavy monsoon. Highly recommend SupplyBase.',
      name: 'Sneha Patel',
      initials: 'SP',
      location: 'Bandra',
      service: 'Terrace Waterproofing',
    },
    {
      stars: 5,
      text: 'Electrical work was spot-on. Proper wiring plan, no shortcuts, and they explained everything clearly.',
      name: 'Rahul Sharma',
      initials: 'RS',
      location: 'Powai',
      service: 'Complete Wiring',
    },
    {
      stars: 5,
      text: 'Painting finished on time. Clean site, courteous workers, and the finish looks premium.',
      name: 'Meera Joshi',
      initials: 'MJ',
      location: 'Juhu',
      service: 'Full Home Painting',
    },
  ];

  return (
    <section className="uc-reviews-section">
      <div className="uc-container">
        <div className="uc-reviews-header">
          <span className="uc-eyebrow">CLIENT REVIEWS</span>
          <h2 className="uc-reviews-title">What our clients say</h2>
          <p className="uc-reviews-desc">
            Real reviews from real SupplyBase customers
          </p>
        </div>

        <div className="uc-reviews-row">
          {reviews.map((review) => (
            <div key={review.name} className="uc-review-card">
              <div className="uc-review-stars">
                {'★'.repeat(review.stars)}
              </div>

              <p className="uc-review-text">"{review.text}"</p>

              <div className="uc-review-client">
                <div className="uc-review-avatar">{review.initials}</div>
                <div>
                  <strong>{review.name}</strong>
                  <span>
                    {review.location} · {review.service}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}