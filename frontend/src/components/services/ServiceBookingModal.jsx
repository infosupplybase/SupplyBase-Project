import { useCallback, useRef, useState } from 'react';
import { useFormBack, useHistoryState } from '../../hooks/useHistoryState';
import Icon from '../ui/Icon';
import { ModalFooterContext } from './ModalFoot';
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
import InteriorDesignCustomFlow from '../../pages/InteriorDesignCustomFlow';
import PaintingCategory from '../../pages/PaintingCategory';
import PaintingFlow from '../../pages/PaintingFlow';
import PopCeilingCategory from '../../pages/PopCeilingCategory';
import PopCeilingFlow from '../../pages/PopCeilingFlow';
import PlumbingCategory from '../../pages/PlumbingCategory';
import PlumbingTab from '../../pages/PlumbingTab';
import PlumbingCart from '../../pages/PlumbingCart';
import PlumbingCheckout from '../../pages/PlumbingCheckout';
import PlumbingConsultationList from '../../pages/PlumbingConsultationList';
import PlumbingConsultationBook from '../../pages/PlumbingConsultationBook';
import AcServices from '../../pages/AcServices';

import WaterproofingFlow from '../../pages/WaterproofingFlow';
import WaterproofingBathroom from '../../pages/WaterproofingBathroom';
import { wpFlows, wpCategories } from '../../data/waterproofingContent';

import ElectricalCategory from '../../pages/ElectricalCategory';
import ElectricalTab from '../../pages/ElectricalTab';
import ElectricalCart from '../../pages/ElectricalCart';
import ElectricalCheckout from '../../pages/ElectricalCheckout';
import { getElectricalGroup } from '../../data/electricalContent';


/**
 * The "Book a service" modal's content: the booking flow for the chosen
 * service. Opened and closed with useServiceBookingModal (its own file, so the
 * pages that show service tiles do not have to load this whole component
 * until someone actually opens a booking).
 */
export default function ServiceBookingModal({ service, onClose }) {
  const [selectedInteriorSpace, setSelectedInteriorSpace] = useHistoryState('bm:interiorSpace', null, { push: true });
  const [selectedInteriorDesign, setSelectedInteriorDesign] = useHistoryState('bm:interiorDesign', null, { push: true });
  const [showInteriorBooking, setShowInteriorBooking] = useHistoryState('bm:interiorBooking', false, { push: true });
  const [selectedInteriorDesignCategory, setSelectedInteriorDesignCategory] = useHistoryState('bm:idCategory', null, { push: true });
  const [selectedInteriorDesignProject, setSelectedInteriorDesignProject] = useHistoryState('bm:idProject', null, { push: true });
  // Interior Design -> "Custom": the requirements box, then details + schedule.
  const [showCustomInteriorDesign, setShowCustomInteriorDesign] = useHistoryState('bm:idCustom', false, { push: true });
  const [showCustomInteriorDetails, setShowCustomInteriorDetails] = useHistoryState('bm:idCustomDetails', false, { push: true });
  const [customInteriorRequirements, setCustomInteriorRequirements] = useHistoryState('bm:idCustomRequirements', '');
  const [selectedPaintingFlow, setSelectedPaintingFlow] = useHistoryState('bm:paintingFlow', null, { push: true });
  const [selectedPopFlow, setSelectedPopFlow] = useHistoryState('bm:popFlow', null, { push: true });
  const [selectedPlumbingTab, setSelectedPlumbingTab] = useHistoryState('bm:plumbingTab', null, { push: true });
  const [plumbingView, setPlumbingView] = useHistoryState('bm:plumbingView', 'category', { push: true });
  // Electrical: category -> service list -> cart -> checkout, like plumbing.
  const [electricalTab, setElectricalTab] = useHistoryState('bm:electricalTab', null, { push: true });
  const [electricalView, setElectricalView] = useHistoryState('bm:electricalView', 'category', { push: true });
  const [selectedPlumbingConsultation, setSelectedPlumbingConsultation] = useHistoryState('bm:plumbingConsultation', null, { push: true });
  const [selectedWaterproofingPage, setSelectedWaterproofingPage] = useHistoryState('bm:waterproofingPage', null, { push: true });

  // Every in-app BACK goes back through history, exactly like the
  // browser's Back button, so the two always agree.
  const formBack = useFormBack();

  const modalScrollRef = useRef(null);

  // The pop-up's footer: the forms draw their Back / Continue bar here
  // (see ModalFoot), below the scrolling area rather than over it.
  const [footerNode, setFooterNode] = useState(null);

  // One stable function: the forms scroll the pop-up to the top when their
  // step changes, and a new function on every render (every tap saves the
  // answer to history, which re-renders the pop-up) would look like a step
  // change and throw the customer back to the top after each choice.
  const scrollModalToTop = useCallback(() => {
    requestAnimationFrame(() => {
      modalScrollRef.current?.scrollTo({
        top: 0,
        behavior: 'auto',
      });
    });
  }, []);

  // Inside a Painting or POP flow the flow shows its own title bar, so the
  // pop-up's "Book a service" header gives way to a spacer under the close
  // button (yash's layout). AC Services always draws its own bar.
  const hideMainHeader =
    (service.slug === 'painting' && Boolean(selectedPaintingFlow)) ||
    (service.slug === 'pop-ceiling-design' && Boolean(selectedPopFlow)) ||
    service.slug === 'ac-services';

  const openWaterproofingService = (route) => {
    const target = new URL(route, window.location.origin);
    const slug = target.pathname.split('/').filter(Boolean).pop();
    setSelectedWaterproofingPage({ slug, preselect: target.searchParams.get('preselect') });
    scrollModalToTop();
  };

  const backToWaterproofingCategories = () => {
    formBack(() => setSelectedWaterproofingPage(null));
    scrollModalToTop();
  };

  const waterproofingTitle = selectedWaterproofingPage
    ? wpFlows[selectedWaterproofingPage.slug]?.title || wpCategories.find((category) => category.slug === selectedWaterproofingPage.slug)?.name || service.name
    : service.name;
  // A waterproofing flow (or the bathroom list) shows its own hero and title
  // bar; a service picked into the general form (preselect) keeps the
  // pop-up's header and padding like any other general booking.
  const waterproofingFlowOpen =
    service.slug === 'waterproofing' &&
    Boolean(selectedWaterproofingPage) &&
    !selectedWaterproofingPage.preselect;

  // Waterproofing opens wider once one of its flows is chosen (Pooja's flows).
  const modalMaxWidth = waterproofingFlowOpen
    ? '900px'
    : service.slug === 'electrical'
      ? '640px'
      : service.slug === 'interior-by-choice' || service.slug === 'interior-design'
        ? '800px'
        : '550px';

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
          ${service.slug === 'ac-services' ? 'booking-pop-ac-layout' : ''}
          relative
          w-full
          flex
          flex-col
          max-h-[88vh]
          h-auto
          overflow-hidden
          rounded-2xl
          bg-white
          shadow-2xl

          max-sm:h-[92vh]
          max-sm:max-h-[92vh]
          max-sm:rounded-xl
        `}
        // Painting and AC Services keep one steady height while their steps
        // change size.
        style={{
          maxWidth: modalMaxWidth,
          ...(service.slug === 'painting' || service.slug === 'ac-services'
            ? { height: '88dvh', maxHeight: '88dvh' }
            : null),
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* CLOSE BUTTON */}

        <button
          type="button"
          onClick={onClose}
          className={`
            !absolute
            !right-5
            ${hideMainHeader ? '!top-3' : '!top-5'}
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
          `}
          aria-label="Close booking modal"
        >
          ✕
        </button>

        {/* MODAL HEADER — hidden inside a Painting or POP flow, which shows
            its own title and step count (a spacer keeps the flow clear of the
            close button), and inside a waterproofing flow, whose hero sits
            right under the close button */}

        {hideMainHeader ? (
          <div className="h-14 shrink-0" aria-hidden="true" />
        ) : waterproofingFlowOpen ? null : (
        <>
        <div className="shrink-0 px-6 pt-6 pr-16">
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
            {service.slug === 'electrical' && electricalView === 'tab'
              ? getElectricalGroup(electricalTab)?.name || service.name
              : waterproofingTitle}
          </h2>
        </div>

        <div className="mt-5 mb-4 h-px shrink-0 bg-gray-200" />
        </>
        )}

        {/* MODAL SCROLL AREA */}

        <ModalFooterContext.Provider value={footerNode}>
        <div
          ref={modalScrollRef}
          className={`
            bm-scroll
            min-h-0
            flex-auto
            overflow-y-auto

            ${waterproofingFlowOpen ? '!px-0 !pb-0' : 'px-6 pb-6'}

            max-sm:flex-1

            [scrollbar-width:none]
            [&::-webkit-scrollbar]:hidden
          `}
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
                    formBack(() => setShowInteriorBooking(false));
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
                            formBack(() => setSelectedInteriorDesign(null));

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
                            <img loading="lazy" decoding="async"
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
                        formBack(() => {
                          setSelectedInteriorSpace(null);
                          setSelectedInteriorDesign(null);
                        });

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
                    {/* <div
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
                    </div> */}

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
                              border
                              border-gray-200
                              bg-white
                              text-left
                              shadow-sm
                              transition
                              hover:-translate-y-1
                              hover:shadow-lg
                            "
                          >
                            <img loading="lazy" decoding="async"
                              src={space.image}
                              alt={space.name}
                              className="
                                h-[170px]
                                w-full
                                object-cover

                                transition
                                duration-300

                                group-hover:scale-105
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
            showCustomInteriorDesign ? (
              <InteriorDesignCustomFlow
                initialRequirements={customInteriorRequirements}
                onDraftChange={setCustomInteriorRequirements}
                onBack={() => {
                  formBack(() => setShowCustomInteriorDesign(false));
                  scrollModalToTop();
                }}
                onContinue={(requirements) => {
                  setCustomInteriorRequirements(requirements);
                  setShowCustomInteriorDesign(false);
                  setShowCustomInteriorDetails(true);
                  scrollModalToTop();
                }}
              />
            ) : showCustomInteriorDetails ? (
              <InteriorDesignFlow
                modal={true}
                startAtDetails={true}
                customRequirements={customInteriorRequirements}
                onBackToCatalogue={() => {
                  formBack(() => {
                    setShowCustomInteriorDetails(false);
                    setShowCustomInteriorDesign(true);
                  });
                  scrollModalToTop();
                }}
                onStepChange={scrollModalToTop}
              />
            ) : selectedInteriorDesignProject ? (
              <InteriorDesignFlow
                modal={true}
                categorySlug={selectedInteriorDesignCategory}
                projectSlug={selectedInteriorDesignProject}
                onBackToCatalogue={() => {
                  formBack(() => setSelectedInteriorDesignProject(null));
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
                  formBack(() => {
                    setSelectedInteriorDesignCategory(null);
                    setSelectedInteriorDesignProject(null);
                  });
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
                  setShowCustomInteriorDesign(true);
                  scrollModalToTop();
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
                    formBack(() => setSelectedPaintingFlow(null));
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
                  formBack(() => {
                    setSelectedPlumbingTab(null);
                    setPlumbingView('category');
                  });
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
                  formBack(() => setPlumbingView(selectedPlumbingTab ? 'tab' : 'category'));
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
                  formBack(() => setPlumbingView('cart'));
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
                  formBack(() => setPlumbingView('category'));
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
                  formBack(() => {
                    setSelectedPlumbingConsultation(null);
                    setPlumbingView('consultations');
                  });
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
          ) : service.slug === 'waterproofing' && selectedWaterproofingPage?.slug === 'bathroom' ? (
            <div className="painting-modal-scope waterproofing-modal-scope">
              <WaterproofingBathroom
                modal={true}
                onBackToCategories={backToWaterproofingCategories}
                onSelectService={openWaterproofingService}
              />
            </div>
          ) : service.slug === 'waterproofing' && selectedWaterproofingPage && selectedWaterproofingPage.slug !== 'waterproofing' ? (
            <div className="painting-modal-scope waterproofing-modal-scope">
              <WaterproofingFlow
                modal={true}
                flowSlug={selectedWaterproofingPage.slug}
                onBackToCategories={backToWaterproofingCategories}
                onStepChange={scrollModalToTop}
              />
            </div>
          ) : service.slug === 'waterproofing' && selectedWaterproofingPage?.preselect ? (
            <ServiceBooking
              serviceSlug="waterproofing"
              preselectOption={selectedWaterproofingPage.preselect}
              modal={true}
              onClose={onClose}
              onStepChange={scrollModalToTop}
            />
          ) : service.slug === 'pop-ceiling-design' ? (
            <div className="painting-modal-scope">
              {selectedPopFlow ? (
                <PopCeilingFlow
                  modal={true}
                  flowSlug={selectedPopFlow}
                  onBackToCategories={() => {
                    formBack(() => setSelectedPopFlow(null));
                    scrollModalToTop();
                  }}
                  onStepChange={scrollModalToTop}
                />
              ) : (
                <PopCeilingCategory
                  modal={true}
                  onSelectFlow={(flowSlug) => {
                    setSelectedPopFlow(flowSlug);
                    scrollModalToTop();
                  }}
                />
              )}
            </div>
          ) : service.slug === 'electrical' ? (
            <div className="electrical-modal-scope">
            {electricalView === 'category' ? (
              <ElectricalCategory
                modal={true}
                onSelectTab={(tabSlug) => {
                  setElectricalTab(tabSlug);
                  setElectricalView('tab');
                  scrollModalToTop();
                }}
              />
            ) : electricalView === 'tab' ? (
              <ElectricalTab
                modal={true}
                tabSlug={electricalTab}
                onBackToCategories={() => {
                  formBack(() => {
                    setElectricalTab(null);
                    setElectricalView('category');
                  });
                  scrollModalToTop();
                }}
                onViewCart={() => {
                  setElectricalView('cart');
                  scrollModalToTop();
                }}
              />
            ) : electricalView === 'cart' ? (
              <ElectricalCart
                modal={true}
                onBackToServices={() => {
                  formBack(() => setElectricalView(electricalTab ? 'tab' : 'category'));
                  scrollModalToTop();
                }}
                onCheckout={() => {
                  setElectricalView('checkout');
                  scrollModalToTop();
                }}
              />
            ) : electricalView === 'checkout' ? (
              <ElectricalCheckout
                modal={true}
                onBackToCart={() => {
                  formBack(() => setElectricalView('cart'));
                  scrollModalToTop();
                }}
                onStepChange={scrollModalToTop}
                onBackToServices={() => {
                  setElectricalTab(null);
                  setElectricalView('category');
                  scrollModalToTop();
                }}
              />
            ) : null}
            </div>
          ) : service.slug === 'ac-services' ? (
            <AcServices
              modal={true}
              onClose={onClose}
              onStepChange={scrollModalToTop}
            />
          ) : (
            <ServiceBooking
              serviceSlug={service.slug}
              modal={true}
              onClose={onClose}
              onStepChange={scrollModalToTop}
              onSelectWaterproofingService={service.slug === 'waterproofing' ? openWaterproofingService : undefined}
            />
          )}
        </div>
        </ModalFooterContext.Provider>

        {/* MODAL FOOTER — filled by the current step's Back / Continue bar,
            hidden while a step has none */}

        <div ref={setFooterNode} className="bm-foot" />
      </div>
    </div>
  );
}
