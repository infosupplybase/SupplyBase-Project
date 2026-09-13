import { useMemo, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import Icon from '../components/ui/Icon';
import PlumbingHero from '../components/plumbing/PlumbingHero';
import PricingBanner from '../components/plumbing/PricingBanner';
import CategoryTabs from '../components/plumbing/CategoryTabs';
import ServiceRow from '../components/plumbing/ServiceRow';
import StickyCartBar from '../components/plumbing/StickyCartBar';
import usePlumbingCatalogue from '../hooks/usePlumbingCatalogue';

/** A sub-filter label like "Taps" or "Mixers" matches an item whose name or
    description contains that word (singular or plural) — a reasonable
    substring heuristic given the catalogue has no separate filter-tag column. */
function matchesFilter(item, filter) {
  if (filter === 'All Services' || filter === 'All Accessories') return true;
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

  const tab = getTab(tabSlug);
  const filter = activeFilter || tab?.filterTabs[0];

  const visibleItems = useMemo(() => {
    if (!tab) return [];
    return tab.items
      .filter((item) => matchesFilter(item, filter))
      .filter((item) =>
        query.trim()
          ? `${item.label} ${item.hint}`.toLowerCase().includes(query.trim().toLowerCase())
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
  className={
    modal
      ? 'plb-section !py-0 !pb-4'
      : 'plb-section'
  }
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
    className="btn btn-ghost btn-back !mb-4"
    onClick={() => onBackToCategories?.()}
  >
    BACK
  </button>
)}
          <PricingBanner compact />

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

          <CategoryTabs tabs={tab.filterTabs} active={filter} onChange={setActiveFilter} />

          <h2 className="plb-select-heading">Select a Service</h2>

          {visibleItems.length === 0 ? (
            <p className="question-hint">No services found. Try a different filter or search term.</p>
          ) : (
            <div className="plb-list">
              {visibleItems.map((item) => (
                <ServiceRow key={item.value} item={item} group={tab.group} />
              ))}
            </div>
          )}

          <div
  className="
    plb-visit-banner
    
    md:!mb-6

    max-sm:!flex-col
    max-sm:!items-stretch
    max-sm:!gap-3
  "
>
            <Icon name="calendar" size={22} />
            <div className="max-sm:!w-full max-sm:!min-w-0">
              <strong>Need installation for multiple items?</strong>
              <p>Book a home visit for ₹99 (for projects above ₹5,000). Our expert will assess your requirement and provide a quotation.</p>
            </div>
            {modal ? (
  <button
    type="button"
    className="btn btn-primary btn-sm max-sm:!w-full max-sm:!justify-center"
    onClick={() => onOpenConsultation?.()}
  >
    Book a Visit
    <Icon name="arrow-right" size={15} />
  </button>
) : (
  <Link
    to="/services/plumbing/consultation"
    className="btn btn-primary btn-sm"
  >
    Book a Visit
    <Icon name="arrow-right" size={15} />
  </Link>
)}
          </div>
        </div>
      </section>

      <StickyCartBar
  modal={modal}
  onViewCart={() => onViewCart?.()}
/>
    </>
  );
}
