'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

/**
 * Next.js has no built-in equivalent of react-router's <NavLink> — this is
 * the same idea, driven by usePathname() instead of a route match.
 * `exact` mirrors react-router's `end` prop: without it, "/enquiries" would
 * also read as active on "/" (every path starts with "/").
 */
export default function NavLink({ href, exact = false, className = '', children }) {
  const pathname = usePathname();
  const isActive = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link href={href} className={`${className} ${isActive ? 'active' : ''}`.trim()}>
      {children}
    </Link>
  );
}
