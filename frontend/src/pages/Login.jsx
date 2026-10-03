import { useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Icon from '../components/ui/Icon';
import AuthPanel from '../components/auth/AuthPanel';
import { company } from '../data/siteConfig';
import { useAuth } from '../context/AuthContext';

/**
 * Account page — sign in and create account, on one screen.
 *
 * Both /login and /register render this component; the tab that opens is taken
 * from the URL, so each mode is still directly linkable and the back button
 * behaves. Switching tabs is a normal navigation between those two paths.
 * The form itself is AuthPanel, which the booking's last step (LoginGate)
 * shows too.
 *
 * NOTE: creating an account is public — anyone who completes the form can reach
 * /dashboard. To go back to invite-only, drop the /register route in App.jsx
 * and the "Sign Up" switch in AuthPanel; the sign-in half needs no other change.
 */
export default function Login() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const mode = location.pathname === '/register' ? 'register' : 'login';
  const goTo = (location.state && location.state.from) || '/dashboard';

  // already signed in? go straight through
  useEffect(() => {
    if (user) navigate(goTo, { replace: true });
  }, [user, goTo, navigate]);

  /**
   * Closing the panel returns the visitor wherever they came from. On a direct
   * hit (a bookmark, a pasted link) there is nothing to go back to, so the home
   * page is used instead — React Router marks that first entry with key
   * 'default'.
   */
  const handleClose = () => {
    if (location.key !== 'default') navigate(-1);
    else navigate('/');
  };

  // Escape closes it, the way any dialog is expected to behave
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  return (
    <div className="auth-screen">
      <div className="auth-glow" aria-hidden="true" />

<div className="auth-card-wrap !bg-black/55 backdrop-blur-sm border border-yellow-400/20 shadow-xl">
  {/* Compact, so the whole form fits on one screen without scrolling */}
  <div className="auth-card auth-compact">
          <button type="button" className="auth-close" onClick={handleClose} aria-label="Close">
            <Icon name="close" size={18} />
          </button>

          <Link to="/" className="auth-logo">
            <img src="/assets/brand/logo.webp" alt={`${company.name} logo`} />
          </Link>

          <AuthPanel
            compact
            mode={mode}
            onModeChange={(next) =>
              navigate(next === 'register' ? '/register' : '/login', { state: location.state })
            }
            onDone={() => navigate(goTo, { replace: true })}
          />
        </div>
      </div>
    </div>
  );
}
