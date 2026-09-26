import { NavLink } from 'react-router-dom';
import Icon from '../ui/Icon';

/**
 * Switches between the two account pages. Mirrors the bottom nav's own
 * Bookings/Profile split so desktop visitors (no bottom nav there) have the
 * same way to move between them.
 */
export default function AccountTabs() {
  return (
    <div className="acct-tabs" role="tablist">
      <NavLink
        to="/dashboard/bookings"
        className={({ isActive }) => `acct-tab ${isActive ? 'active' : ''}`}
      >
        <Icon name="calendar" size={17} />
        My Bookings
      </NavLink>
      <NavLink
        to="/dashboard/profile"
        className={({ isActive }) => `acct-tab ${isActive ? 'active' : ''}`}
      >
        <Icon name="user" size={17} />
        My Profile
      </NavLink>
    </div>
  );
}
