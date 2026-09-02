'use client';

import { Suspense } from 'react';
import Login from '../../pageComponents/Login';

/** useSearchParams() (read inside Login, for ?from=) needs a Suspense boundary for `next build` to prerender this route. */
export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <Login />
    </Suspense>
  );
}
