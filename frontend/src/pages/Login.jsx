import { useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Icon from '../components/ui/Icon';
import AuthPanel from '../components/auth/AuthPanel';
import { company } from '../data/siteConfig';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const mode = location.pathname === '/register' ? 'register' : 'login';
  const fromParam = new URLSearchParams(location.search).get('from');
  const rememberedReturn = (() => {
    try {
      return JSON.parse(sessionStorage.getItem('sb.bookingReturn') || 'null');
    } catch {
      return null;
    }
  })();
  const goTo = location.state?.from || rememberedReturn?.path || fromParam || '/dashboard';
  const redirectedState = location.state?.fromState || rememberedReturn?.state || null;
  const redirectedStage = location.state?.returnStage ?? rememberedReturn?.stage ?? null;

  const finishSignIn = () => {
    sessionStorage.removeItem('sb.bookingReturn');
    navigate(goTo, {
      replace: true,
      state: redirectedState
        ? { ...redirectedState, returnStage: redirectedStage }
        : redirectedStage !== null
          ? { returnStage: redirectedStage }
          : undefined,
    });
  };

  useEffect(() => {
    if (user) finishSignIn();
  }, [user]);

  const handleClose = () => {
    if (location.key !== 'default') navigate(-1);
    else navigate('/');
  };

  useEffect(() => {
    const onKey = (event) => {
      if (event.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [location.key, navigate]);

  return (
    <div className="auth-screen">
      <div className="auth-glow" aria-hidden="true" />

      <div className="auth-card-wrap">
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
            onDone={finishSignIn}
          />
        </div>
      </div>
    </div>
  );
}
