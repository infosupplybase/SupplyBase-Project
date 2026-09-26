<<<<<<< HEAD
import React from 'react';
import { Link } from 'react-router-dom';

import PageHero from '../components/ui/PageHero';
import Icon from '../components/ui/Icon';
import Reveal from '../components/ui/Reveal';

import { otherServiceTiles } from '../data/otherServices';

=======
import { Link } from 'react-router-dom';
import PageHero from '../components/ui/PageHero';
import Icon from '../components/ui/Icon';
import Reveal from '../components/ui/Reveal';
import { otherServiceTiles } from '../data/otherServices';

/**
 * /services/other-services — the "Other Services" catch-all category list,
 * mirroring ElectricalCategory's tile-list pattern. Each tile opens the
 * existing generic site-visit wizard at its own slug (all five kept their
 * full question sets in the database while deactivated).
 */
>>>>>>> main
export default function OtherServicesCategory({
  modal = false,
  onSelectService,
}) {
  return (
    <>
      {!modal && (
<<<<<<< HEAD
        <PageHero
          eyebrow="OTHER SERVICES"
          title="Other Services"
          text="Everything else we do — architectural design, civil construction, furniture, fabrication and finishing work."
          image="/assets/hero-house.svg"
          breadcrumbs={[
            {
              label: 'Services',
              to: '/services',
            },
            {
              label: 'Other Services',
            },
          ]}
        />
      )}

      <section
        className={modal ? 'elc-section !py-0' : 'elc-section'}
      >
        <div
          className={
            modal
              ? 'container container-narrow !max-w-none !px-0'
              : 'container container-narrow'
          }
        >
          <div className="elc-list">
            {otherServiceTiles.map((tile, i) => (
              <Reveal
                key={tile.slug}
                delay={i * 30}
              >
                <Link
                  to={`/services/${tile.slug}`}
                  className="elc-tile"
                  onClick={(e) => {
                    if (modal) {
                      e.preventDefault();
                      onSelectService?.(tile.slug);
                    }
                  }}
                >
                  <span className="elc-tile-image">
                    <img
                      src={tile.image}
                      alt={tile.name}
                      loading="lazy"
                    />
                  </span>

                  <span className="elc-tile-icon">
                    <Icon
                      name={tile.icon}
                      size={22}
                    />
                  </span>

                  <span className="elc-tile-body">
                    <strong>{tile.name}</strong>

                    <span>{tile.blurb}</span>
                  </span>

                  <Icon
                    name="chevron-right"
                    size={18}
                    className="elc-tile-arrow"
                  />
=======
  <PageHero
    eyebrow="OTHER SERVICES"
    title="Other Services"
    text="Everything else we do — architectural design, civil construction, furniture, fabrication and finishing work."
    image="/assets/hero-house.svg"
    breadcrumbs={[
      { label: 'Services', to: '/services' },
      { label: 'Other Services' },
    ]}
  />
)}

      <section
  className={
    modal
      ? 'elc-section !py-0'
      : 'elc-section'
  }
>
  <div
    className={
      modal
        ? 'container container-narrow !max-w-none !px-0'
        : 'container container-narrow'
    }
  >
          <div className="elc-list">
            {otherServiceTiles.map((tile, i) => (
              <Reveal key={tile.slug} delay={i * 30}>
                <Link
  to={`/services/${tile.slug}`}
  className="elc-tile"
  onClick={(e) => {
    if (modal) {
      e.preventDefault();
      onSelectService?.(tile.slug);
    }
  }}
>
                  <span className="elc-tile-image">
                    <img src={tile.image} alt={tile.name} loading="lazy" />
                  </span>
                  <span className="elc-tile-icon">
                    <Icon name={tile.icon} size={22} />
                  </span>
                  <span className="elc-tile-body">
                    <strong>{tile.name}</strong>
                    <span>{tile.blurb}</span>
                  </span>
                  <Icon name="chevron-right" size={18} className="elc-tile-arrow" />
>>>>>>> main
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </>
  );
<<<<<<< HEAD
}
=======
}
>>>>>>> main
