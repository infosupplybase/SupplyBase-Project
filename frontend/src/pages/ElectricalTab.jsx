import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Icon from '../components/ui/Icon';
import PageHero from '../components/ui/PageHero';
import ServiceRow from '../components/plumbing/ServiceRow';
import ViewCartBox from '../components/plumbing/ViewCartBox';
import { getElectricalGroup } from '../data/electricalContent';

/*
 * Images used for the six main electrician categories.
 * These images are loaded from frontend/public/assets.
 */
const electricalServiceImages = {
  'Fan Services':
    '/assets/services/electrician/fan-services.webp',

  'Light Services':
    '/assets/services/electrician/light-services.webp',

  'Switch & Socket Services':
    '/assets/services/electrician/switch-socket-services.webp',

  'Wiring & Electrical Repair':
    '/assets/services/electrician/wiring-electrical-repair.webp',

  'MCB, DB & Inverter':
    '/assets/services/electrician/mcb-db-inverter.webp',

  'Appliance Installation':
    '/assets/services/electrician/appliance-installation.webp',
};

export default function ElectricalTab({
  modal = false,
  tabSlug,
  onBackToCategories,
  onViewCart,
}) {
  const navigate = useNavigate();

  const group = useMemo(
    () => getElectricalGroup(tabSlug),
    [tabSlug]
  );

  const [query, setQuery] = useState('');

  const viewCart =
    onViewCart ||
    (() => navigate('/services/electrical/cart'));

  const items = useMemo(() => {
    if (!group) return [];

    const q = query.trim().toLowerCase();

    if (!q) {
      return group.items;
    }

    return group.items.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        (item.hint || '').toLowerCase().includes(q)
    );
  }, [group, query]);

  const back = modal ? (
    <button
      type="button"
      className="elc-tab-back"
      onClick={onBackToCategories}
      aria-label="Back"
    >
      <Icon name="arrow-left" size={18} />
    </button>
  ) : (
    <Link
      to="/services/electrical"
      className="plb-back-link"
    >
      <Icon name="arrow-left" size={18} />
      All electrical services
    </Link>
  );

  if (!group) {
    return (
      <section className="plb-section !py-0 !pb-4">
        <div className="container !w-full !max-w-none !px-0">
          {back}

          <p className="question-hint">
            Service not found.
          </p>
        </div>
      </section>
    );
  }

  return (
    <>
      {!modal && (
        <PageHero
          eyebrow="ELECTRICIAN"
          title={group.name}
          text="Pick the services you need — add them to your cart and book one visit."
          image="/assets/services/electrician/hero.webp"
          breadcrumbs={[
            {
              label: 'Services',
              to: '/services',
            },
            {
              label: 'Electrical',
              to: '/services/electrical',
            },
            {
              label: group.name,
            },
          ]}
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
              ? 'container !w-full !max-w-none !px-0'
              : 'container container-narrow'
          }
        >
          {back}

          <div className="plb-search elc-tab-search">
            <Icon name="search" size={18} />

            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Search ${group.name.toLowerCase()}`}
              aria-label={`Search ${group.name}`}
            />
          </div>

          <h4 className="plb-select-heading">
            SELECT A SERVICE
          </h4>

          {items.length === 0 ? (
            <p className="question-hint">
              No matching services.
            </p>
          ) : (
            <div className="plb-list elc-service-list">
              {items.map((item) => (
                <ServiceRow
                  key={item.value}
                  item={item}
                  group={group.name}
                  image={
                    electricalServiceImages[item.label] || ''
                  }
                />
              ))}
            </div>
          )}

          <ViewCartBox
            cart="electrical"
            onViewCart={viewCart}
          />
        </div>
      </section>
    </>
  );
}