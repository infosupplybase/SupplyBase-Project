import { useRef, useState } from 'react';
import Icon from '../ui/Icon';
import ServiceBooking from '../../pages/ServiceBooking';
import InteriorBooking from '../../pages/InteriorBooking';
import {
  interiorSpaces,
  getDesignsBySpace,
  getDesignBySlug,
  HOME_VISIT_FEE,
} from '../../data/interiorCatalog';
import InteriorDesignCategory from '../../pages/InteriorDesignCategory';
import InteriorDesignCatalogue from '../../pages/InteriorDesignCatalogue';
import InteriorDesignFlow from '../../pages/InteriorDesignFlow';
import PaintingCategory from '../../pages/PaintingCategory';
import PaintingFlow from '../../pages/PaintingFlow';
import PlumbingCategory from '../../pages/PlumbingCategory';
import PlumbingTab from '../../pages/PlumbingTab';
import PlumbingCart from '../../pages/PlumbingCart';
import PlumbingCheckout from '../../pages/PlumbingCheckout';
import PlumbingConsultationList from '../../pages/PlumbingConsultationList';
import PlumbingConsultationBook from '../../pages/PlumbingConsultationBook';
import OtherServicesCategory from '../../pages/OtherServicesCategory';
import ElectricalCategory from '../../pages/ElectricalCategory';
import PopCeilingCategory from '../../pages/PopCeilingCategory';
import WaterproofingCategory from '../../pages/WaterproofingCategory';

/**
 * Opens the "Book a service" modal, shared by every page that lets someone
 * pick a service and book it: the Services page's own grid and the
 * homepage's Popular Services tiles both render this component so the
 * booking flow is identical (same catalogue, same steps) no matter which
 * page you started from.
 *
 * Usage: const booking = useServiceBookingModal(); ... onClick={() =>
 * booking.open(service)} ... {booking.service && <ServiceBookingModal
 * key={booking.openToken} service={booking.service} onClose={booking.close}
 * />}
 *
 * The `key={booking.openToken}` remounts the modal fresh on every open —
 * including reopening the same service right after closing it — so a
 * half-finished sub-flow (a picked interior space, a plumbing tab, a cart)
 * never leaks into the next booking.
 */
export function useServiceBookingModal() {
  const [service, setService] = useState(null);
  const [openToken, setOpenToken] = useState(0);

  return {
    service,
    openToken,
    open: (nextService) => {
      setService(nextService);
      setOpenToken((token) => token + 1);
    },
    close: () => setService(null),
  };
}

export default function ServiceBookingModal({ service, onClose }) {
  const [selectedInteriorSpace, setSelectedInteriorSpace] = useState(null);
  const [selectedInteriorDesign, setSelectedInteriorDesign] = useState(null);
  const [showInteriorBooking, setShowInteriorBooking] = useState(false);
  const [selectedInteriorDesignCategory, setSelectedInteriorDesignCategory] = useState(null);
  const [selectedInteriorDesignProject, setSelectedInteriorDesignProject] = useState(null);
  const [selectedPaintingFlow, setSelectedPaintingFlow] = useState(null);
  const [selectedPlumbingTab, setSelectedPlumbingTab] = useState(null);
  const [plumbingView, setPlumbingView] = useState('category');
  const [selectedPlumbingConsultation, setSelectedPlumbingConsultation] = useState(null);
  const [selectedOtherService, setSelectedOtherService] = useState(null);

  const modalScrollRef = useRef(null);

  const scrollModalToTop = () => {
    requestAnimationFrame(() => {
      modalScrollRef.current?.scrollTo({
        top: 0,
        behavior: 'auto',
      });
    });
  };

  return (
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
      onClick={onClose}
    >
      <div
        className={`
          relative
          w-full

         ${['interior-by-choice', 'interior-design', 'electrical', 'pop-ceiling-design', 'waterproofing'].includes(service.slug)
  ? 'max-w-[1000px]'
          : 'max-w-[500px]'
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
          onClick={onClose}
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

        <div className="px-5 pt-5 pr-14">
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
            {service.name}
          </h2>

          {/* <p
            className="
              mt-2
              text-sm
              leading-6
              text-gray-500
            "
          >
            {service.description}
          </p> */}
        </div>

        <div className="my-4 h-px bg-gray-200" />

        {/* MODAL SCROLL AREA */}

        <div
          ref={modalScrollRef}
          className="
            max-h-[calc(88vh-170px)]
            overflow-y-auto

            px-5
            pb-6
            md:pb-8

            max-sm:flex-1
            max-sm:min-h-0
            max-sm:max-h-none

            [scrollbar-width:none]
            [&::-webkit-scrollbar]:hidden
          "
        >
          {service.slug === 'interior-by-choice' ? (
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
                          {/* <Icon
                            name="arrow-left"
                            size={16}
                          /> */}

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

                              {/* <Icon
                                name="arrow-right"
                                size={17}
                              /> */}
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
                      {/* <Icon
                        name="arrow-left"
                        size={16}
                      /> */}

                      BACK
                    </button>

                    {/* SPACE FILTER */}

                    <div className="ibc-filter-row">
                      {interiorSpaces.map(
                        (space) => (
                          <button
                            key={space.slug}
                            type="button"
                            className={`ibc-filter-chip ${space.slug ===
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

                      {/* <Icon
                        name="arrow-right"
                        size={17}
                      /> */}
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
          ) : service.slug === 'interior-design' ? (
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
          ) : service.slug === 'painting' ? (
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
              <div className="painting-modal-scope">
                <PaintingCategory
                  modal={true}
                  onSelectFlow={(flowSlug) => {
                    setSelectedPaintingFlow(flowSlug);
                    scrollModalToTop();
                  }}
                />
              </div>
            )
          ) : service.slug === 'plumbing' ? (
            <div className="plumbing-modal-scope">
            {plumbingView === 'category' ? (
              <PlumbingCategory
                modal={true}
                onSelectTab={(tabSlug) => {
                  setSelectedPlumbingTab(tabSlug);
                  setPlumbingView('tab');
                  scrollModalToTop();
                }}
                onSelectConsultation={() => {
                  setSelectedPlumbingConsultation(null);
                  setPlumbingView('consultations');
                  scrollModalToTop();
                }}
              />
            ) : plumbingView === 'tab' ? (
              <PlumbingTab
                modal={true}
                tabSlug={selectedPlumbingTab}
                onBackToCategories={() => {
                  setSelectedPlumbingTab(null);
                  setPlumbingView('category');
                  scrollModalToTop();
                }}
                onOpenConsultation={() => {
                  setSelectedPlumbingConsultation(null);
                  setPlumbingView('consultations');
                  scrollModalToTop();
                }}
                onViewCart={() => {
                  setPlumbingView('cart');
                  scrollModalToTop();
                }}
              />
            ) : plumbingView === 'cart' ? (
              <PlumbingCart
                modal={true}
                onBackToServices={() => {
                  setPlumbingView(
                    selectedPlumbingTab ? 'tab' : 'category'
                  );
                  scrollModalToTop();
                }}
                onCheckout={() => {
                  setPlumbingView('checkout');
                  scrollModalToTop();
                }}
              />
            ) : plumbingView === 'checkout' ? (
              <PlumbingCheckout
                modal={true}
                onBackToCart={() => {
                  setPlumbingView('cart');
                  scrollModalToTop();
                }}
                onStepChange={scrollModalToTop}
                onBackToServices={() => {
                  setSelectedPlumbingTab(null);
                  setPlumbingView('category');
                  scrollModalToTop();
                }}
              />
            ) : plumbingView === 'consultations' ? (
              <PlumbingConsultationList
                modal={true}
                onBackToCategories={() => {
                  setPlumbingView('category');
                  scrollModalToTop();
                }}
                onSelectConsultationType={(typeSlug) => {
                  setSelectedPlumbingConsultation(typeSlug);
                  setPlumbingView('consultation-book');
                  scrollModalToTop();
                }}
              />
            ) : plumbingView === 'consultation-book' ? (
              <PlumbingConsultationBook
                modal={true}
                typeSlug={selectedPlumbingConsultation}
                onBackToConsultations={() => {
                  setSelectedPlumbingConsultation(null);
                  setPlumbingView('consultations');
                  scrollModalToTop();
                }}
                onStepChange={scrollModalToTop}
                onBackToServices={() => {
                  setSelectedPlumbingConsultation(null);
                  setPlumbingView('category');
                  scrollModalToTop();
                }}
              />
            ) : null}
            </div>
          ) : service.slug === 'other-services' ? (
            selectedOtherService ? (
              <ServiceBooking
                serviceSlug={selectedOtherService}
                modal={true}
                onClose={onClose}
                onStepChange={scrollModalToTop}
              />
            ) : (
              <OtherServicesCategory
                modal={true}
                onSelectService={(serviceSlug) => {
                  setSelectedOtherService(serviceSlug);
                  scrollModalToTop();
                }}
              />
            )
          ) : service.slug === 'electrical' ? (
            <ElectricalCategory
              modal={true}
            />
          ) : service.slug === 'pop-ceiling-design' ? (
            <PopCeilingCategory
              modal={true}
            />
          ) : service.slug === 'waterproofing' ? (
            <WaterproofingCategory
              modal={true}
            />
          ) : (
            <ServiceBooking
              serviceSlug={service.slug}
              modal={true}
              onClose={onClose}
              onStepChange={scrollModalToTop}
            />
          )}
        </div>
      </div>
    </div>
  );
}
