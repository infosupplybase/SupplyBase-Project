import { Link, useNavigate } from 'react-router-dom';
import PageHero from '../components/ui/PageHero';
import Icon from '../components/ui/Icon';
import Reveal from '../components/ui/Reveal';
import { electricalGroups } from '../data/electricalContent';
import { formatRupees } from '../lib/money';

/* Category cards show a photo of the group's first service. */
const electricalCategoryImages = {
  'fan-services': '/assets/services/electrician/01-ceiling-fan-installation.webp',
  'light-services': '/assets/services/electrician/01-bulb-holder-installation.webp',
  'switch-socket-services': '/assets/services/electrician/01-switch-replacement.webp',
  'wiring-electrical-repair': '/assets/services/electrician/01-external-wiring.webp',
  'mcb-db-inverter': '/assets/services/electrician/01-mcb-replacement.webp',
  'appliance-installation': '/assets/services/electrician/01-geyser-installation.webp',
};

/* The card's "From" price is the cheapest priced item actually listed in the
   group, so it can never drift from the list behind it (the hand-typed
   figures did: Fan Services said ₹79 with nothing under ₹99). */
const fromPriceOf = (group) => {
  const prices = (group.items || []).map((i) => i.price).filter((p) => p > 0);
  return prices.length ? Math.min(...prices) : group.fromPrice ?? null;
};

export default function ElectricalCategory({
  modal = false,
  onSelectTab,
}) {
  const navigate = useNavigate();

  const handleClick = (group) => {
    if (modal && onSelectTab) {
      onSelectTab(group.slug);
      return;
    }
    navigate(`/services/electrical/${group.slug}`);
  };

  const renderCard = (group, index) => {
    const fromPrice = fromPriceOf(group);
    const content = (
      <>
        <span className="plb-overview-photo electrical-category-photo">
          <img
            src={electricalCategoryImages[group.slug] || group.image}
            alt={group.name}
            loading={index < 3 ? 'eager' : 'lazy'}
          />
        </span>

        <span className="plb-overview-name">
          <span>{group.name}</span>
          <Icon name="chevron-right" size={16} />
        </span>

        <span className="plb-overview-price">
          {fromPrice != null
            ? `From ${formatRupees(fromPrice)}`
            : 'On-site quote'}
        </span>

        <span className="plb-overview-price-note">
          {fromPrice != null
            ? '(Actual pricing)'
            : 'Final pricing after inspection'}
        </span>
      </>
    );

    if (modal) {
      return (
        <button
          key={group.slug}
          type="button"
          className="plb-overview-card"
          onClick={() => handleClick(group)}
        >
          {content}
        </button>
      );
    }

    return (
      <Link
        key={group.slug}
        to={`/services/electrical/${group.slug}`}
        className="plb-overview-card"
      >
        {content}
      </Link>
    );
  };

  return (
    <>
      {!modal && (
        <PageHero
          eyebrow="ELECTRICIAN"
          title="Electrical Services"
          text="Certified electricians for wiring, fans, switches, repairs and more — pick a service to get started."
          image="/assets/services/electrician/hero.webp"
          breadcrumbs={[
            { label: 'Services', to: '/services' },
            { label: 'Electrical' },
          ]}
        />
      )}

      <section
        className={
          modal
            ? 'plb-section !py-0 !pb-4 electrical-modal-section'
            : 'plb-section electrical-page-section'
        }
      >
        <div
          className={
            modal
              ? 'container !w-full !max-w-none !px-0'
              : 'container container-narrow'
          }
        >
          <div className="plb-overview-grid">
            {electricalGroups.map((group, i) => (
              <Reveal key={group.slug} delay={i * 30}>
                {renderCard(group, i)}
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}