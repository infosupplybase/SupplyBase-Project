import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import Icon from '../ui/Icon';
import AuthPanel from './AuthPanel';
import { useAuth } from '../../context/AuthContext';

/**
 * SIGN IN AT THE BOOKING'S LAST STEP
 *
 * Every booking needs an account (the API refuses POST /api/bookings without
 * one). Rather than sending a guest away to /login and back, the booking
 * asks here, on top of itself:
 *
 *   if (!(await ensureLogin(details))) return;   // before api.createBooking
 *
 * Signed in already: resolves true straight away. Otherwise the sign-in /
 * create-account card opens over the booking — which stays mounted
 * underneath, so nothing the customer typed is lost — with the create-account
 * form started from their booking details (name, email, phone). It resolves
 * true once they are signed in (the booking then goes through), or false if
 * they close it (nothing is booked; they can press Confirm again).
 */
const LoginGateContext = createContext(async () => true);

export function LoginGateProvider({ children }) {
  const { user } = useAuth();
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
    <LoginGateContext.Provider value={ensureLogin}>
      {children}
      {request && (
        <div
          className="auth-screen auth-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Sign in to confirm your booking"
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

              <p className="auth-kept-note">
                <Icon name="check-circle" size={16} />
                <span>Your booking details are saved — sign in to confirm.</span>
              </p>

              <AuthPanel
                compact
                mode={mode}
                onModeChange={setMode}
                prefill={request.prefill}
                heading={
                  mode === 'register' ? (
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
  return useContext(LoginGateContext);
}
