import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Icon from '../ui/Icon';
import AuthPanel from './AuthPanel';
import { useAuth } from '../../context/AuthContext';

/**
 * SIGN-IN GATES FOR BOOKING AND NAVIGATION
 *
 * Every booking needs an account (the API refuses POST /api/bookings without
 * one). Flows can either open sign-in over the booking:
 *
 *   if (!(await ensureLogin(details))) return;   // before api.createBooking
 *
 * or route to /login and return to the saved booking:
 *
 *   if (!(await ensureLoginPage())) return;
 *
 * Both methods resolve true immediately for signed-in customers. The overlay
 * method keeps the booking mounted while signing in; the page method records
 * the current route and booking state so its caller can resume after login.
 */
const LoginGateContext = createContext({
  ensureLogin: async () => true,
  ensureLoginPage: async () => true,
  openLogin: () => { },
});

export function LoginGateProvider({ children }) {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [request, setRequest] = useState(null); // { prefill } while open
  const [mode, setMode] = useState('register');
  const resolveRef = useRef(null);
  const userRef = useRef(user);
  userRef.current = user;

  const finish = useCallback((ok) => {
    resolveRef.current?.(ok);
    resolveRef.current = null;
    setRequest(null);
  }, []);

  const ensureLogin = useCallback((details) => {
    if (userRef.current) return Promise.resolve(true);
    return new Promise((resolve) => {
      resolveRef.current?.(false);
      resolveRef.current = resolve;
      // A returning customer usually signs in; a new one creates an account.
      // Start on sign-up with their details filled in — one tap to switch.
      setMode('register');
      setRequest({
        prefill: {
          name: details?.name || '',
          email: details?.email || '',
          phone: details?.phone || '',
        },
      });
    });
  }, []);

  const ensureLoginPage = useCallback(() => {
    if (userRef.current) return Promise.resolve(true);
    const bookingState =
      location.state && typeof location.state === 'object' ? location.state : {};
    navigate('/login', {
      state: {
        from: {
          pathname: location.pathname,
          search: location.search,
          hash: location.hash,
          state: { ...bookingState, __resumeBookingSubmit: true },
        },
      },
    });
    return Promise.resolve(false);
  }, [location, navigate]);

  const openLogin = useCallback(() => {
    setMode('login');
    setRequest({
      prefill: {
        name: '',
        email: '',
        phone: '',
      },
      source: 'navbar',
    });
  }, []);

  // Escape closes the card (the booking stays as it was).
  useEffect(() => {
    if (!request) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        finish(false);
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [request, finish]);

  return (
    <LoginGateContext.Provider value={{ ensureLogin, ensureLoginPage, openLogin }}>
      {children}
      {request && (
        <div
          className="auth-screen auth-overlay"
          role="dialog"
          aria-modal="true"
          aria-label={
            request.source === 'navbar'
              ? 'Login or create an account'
              : 'Sign in to confirm your booking'
          }
          onClick={(e) => {
            if (e.target === e.currentTarget) finish(false);
          }}
        >
          <div className="auth-card-wrap">
            {/* Compact, so the whole form fits on one screen without scrolling */}
            <div className="auth-card auth-compact">
              <button type="button" className="auth-close" onClick={() => finish(false)} aria-label="Close">
                <Icon name="close" size={18} />
              </button>

              {request.source !== 'navbar' && (
                <p className="auth-kept-note">
                  <Icon name="check-circle" size={16} />
                  <span>Your booking details are saved — sign in to confirm.</span>
                </p>
              )}

              <AuthPanel
                compact
                mode={mode}
                onModeChange={setMode}
                prefill={request.prefill}
                heading={
                  request.source === 'navbar' ? (
                    mode === 'register' ? (
                      <>
                        Create an <span className="auth-accent">Account</span>
                      </>
                    ) : (
                      <>
                        Welcome <span className="auth-accent">Back</span>
                      </>
                    )
                  ) : mode === 'register' ? (
                    <>
                      Create an <span className="auth-accent">Account</span> to Book
                    </>
                  ) : (
                    <>
                      Sign In to <span className="auth-accent">Book</span>
                    </>
                  )
                }
                onDone={() => finish(true)}
              />
            </div>
          </div>
        </div>
      )}
    </LoginGateContext.Provider>
  );
}

/** `await ensureLogin(details)` → true once signed in, false if closed. */
export function useEnsureLogin() {
  return useContext(LoginGateContext).ensureLogin;
}

export function useLoginGate() {
  return useContext(LoginGateContext);
}
