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
const isRegister = mode === 'register';

const [form, setForm] = useState(emptyForm);
const [showPassword, setShowPassword] = useState(false);
const [showConfirm, setShowConfirm] = useState(false);
const [accepted, setAccepted] = useState(false);
const [rememberMe, setRememberMe] = useState(true);
const [errors, setErrors] = useState({});
const [error, setError] = useState('');
const [notice, setNotice] = useState('');
const [busy, setBusy] = useState(false);
const fromParam = new URLSearchParams(location.search).get('from');
const rememberedReturn = (() => {
  try {
    return JSON.parse(sessionStorage.getItem('sb.bookingReturn') || 'null');
  } catch {
    return null;
  }
})();
const redirectedFrom =
  (location.state && location.state.from) ||
  rememberedReturn?.path ||
  fromParam ||
  '/dashboard';

const redirectedState =
  (location.state && location.state.fromState) ||
  rememberedReturn?.state ||
  null;

const redirectedStage =
  (location.state && location.state.returnStage) ??
  rememberedReturn?.stage ??
  null;

const pathnameWithoutHash = redirectedFrom.split('#')[0];
const goTo = redirectedFrom;

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

  // messages from one tab must not linger on the other
  useEffect(() => {
    setErrors({});
    setError('');
    setNotice('');
  }, [mode]);

  const update = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    setErrors((err) => ({ ...err, [field]: undefined }));
    setError('');
    setNotice('');
  };

  /** Field-level checks for the create-account tab. */
  const validate = () => {
    const next = {};

    if (!form.name.trim()) next.name = 'Please enter your name';

    if (!form.email.trim()) {
      next.email = 'Please enter your email address';
    } else if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())
    ) {
      next.email = 'Please enter a valid email address';
    }

    if (!form.phone.trim()) {
      next.phone = 'Please enter your phone number';
    } else if (!isValidPhone(form.phone)) {
      next.phone = 'Enter a 10-digit mobile number';
    }

    if (!form.password) {
      next.password = 'Please choose a password';
    } else if (form.password.length < 8) {
      next.password = 'Use at least eight characters';
    }

    if (form.confirm !== form.password) {
      next.confirm = 'Both passwords must match';
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setNotice('');

    if (isRegister) {
      if (!validate()) {
        const firstError = document.querySelector('.field.error input');
        if (firstError) firstError.focus();
        return;
      }

      if (!accepted) {
        setError('Please accept the terms and privacy policy to continue.');
        return;
      }
    } else if (!form.identifier.trim() || !form.password) {
      setError(
        'Please enter your email or phone number, and your password.'
      );
      return;
    }

    setBusy(true);

    try {
      if (isRegister) {
        await register(
          form.name,
          form.email,
          form.password,
          form.phone
        );
      } else {
        await login(form.identifier, form.password);
      }

      sessionStorage.removeItem('sb.bookingReturn');

      navigate(goTo, {
        replace: true,
        state: redirectedState
          ? { ...redirectedState, returnStage: redirectedStage }
          : redirectedStage !== null
            ? { returnStage: redirectedStage }
            : undefined,
      });
    } catch (err) {
      if (err && err.fieldErrors) {
        setErrors(err.fieldErrors);
      }

      setError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  };

  /** Google hands back an ID token; the backend decides whether to trust it. */
  const handleGoogle = async (credential) => {
    setError('');
    setNotice('');
    setBusy(true);

    try {
      await loginWithGoogle(credential);

      sessionStorage.removeItem('sb.bookingReturn');

      navigate(goTo, {
        replace: true,
        state: redirectedState
          ? { ...redirectedState, returnStage: redirectedStage }
          : redirectedStage !== null
            ? { returnStage: redirectedStage }
            : undefined,
      });
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  };


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
onDone={finishSignIn}
          />
        </div>
      </div>
    </div>
  );
}
