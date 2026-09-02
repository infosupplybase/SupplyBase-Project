'use client';

import { useState } from 'react';
import Icon from './Icon';

/**
 * Faq — accordion list. items: [{ q, a }]
 */
export default function Faq({ items = [] }) {
  const [open, setOpen] = useState(0);

  return (
    <div>
      {items.map((item, i) => (
        <div className={`faq-item ${open === i ? 'open' : ''}`} key={item.q}>
          <button
            type="button"
            className="faq-q"
            onClick={() => setOpen(open === i ? -1 : i)}
            aria-expanded={open === i}
          >
            {item.q}
            <Icon name="plus" size={20} />
          </button>
          <div className="faq-a">
            <p>{item.a}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
