'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';

/**
 * Wraps any page that should only be visible after signing in.
 * Not signed in -> sent to the login page.
 */
export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      router.replace(`/login?from=${encodeURIComponent(pathname)}`);
    }
  }, [loading, user, pathname, router]);

  if (loading || !user) {
    return (
      <div className="notfound">
        <p style={{ color: 'var(--grey-500)' }}>Checking your sign-in…</p>
      </div>
    );
  }

  return children;
}
