'use client';

import Link from 'next/link';
import Icon from '../components/ui/Icon';

export default function NotFound() {
  return (
    <div className="notfound">
      <div className="notfound-code">404</div>
      <h1 style={{ fontSize: 'clamp(1.6rem,4vw,2.4rem)' }}>Page Not Found</h1>
      <p style={{ color: 'var(--grey-600)', maxWidth: '46ch' }}>
        The page you are looking for has moved or does not exist. Let&rsquo;s get you back on track.
      </p>
      <div className="btn-row" style={{ justifyContent: 'center', marginTop: 12 }}>
        <Link href="/" className="btn btn-dark">
          BACK TO HOME
          <Icon name="arrow-right" size={17} />
        </Link>
        <Link href="/services" className="btn btn-ghost">
          VIEW SERVICES
          <Icon name="arrow-right" size={17} />
        </Link>
      </div>
    </div>
  );
}
