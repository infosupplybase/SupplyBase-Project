import { NavLink } from 'react-router-dom';
import Icon from '../ui/Icon';
import { useAuth } from '../../context/AuthContext';

/**
 * Persistent mobile bottom navigation (hidden on desktop — see
 * bottom-nav.css). "Bookings" and "Profile" are separate pages
 * (MyBookings.jsx, Profile.jsx); ProtectedRoute sends a signed-out tap to
 * /login automatically, so both stay functional either way.
 */
export default function BottomNav() {
  const { user } = useAuth();

  const items = [
    { to: '/', label: 'Home', icon: 'home-check', end: true },
    { to: '/services', label: 'Services', icon: 'building', end: false },
    { to: user ? '/dashboard/bookings' : '/login', label: 'Bookings', icon: 'calendar', end: false },
    { to: '/contact', label: 'Help', icon: 'chat', end: false },
    { to: user ? '/dashboard/profile' : '/login', label: 'Profile', icon: 'user', end: false },
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
          </span>
          <span className="bottom-nav-label">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
