import { NavLink } from 'react-router-dom';
import Icon from '../ui/Icon';
import { useAuth } from '../../context/AuthContext';

/**
 * Persistent mobile bottom navigation (hidden on desktop — see
 * bottom-nav.css). "Bookings" and "Profile" both point at the account page,
 * which is the one place bookings actually live; ProtectedRoute sends a
 * signed-out tap to /login automatically, so both stay functional either way.
 */
export default function BottomNav() {
  const { user } = useAuth();
  const accountPath = user ? '/dashboard' : '/login';

  const items = [
    { to: '/', label: 'Home', icon: 'home-check', end: true },
    { to: '/services', label: 'Services', icon: 'building', end: false },
    { to: accountPath, label: 'Bookings', icon: 'calendar', end: false },
    { to: '/contact', label: 'Help', icon: 'chat', end: false },
    { to: accountPath, label: 'Profile', icon: 'user', end: false },
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
          <Icon name={item.icon} size={21} />
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
