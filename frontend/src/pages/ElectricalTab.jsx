import { useMemo, useState } from 'react';
import Icon from '../components/ui/Icon';
import ServiceRow from '../components/plumbing/ServiceRow';
import StickyCartBar from '../components/plumbing/StickyCartBar';
import { getElectricalGroup } from '../data/electricalContent';

/**
 * The "Select a Service" screen for one electrician category.
 * Mirrors PlumbingTab — same ServiceRow, same StickyCartBar, same cart.
 */
export default function ElectricalTab({
  modal = false,
  tabSlug,
  onBackToCategories,
  onViewCart,
}) {
  const group = useMemo(() => getElectricalGroup(tabSlug), [tabSlug]);
  const [query, setQuery] = useState('');

  const items = useMemo(() => {
    if (!group) return [];
    const q = query.trim().toLowerCase();
    if (!q) return group.items;
    return group.items.filter(
      (i) =>
        i.label.toLowerCase().includes(q) ||
        (i.hint || '').toLowerCase().includes(q)
    );
  }, [group, query]);

  if (!group) {
    return (
      <section className="plb-section !py-0 !pb-4">
        <div className="container !w-full !max-w-none !px-0">
          <button
            type="button"
            className="elc-tab-back"
            onClick={onBackToCategories}
            aria-label="Back"
          >
            <Icon name="arrow-left" size={18} />
          </button>
          <p className="question-hint">Service not found.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="plb-section !py-0 !pb-4">
      <div className="container !w-full !max-w-none !px-0">
        {/* BACK — small arrow, top-left */}
        <button
          type="button"
          className="elc-tab-back"
          onClick={onBackToCategories}
          aria-label="Back"
        >
          <Icon name="arrow-left" size={18} />
        </button>

        {/* SEARCH — moved up, no banner above it */}
        <div className="plb-search elc-tab-search">
          <Icon name="search" size={18} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search ${group.name.toLowerCase()}`}
          />
        </div>

        {/* SELECT A SERVICE heading */}
        <h4 className="plb-select-heading">SELECT A SERVICE</h4>

        {/* SERVICE ROWS */}
        {items.length === 0 ? (
          <p className="question-hint">No matching services.</p>
        ) : (
          <div className="plb-list">
            {items.map((item) => (
              <ServiceRow key={item.value} item={item} group={group.name} />
            ))}
          </div>
        )}

        {/* STICKY CART BAR */}
        <StickyCartBar modal={true} onViewCart={onViewCart} />
      </div>
    </section>
  );
}