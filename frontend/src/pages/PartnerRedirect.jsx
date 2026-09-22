import { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { partnersUrl } from '../data/siteConfig';

/**
 * The partner (professional) portal is its own app in partners/, on its own
 * address. This keeps any old /partner/... link working by forwarding it there:
 *
 *   /partner          -> <partners app>/
 *   /partner/login    -> <partners app>/login
 *   /partner/join     -> <partners app>/join
 *
 * If the partners app's address has not been configured (VITE_PARTNERS_URL),
 * there is nowhere to forward to, so it goes to the home page rather than a
 * dead end.
 */
export default function PartnerRedirect() {
  const { pathname } = useLocation();
  const rest = pathname.replace(/^\/partner/, '') || '/';

  useEffect(() => {
    if (partnersUrl) window.location.replace(`${partnersUrl}${rest}`);
  }, [rest]);

  if (!partnersUrl) return <Navigate to="/" replace />;
  return null;
}
