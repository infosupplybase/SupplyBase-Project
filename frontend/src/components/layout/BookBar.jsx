import { Link, useLocation } from 'react-router-dom';
import Icon from '../ui/Icon';

/**
 * The sticky "Book Now" bar on mobile (spec §27).
 *
 * Most customers are on a phone, and the booking action should not be
 * something they have to scroll back up to find.
 *
 * Hidden on the pages where it would be noise or a trap: the booking flow
 * itself already has its own buttons, and the account screens are not a place
 * to be nudged into a purchase.
 */
const HIDE_ON = ['/login', '/register', '/dashboard'];

export default function BookBar() {
  const { pathname } = useLocation();

  const onBookingPage = pathname.startsWith('/services/');
  const hidden = HIDE_ON.some((p) => pathname.startsWith(p));

  if (onBookingPage || hidden) return null;

  return (
    <div className="book-bar">
      <span className="book-bar-text">
        <strong>Site visit + quotation</strong>
        <span>No advance for the work</span>
      </span>
      <Link to="/services" className="btn btn-primary btn-sm">
        <Icon name="calendar" size={15} />
        BOOK NOW
      </Link>
    </div>
  );
}
