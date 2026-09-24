import React, { useState } from 'react';
import { Link } from 'react-router-dom';

import PageHero from '../components/ui/PageHero';
import Icon from '../components/ui/Icon';
import Reveal from '../components/ui/Reveal';

import { otherServiceTiles } from '../data/otherServices';

// ============================================================
// PROJECT STAGES
// ============================================================




// ============================================================
// COMPONENT
// ============================================================

export default function OtherServicesCategory({
  modal = false,
  onSelectService,
}) {

  // Selected project stage
  const [selectedStage, setSelectedStage] = useState('');

  return (
    <>
      {/* ======================================================
          PAGE HERO
      ====================================================== */}

      {!modal && (
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


      {/* ======================================================
          MAIN SECTION
      ====================================================== */}

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

          {/* ==================================================
              OTHER SERVICES
          ================================================== */}

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

                  {/* Icon */}

                  <span className="elc-tile-icon">
                    <Icon
                      name={tile.icon}
                      size={22}
                    />
                  </span>


                  {/* Text */}

                  <span className="elc-tile-body">

                    <strong>
                      {tile.name}
                    </strong>

                    <span>
                      {tile.blurb}
                    </span>

                  </span>


                  {/* Arrow */}

                  <Icon
                    name="chevron-right"
                    size={18}
                    className="elc-tile-arrow"
                  />

                </Link>

              </Reveal>

            ))}

          </div>


         

        </div>

      </section>
    </>
  );
}