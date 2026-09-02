'use client';

import { useState } from 'react';
import Link from 'next/link';
import NavLink from './NavLink';
import Icon from '../ui/Icon';
import { mainNav, company, contact } from '../../data/siteConfig';
import { services } from '../../data/services';
import { telHref, mailtoHref } from '../../lib/contact';
import { useAuth } from '../../context/AuthContext';

/**
 * MobileMenu — slide-in navigation drawer for tablet and phone.
 */
export default function MobileMenu({ open, onClose }) {
  const [servicesOpen, setServicesOpen] = useState(false);
  const { user } = useAuth();

  return (
    <div className={`mobile-menu ${open ? 'open' : ''}`}>
      <div className="mobile-backdrop" onClick={onClose} />
      <div className="mobile-panel" role="dialog" aria-modal="true" aria-label="Menu">
        <div className="mobile-head">
          <Link href="/" onClick={onClose}>
            <img src="/assets/brand/logo.png" alt={company.name} />
          </Link>
          <button type="button" className="mobile-close" onClick={onClose} aria-label="Close menu">
            <Icon name="close" size={20} />
          </button>
        </div>

        <nav className="mobile-nav">
          {mainNav.map((item) =>
            item.hasMegaMenu ? (
              <div key={item.path}>
                <button
                  type="button"
                  className="mobile-link"
                  onClick={() => setServicesOpen((v) => !v)}
                  aria-expanded={servicesOpen}
                >
                  {item.label}
                  <Icon
                    name="chevron-down"
                    size={18}
                    style={{ transform: servicesOpen ? 'rotate(180deg)' : 'none', transition: 'transform .25s' }}
                  />
                </button>
                <div className={`mobile-sub ${servicesOpen ? 'open' : ''}`}>
                  <NavLink href="/services" onClick={onClose}>
                    All Services
                  </NavLink>
                  {services.map((service) => (
                    <NavLink key={service.slug} href={`/services/${service.slug}`} onClick={onClose}>
                      {service.name}
                    </NavLink>
                  ))}
                </div>
              </div>
            ) : (
              <NavLink key={item.path} href={item.path} end={item.path === '/'} className="mobile-link" onClick={onClose}>
                {item.label}
              </NavLink>
            )
          )}
          <NavLink href={user ? '/dashboard' : '/login'} className="mobile-link" onClick={onClose}>
            {user ? 'MY ACCOUNT' : 'LOGIN'}
          </NavLink>
        </nav>

        <div className="mobile-foot">
          <a href={telHref} className="contact-line">
            <Icon name="phone" size={17} />
            {contact.phoneDisplay}
          </a>
          <a href={mailtoHref} className="contact-line">
            <Icon name="mail" size={17} />
            {contact.email}
          </a>
          <Link href="/quote" className="btn btn-primary btn-block" onClick={onClose}>
            GET A QUOTE
            <Icon name="arrow-right" size={17} />
          </Link>
        </div>
      </div>
    </div>
  );
}
