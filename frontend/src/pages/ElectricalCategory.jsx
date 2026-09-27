import { Link, useNavigate } from 'react-router-dom';
import PageHero from '../components/ui/PageHero';
import Icon from '../components/ui/Icon';
import Reveal from '../components/ui/Reveal';
import { electricalGroups } from '../data/electricalContent';
import { formatRupees } from '../lib/money';

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
    const content = (
      <>
        <span className="plb-overview-photo">
          <img
            src={group.image}
            alt={group.name}
            loading={index < 3 ? 'eager' : 'lazy'}
          />
        </span>

        <span className="plb-overview-name">
          <span>{group.name}</span>
          <Icon name="chevron-right" size={16} />
        </span>

        <span className="plb-overview-price">
          {group.fromPrice != null
            ? `From ${formatRupees(group.fromPrice)}`
            : 'On-site quote'}
        </span>

        <span className="plb-overview-price-note">
          {group.fromPrice != null
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