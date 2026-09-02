'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

/**
 * Next.js has no built-in equivalent of react-router's <NavLink> — this is
 * the same idea, driven by usePathname() instead of a route match.
 * `end` mirrors react-router's own `end` prop: without it, "/services" would
 * also read as active on "/" (every path starts with "/").
 */
export default function NavLink({ href, end = false, className, activeClassName = 'active', children, ...rest }) {
  const pathname = usePathname();
  const isActive = end ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

  // A function className (react-router's render-prop style) is trusted to
  // decide the whole string itself, active state included — appending
  // activeClassName on top of that would duplicate it. A plain string gets
  // activeClassName appended automatically, same as react-router's default.
  const resolvedClassName =
    typeof className === 'function'
      ? className({ isActive })
      : `${className || ''} ${isActive ? activeClassName : ''}`.trim();

  return (
    <Link href={href} className={resolvedClassName} {...rest}>
      {children}
    </Link>
  );
}
