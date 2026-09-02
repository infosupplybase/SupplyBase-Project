'use client';

import { useEffect, useState } from 'react';
import Icon from '../ui/Icon';
import { telHref, whatsappHref } from '../../lib/contact';

/**
 * FloatingActions — always-available WhatsApp and call buttons,
 * plus a back-to-top button that appears once the user scrolls.
 */
export default function FloatingActions() {
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 600);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="floating-actions">
      {showTop && (
        <button
          type="button"
          className="fab fab-top"
          aria-label="Back to top"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          <Icon name="arrow-up" size={20} />
        </button>
      )}
      <a href={telHref} className="fab fab-call" aria-label="Call Supplybase Projects">
        <Icon name="phone" size={20} />
      </a>
      <a
        href={whatsappHref()}
        target="_blank"
        rel="noopener noreferrer"
        className="fab fab-whatsapp"
        aria-label="Chat on WhatsApp"
      >
        <Icon name="whatsapp" size={22} />
      </a>
    </div>
  );
}
