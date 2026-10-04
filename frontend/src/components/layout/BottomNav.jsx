import { NavLink } from 'react-router-dom';
import Icon from '../ui/Icon';
import { useCartCount } from '../../context/CartContext';

/**
 * Persistent mobile bottom navigation (hidden on desktop — see
 * bottom-nav.css). "Bookings" and "Profile" are separate pages
 * (MyBookings.jsx, Profile.jsx); ProtectedRoute sends a signed-out tap to
 * /login automatically, so both stay functional either way.
 */
export default function BottomNav() {
  const cartCount = useCartCount();

  const items = [
    { to: '/', label: 'Home', icon: 'home-check', end: true },
    { to: '/services', label: 'Services', icon: 'building', end: false },
    { to: '/cart', label: 'Cart', icon: 'shopping-bag', end: false },
    // Signed out, these still point at their own pages: ProtectedRoute asks
    // for a sign-in and then returns to the page that was tapped. (Pointing
    // both at /login lit both up at once on the sign-in page.)
    { to: '/dashboard/bookings', label: 'Bookings', icon: 'calendar', end: false },
    { to: '/dashboard/profile', label: 'Profile', icon: 'user', end: false },
  ];

  return (
    <nav className="bottom-nav" aria-label="Primary">
      {items.map((item) => (
        <NavLink
          key={item.label}
          to={item.to}
          end={item.end}
          className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}
        >
          <span className="bottom-nav-icon" aria-hidden="true">
            <Icon name={item.icon} size={21} />
            {item.to === '/cart' && cartCount > 0 && (
              <span className="cart-count-badge">{cartCount > 9 ? '9+' : cartCount}</span>
            )}
          </span>
          <span className="bottom-nav-label">
            {item.label}
            {item.to === '/cart' && cartCount > 0 && <span className="sr-only">, {cartCount} items</span>}
          </span>
        </NavLink>
      ))}
    </nav>
  );
}
