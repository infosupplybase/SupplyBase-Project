import { useEffect, useRef, useState } from 'react';
import PageHero from '../components/ui/PageHero';
import Icon from '../components/ui/Icon';
import Reveal from '../components/ui/Reveal';
import CtaBand from '../components/ui/CtaBand';
import api, { friendlyError } from '../lib/api';
import ServiceBooking from './ServiceBooking';
import InteriorBooking from './InteriorBooking';
import {
  interiorSpaces,
  getDesignsBySpace,
  getDesignBySlug,
  HOME_VISIT_FEE,
} from '../data/interiorCatalog';
import InteriorDesignCategory from './InteriorDesignCategory';
import InteriorDesignCatalogue from './InteriorDesignCatalogue';
import InteriorDesignFlow from './InteriorDesignFlow';
import PaintingCategory from './PaintingCategory';
import PaintingFlow from './PaintingFlow';

/**
 * The four services (RULE 1).
 *
 * Fetched, not hard-coded: this and the booking form read the same catalogue,
 * so they cannot drift apart.
 */

const serviceImages = {
  'interior-design': '/assets/services/interior-design.webp',
  'interior-by-choice': '/assets/services/interior-by-choice.png',
  painting: '/assets/services/painting.jpg',
  waterproofing: '/assets/services/waterproofing.jpeg',
  'pop-ceiling-design': '/assets/services/pop-ceiling-design.jpg',
  plumbing: '/assets/services/plumber.jpg',
  electrical: '/assets/services/electrician.jpg',
  'other-services': '/assets/services/other-services.webp',
};

export default function Services() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [selectedService, setSelectedService] = useState(null);

  const [selectedInteriorSpace, setSelectedInteriorSpace] = useState(null);
  const [selectedInteriorDesign, setSelectedInteriorDesign] = useState(null);
  const [showInteriorBooking, setShowInteriorBooking] = useState(false);
  const [selectedInteriorDesignCategory, setSelectedInteriorDesignCategory] = useState(null);
  const [selectedInteriorDesignProject, setSelectedInteriorDesignProject] = useState(null);
  const [selectedPaintingFlow, setSelectedPaintingFlow] = useState(null);

  const modalScrollRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    api
      .services()
      .then((result) => {
        if (!cancelled) {
          setServices(result);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(friendlyError(err));
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const scrollModalToTop = () => {
    requestAnimationFrame(() => {
      modalScrollRef.current?.scrollTo({
        top: 0,
        behavior: 'auto',
      });
    });
  };

const closeModal = () => {
  setSelectedService(null);
  setSelectedInteriorSpace(null);
  setSelectedInteriorDesign(null);
  setShowInteriorBooking(false);
  setSelectedInteriorDesignCategory(null);
  setSelectedInteriorDesignProject(null);
  setSelectedPaintingFlow(null);
};

  return (
    <>
      <PageHero
        eyebrow="OUR SERVICES"
        title="WHAT WE DO"
        text="Four services, one accountable team. Book a site visit and we will assess the work and send you a written quotation."
        image="/assets/hero-house.svg"
        breadcrumbs={[{ label: 'Services' }]}
      />

      <section className="section">
        <div className="container">
          {loading && (
            <p className="question-hint">
              Loading services…
            </p>
          )}

          {error && (
            <div
              role="alert"
              className="alert alert-error"
            >
              <Icon
                name="info"
                size={18}
              />

              <span>
                {error}
              </span>
            </div>
          )}

          <div className="svc-grid">
            {services.map((service, i) => (
              <Reveal
                key={service.slug}
                delay={i * 70}
              >
                <article
                  className="svc-card"
                  data-service={service.slug}
                >
                  <div className="svc-card-media">
                    <img
                      src={serviceImages[service.slug]}
                      alt={service.name}
                    />
                  </div>

                  <div className="svc-card-body">
                    <div className="svc-card-icon">
                      <Icon
                        name={service.icon || 'tools'}
                        size={22}
                        strokeWidth={1.4}
                      />
                    </div>

                    <h3>
                      {service.name}
                    </h3>

                    <p>
                      {service.description}
                    </p>

                    <div className="svc-card-foot">
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        onClick={() => {
  setSelectedService(service);
  setSelectedInteriorSpace(null);
  setSelectedInteriorDesign(null);
  setShowInteriorBooking(false);
  setSelectedInteriorDesignCategory(null);
  setSelectedInteriorDesignProject(null);
  setSelectedPaintingFlow(null);
}}
                      >
                        BOOK NOW

                        <Icon
                          name="arrow-right"
                          size={15}
                        />
                      </button>
                    </div>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <CtaBand />

      {selectedService && (
        <div
          className="
            fixed
            inset-0
            z-[2000]
            flex
            items-center
            justify-center
            bg-black/65
            backdrop-blur-[3px]
            p-4
          "
          onClick={closeModal}
        >
          <div
            className={`
              relative
              w-full

              ${
  selectedService.slug === 'interior-by-choice'
    ? 'max-w-[1000px]'
    : selectedService.slug === 'interior-design'
      ? 'max-w-[820px]'
      : 'max-w-[760px]'
}

              max-h-[88vh]
              h-auto
              overflow-hidden
              rounded-2xl
              bg-white
              shadow-2xl

              max-sm:h-[92vh]
              max-sm:max-h-[92vh]
              max-sm:flex
              max-sm:flex-col
              max-sm:rounded-xl
            `}
            onClick={(e) => e.stopPropagation()}
          >
            {/* CLOSE BUTTON */}

            <button
              type="button"
              onClick={closeModal}
              className="
                !absolute
                !right-5
                !top-5
                !z-50

                !flex
                !h-10
                !w-10
                !items-center
                !justify-center

                !rounded-full
                !border
                !border-gray-200
                !bg-white

                !text-xl
                !text-gray-700

                !shadow-sm

                transition

                hover:!bg-gray-100
              "
              aria-label="Close booking modal"
            >
              ✕
            </button>

            {/* MODAL HEADER */}

            <div className="px-6 pt-6 pr-16">
              <p
                className="
                  mb-1
                  text-sm
                  font-semibold
                  uppercase
                  tracking-[0.16em]
                  text-amber-500
                "
              >
                Book a service
              </p>

              <h2
                className="
                  text-2xl
                  font-bold
                  text-gray-950
                "
              >
                {selectedService.name}
              </h2>

              <p
                className="
                  mt-2
                  text-sm
                  leading-6
                  text-gray-500
                "
              >
                {selectedService.description}
              </p>
            </div>

            <div className="my-6 h-px bg-gray-200" />

            {/* MODAL SCROLL AREA */}

            <div
              ref={modalScrollRef}
              className="
                max-h-[calc(88vh-190px)]
                overflow-y-auto

                px-6
                pb-10
                md:pb-12

                max-sm:flex-1
                max-sm:min-h-0
                max-sm:max-h-none

                [scrollbar-width:none]
                [&::-webkit-scrollbar]:hidden
              "
            >
              {selectedService.slug === 'interior-by-choice' ? (
                <>
                  {/* ========================================= */}
                  {/* DESIGN DETAIL */}
                  {/* ========================================= */}

                  {showInteriorBooking ? (
  <InteriorBooking
    modal={true}
    spaceSlug={selectedInteriorSpace}
    designSlug={selectedInteriorDesign}
    onBack={() => {
      setShowInteriorBooking(false);
      scrollModalToTop();
    }}
    onStepChange={scrollModalToTop}
  />
) : selectedInteriorSpace &&
selectedInteriorDesign ? (
                    <div className="pb-2 md:pb-8">
                      {(() => {
                        const design =
                          getDesignBySlug(
                            selectedInteriorSpace,
                            selectedInteriorDesign
                          );

                        const space =
                          interiorSpaces.find(
                            (item) =>
                              item.slug ===
                              selectedInteriorSpace
                          );

                        if (!design) {
                          return (
                            <p className="ibc-empty">
                              Design details could not be loaded.
                            </p>
                          );
                        }

                        return (
                          <>
                            <button
                              type="button"
                              className="btn btn-ghost btn-sm mb-4"
                              onClick={() => {
                                setSelectedInteriorDesign(null);

                                scrollModalToTop();
                              }}
                            >
                              <Icon
                                name="arrow-left"
                                size={16}
                              />

                              BACK
                            </button>

                            <div
                              className="
                                grid
                                grid-cols-1
                                gap-6
                                md:grid-cols-2
                              "
                            >
                              {/* DESIGN IMAGE */}

                              <div
                                className="
                                  overflow-hidden
                                  rounded-xl
                                "
                              >
                                <img
                                  src={design.image}
                                  alt={design.name}
                                  className="
                                    h-auto
                                    max-h-[420px]
                                    w-full
                                    object-cover
                                  "
                                />
                              </div>

                              {/* DESIGN INFORMATION */}

                              <div>
                                <p
                                  className="
                                    mb-2
                                    text-sm
                                    font-semibold
                                    uppercase
                                    tracking-[0.14em]
                                    text-amber-500
                                  "
                                >
                                  {space?.name}
                                </p>

                                <h3
                                  className="
                                    text-2xl
                                    font-bold
                                    text-gray-950
                                  "
                                >
                                  {design.name}
                                </h3>

                                {design.tagline && (
                                  <p
                                    className="
                                      mt-2
                                      text-sm
                                      leading-6
                                      text-gray-500
                                    "
                                  >
                                    {design.tagline}
                                  </p>
                                )}

                                <p
                                  className="
                                    mt-3
                                    text-lg
                                    font-semibold
                                    text-gray-900
                                  "
                                >
                                  ₹{design.pricePerSqft} / sq.ft.
                                </p>

                                {design.description && (
                                  <p
                                    className="
                                      mt-4
                                      text-sm
                                      leading-6
                                      text-gray-600
                                    "
                                  >
                                    {design.description}
                                  </p>
                                )}

                                <button
  type="button"
  className="
    btn
    btn-primary
    mt-6
    w-full
    md:w-auto
  "
  onClick={() => {
    setShowInteriorBooking(true);
    scrollModalToTop();
  }}
>
  CUSTOMISE THIS DESIGN

  <Icon
    name="arrow-right"
    size={17}
  />
</button>
                              </div>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  ) : selectedInteriorSpace ? (
                    <>
                      {/* ========================================= */}
                      {/* DESIGN GALLERY */}
                      {/* ========================================= */}

                      <div className="pb-2 md:pb-8">
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm mb-4"
                          onClick={() => {
                            setSelectedInteriorSpace(null);
                            setSelectedInteriorDesign(null);

                            scrollModalToTop();
                          }}
                        >
                          <Icon
                            name="arrow-left"
                            size={16}
                          />

                          BACK
                        </button>

                        {/* SPACE FILTER */}

                        <div className="ibc-filter-row">
                          {interiorSpaces.map(
                            (space) => (
                              <button
                                key={space.slug}
                                type="button"
                                className={`ibc-filter-chip ${
                                  space.slug ===
                                  selectedInteriorSpace
                                    ? 'active'
                                    : ''
                                }`}
                                onClick={() => {
                                  setSelectedInteriorSpace(
                                    space.slug
                                  );

                                  setSelectedInteriorDesign(
                                    null
                                  );

                                  scrollModalToTop();
                                }}
                              >
                                {space.name}
                              </button>
                            )
                          )}
                        </div>

                        {/* DESIGN CARDS */}

                        {getDesignsBySpace(
                          selectedInteriorSpace
                        ).length === 0 ? (
                          <p className="ibc-empty">
                            More designs for this space
                            are on the way. Book a home
                            visit and our designer will
                            bring options for you.
                          </p>
                        ) : (
                          <div className="ibc-design-grid">
                            {getDesignsBySpace(
                              selectedInteriorSpace
                            ).map((design) => (
                              <div
                                key={design.slug}
                                className="ibc-design-card"
                              >
                                <button
                                  type="button"
                                  className="
                                    ibc-design-media
                                    !block
                                    !w-full
                                    !border-0
                                    !p-0
                                  "
                                  onClick={() => {
                                    setSelectedInteriorDesign(
                                      design.slug
                                    );

                                    scrollModalToTop();
                                  }}
                                >
                                  <img
                                    src={design.image}
                                    alt={design.name}
                                    loading="lazy"
                                  />
                                </button>

                                <button
                                  type="button"
                                  className="
                                    ibc-design-body
                                    !w-full
                                    !border-0
                                    !text-left
                                  "
                                  onClick={() => {
                                    setSelectedInteriorDesign(
                                      design.slug
                                    );

                                    scrollModalToTop();
                                  }}
                                >
                                  <span className="ibc-design-name">
                                    {design.name}
                                  </span>

                                  <span className="ibc-design-price">
                                    ₹{design.pricePerSqft}{' '}
                                    / sq.ft.
                                  </span>
                                </button>
                              </div>
                            ))}
                          </div>
                        )}

                        <button
  type="button"
  className="
    btn
    btn-primary
    ibc-customise-cta
  "
  onClick={() => {
    setSelectedInteriorDesign(null);
    setShowInteriorBooking(true);
    scrollModalToTop();
  }}
>
  Customise Your Design

  <Icon
    name="arrow-right"
    size={17}
  />
</button>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* ========================================= */}
                      {/* CHOOSE SPACE */}
                      {/* ========================================= */}

                      <div className="pb-2 md:pb-8">
                        <div
                          className="
                            mb-5
                            rounded-xl
                            border
                            border-amber-200
                            bg-amber-50
                            p-4
                          "
                        >
                          <p
                            className="
                              text-sm
                              font-semibold
                              text-gray-900
                            "
                          >
                            Book a Home Visit at just ₹
                            {HOME_VISIT_FEE}
                          </p>

                          <p
                            className="
                              mt-1
                              text-sm
                              leading-6
                              text-gray-600
                            "
                          >
                            Get expert advice,
                            measurement and a custom
                            design as per your choice.
                          </p>
                        </div>

                        <h3
                          className="
                            mb-4
                            text-lg
                            font-bold
                            text-gray-950
                          "
                        >
                          Choose Your Space
                        </h3>

                        <div
                          className="
                            grid
                            grid-cols-1
                            gap-4
                            sm:grid-cols-2
                          "
                        >
                          {interiorSpaces.map(
                            (space) => (
                              <button
                                key={space.slug}
                                type="button"
                                onClick={() => {
                                  setSelectedInteriorSpace(
                                    space.slug
                                  );

                                  setSelectedInteriorDesign(
                                    null
                                  );

                                  scrollModalToTop();
                                }}
                                className="
                                  group
                                  relative
                                  overflow-hidden
                                  rounded-xl
                                  text-left
                                "
                              >
                                <img
                                  src={space.image}
                                  alt={space.name}
                                  className="
                                    h-36
                                    w-full
                                    object-cover

                                    transition
                                    duration-300

                                    group-hover:scale-105

                                    sm:h-44
                                  "
                                />

                                <div
                                  className="
                                    absolute
                                    inset-0
                                    bg-gradient-to-t
                                    from-black/70
                                    via-black/10
                                    to-transparent
                                  "
                                />

                                <span
                                  className="
                                    absolute
                                    bottom-3
                                    left-4
                                    text-base
                                    font-semibold
                                    text-white
                                  "
                                >
                                  {space.name}
                                </span>
                              </button>
                            )
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </>
              ) : selectedService.slug === 'interior-design' ? (
  selectedInteriorDesignProject ? (
    <InteriorDesignFlow
      modal={true}
      categorySlug={selectedInteriorDesignCategory}
      projectSlug={selectedInteriorDesignProject}
      onBackToCatalogue={() => {
        setSelectedInteriorDesignProject(null);
        scrollModalToTop();
      }}
      onStepChange={scrollModalToTop}
    />
  ) : selectedInteriorDesignCategory ? (
    <InteriorDesignCatalogue
      modal={true}
      categorySlug={selectedInteriorDesignCategory}
      onSelectProject={(projectSlug) => {
        setSelectedInteriorDesignProject(projectSlug);
        scrollModalToTop();
      }}
      onBack={() => {
        setSelectedInteriorDesignCategory(null);
        setSelectedInteriorDesignProject(null);
        scrollModalToTop();
      }}
    />
  ) : (
    <InteriorDesignCategory
      modal={true}
      onSelectCategory={(categorySlug) => {
        setSelectedInteriorDesignCategory(categorySlug);
        setSelectedInteriorDesignProject(null);
        scrollModalToTop();
      }}
      onCustom={() => {
        console.log('Custom interior design');
      }}
    />
  )
) : selectedService.slug === 'painting' ? (
  selectedPaintingFlow ? (
    <div className="painting-modal-scope">
  <PaintingFlow
    modal={true}
    flowSlug={selectedPaintingFlow}
    onBackToCategories={() => {
      setSelectedPaintingFlow(null);
      scrollModalToTop();
    }}
    onStepChange={scrollModalToTop}
  />
</div>
  ) : (
    <PaintingCategory
      modal={true}
      onSelectFlow={(flowSlug) => {
        setSelectedPaintingFlow(flowSlug);
        scrollModalToTop();
      }}
    />
  )
) : (
  <ServiceBooking
    serviceSlug={selectedService.slug}
    modal={true}
    onClose={closeModal}
    onStepChange={scrollModalToTop}
  />
)}
            </div>
          </div>
        </div>
      )}
    </>
  );
}