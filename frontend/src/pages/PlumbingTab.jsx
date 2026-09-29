import { useMemo, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import Icon from '../components/ui/Icon';
import PlumbingHero from '../components/plumbing/PlumbingHero';
// import PricingBanner from '../components/plumbing/PricingBanner';
import CategoryTabs from '../components/plumbing/CategoryTabs';
import ServiceRow from '../components/plumbing/ServiceRow';
import usePlumbingCatalogue from '../hooks/usePlumbingCatalogue';
import { useCart } from '../context/CartContext';

/** A sub-filter label like "Taps" or "Mixers" matches an item whose name or
    description contains that word (singular or plural) — a reasonable
    substring heuristic given the catalogue has no separate filter-tag column. */
function matchesFilter(item, filter) {
  if (filter === 'All Services' || filter === 'All Accessories') {
    return true;
  }

  const needle = filter.toLowerCase().replace(/s$/, '');
  const haystack = `${item.label} ${item.hint}`.toLowerCase();

  return haystack.includes(needle);
}

export default function PlumbingTab({
  modal = false,
  tabSlug: propTabSlug,
  onBackToCategories,
  onOpenConsultation,
  onViewCart,
}) {
  const params = useParams();
  const tabSlug = propTabSlug || params.tabSlug;

  const { getTab, loading, error } = usePlumbingCatalogue();

  const [activeFilter, setActiveFilter] = useState(null);
  const [query, setQuery] = useState('');

  const { items } = useCart();
  const hasCartItems = items?.length > 0;

  const tab = getTab(tabSlug);

  // Only offer a filter that has something behind it.
  const filters = useMemo(
    () =>
      tab
        ? tab.filterTabs.filter((f) =>
            tab.items.some((item) => matchesFilter(item, f))
          )
        : [],
    [tab]
  );

  const filter = activeFilter || filters[0];

  const visibleItems = useMemo(() => {
    if (!tab) return [];

    return tab.items
      .filter((item) => matchesFilter(item, filter))
      .filter((item) =>
        query.trim()
          ? `${item.label} ${item.hint}`
              .toLowerCase()
              .includes(query.trim().toLowerCase())
          : true
      );
  }, [tab, filter, query]);

  if (loading) {
    return (
      <div className="plb-section">
        <div className="container container-narrow">
          <p className="question-hint">Loading services…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="plb-section">
        <div className="container container-narrow">
          <div role="alert" className="alert alert-error">
            <Icon name="info" size={18} />
            <span>{error}</span>
          </div>
        </div>
      </div>
    );
  }

  if (!tab) {
    if (modal) return null;

    return <Navigate to="/services/plumbing" replace />;
  }

  return (
    <>
      {!modal && (
        <PlumbingHero
          eyebrow="PROFESSIONAL"
          title={tab.name}
          tagline={tab.heroTagline}
        />
      )}

      <section
        className={modal ? 'plb-section !py-0 !pb-4' : 'plb-section'}
      >
        <div
          className={
            modal
              ? 'container container-narrow !w-full !max-w-none !px-0'
              : 'container container-narrow'
          }
        >
          {modal && (
  <button
    type="button"
    className="plb-back-arrow"
    onClick={() => onBackToCategories?.()}
    aria-label="Go back"
  >
    <Icon name="arrow-left" size={22} />
  </button>
)}

          {/* Pricing banner removed */}

          <div className="plb-search">
            <Icon name="search" size={17} />

            <input
              type="search"
              placeholder={`Search ${tab.name.toLowerCase()}`}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label={`Search ${tab.name}`}
            />
          </div>

          {filters.length > 1 && (
            <CategoryTabs
              tabs={filters}
              active={filter}
              onChange={setActiveFilter}
            />
          )}

          <h2 className="plb-select-heading">Select a Service</h2>

          {visibleItems.length === 0 ? (
            <p className="question-hint">
              No services found. Try a different filter or search term.
            </p>
          ) : (
            <div className="plb-list">
              {visibleItems.map((item) => (
                <ServiceRow
                  key={item.value}
                  item={item}
                  group={tab.group}
                />
              ))}
            </div>
          )}

          {/* SMALL CONSULTATION NOTE (side, low emphasis) */}
          {/* VIEW CART BOX (main attention, sits right under the list) */}
{hasCartItems && (
  <div className="plb-view-cart-box">
    <div className="plb-view-cart-info">
      <span className="plb-view-cart-icon">
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
          <path d="M3 6h18" />
          <path d="M16 10a4 4 0 0 1-8 0" />
        </svg>
        <em className="plb-view-cart-badge">{items.length}</em>
      </span>

      <div>
        <strong>
          {items.length === 1 ? '1 item added' : `${items.length} items added`}
        </strong>
        <span>Tap to review & book</span>
      </div>
    </div>

    <button
      type="button"
      className="plb-view-cart-btn"
      onClick={() => onViewCart?.()}
    >
      View Cart
      <Icon name="arrow-right" size={16} />
    </button>
  </div>
)}

{/* HOME VISIT: small pill, far right, below the cart box */}
{modal ? (
  <button
    type="button"
    className="plb-visit-pill"
    onClick={() => onOpenConsultation?.()}
    title="Home visit ₹99 (for projects above ₹5,000)"
  >
    <Icon name="calendar" size={15} />
    <span>Book a home visit</span>
    <em>₹99</em>
  </button>
) : (
  <Link
    to="/services/plumbing/consultation"
    className="plb-visit-pill"
    title="Home visit ₹99 (for projects above ₹5,000)"
  >
    <Icon name="calendar" size={15} />
    <span>Book a home visit</span>
    <em>₹99</em>
  </Link>
)}
        
        </div>
      </section>
    </>
  );
}