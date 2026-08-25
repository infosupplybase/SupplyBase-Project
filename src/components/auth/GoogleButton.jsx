import { useEffect, useRef, useState } from 'react';

/**
 * "Continue with Google", rendered by Google Identity Services.
 *
 * The button is drawn by Google's own script rather than styled by us. That is
 * deliberate: Google's branding terms govern how the button may look, and a
 * hand-rolled one drifts out of compliance the moment they change it. It also
 * means the click happens inside Google's iframe, so this page never sees the
 * account chooser or anything typed into it.
 *
 * What comes back is an ID token — a signed assertion of who the user is. It
 * is worthless on its own: the backend verifies the signature, the issuer and
 * the audience before it will trust a single claim inside it.
 */
const SCRIPT_SRC = 'https://accounts.google.com/gsi/client';
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

/** Load the GSI script once, however many buttons ask for it. */
let scriptPromise = null;
function loadGoogleScript() {
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    if (window.google && window.google.accounts) {
      resolve();
      return;
    }
    const existing = document.querySelector(`script[src="${SCRIPT_SRC}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('script failed')));
      return;
    }
    const script = document.createElement('script');
    script.src = SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('script failed'));
    document.head.appendChild(script);
  });
  return scriptPromise;
}

export default function GoogleButton({ onCredential, onError, text = 'continue_with' }) {
  const holder = useRef(null);
  const [failed, setFailed] = useState(false);

  // The callback is held in a ref because Google's initialize() captures it
  // once. Passing the prop directly would freeze whatever closure existed on
  // first render, and later state would be invisible to it.
  const callbackRef = useRef(onCredential);
  callbackRef.current = onCredential;

  useEffect(() => {
    if (!CLIENT_ID) return undefined;

    let cancelled = false;
    loadGoogleScript()
      .then(() => {
        if (cancelled || !holder.current) return;
        window.google.accounts.id.initialize({
          client_id: CLIENT_ID,
          callback: (response) => {
            if (response && response.credential) callbackRef.current(response.credential);
            else if (onError) onError(new Error('Google did not return a credential.'));
          },
        });
        window.google.accounts.id.renderButton(holder.current, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text,
          shape: 'rectangular',
          logo_alignment: 'center',
          width: holder.current.offsetWidth || 320,
        });
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
    };
  }, [text, onError]);

  // No client id configured: render nothing at all rather than a button that
  // cannot work. The email and password form is still there.
  if (!CLIENT_ID) return null;

  if (failed) {
    return (
      <p className="google-btn-note">
        Google sign-in could not load. Please use your email and password.
      </p>
    );
  }

  return <div className="google-btn" ref={holder} />;
}
