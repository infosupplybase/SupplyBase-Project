/**
 * Reviews shown in the home page "Client Stories" section, copied word for
 * word from our Google Business page. Reviews with photos are shown first.
 *
 * Only real reviews from real customers belong here, each with the customer's
 * permission to show their name. While this list is empty the section
 * shows an invitation to book instead. Shape:
 *   { id: 'r1', name: 'Customer name', location: 'City', rating: 5,
 *     review: 'What they said', verified: true,
 *     photos: ['/assets/reviews/r1-1.webp'] }
 * `verified: true` only for a customer with a completed booking.
 * `photos` is optional: the customer's own photos from their Google review,
 * saved under public/assets/reviews/ (give each new photo a new file name).
 */
const customerReviews = [];

export default customerReviews;
