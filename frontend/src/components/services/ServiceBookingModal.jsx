import { useCallback, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  useFormBack,
  useHistoryState,
} from '../../hooks/useHistoryState';
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
import OtherServicesCategory from '../../pages/OtherServicesCategory';

function stripBooking(usr) {
  const out = {};

  Object.keys(usr).forEach((key) => {
    if (
      key !== 'bookingModal' &&
      key !== '__formPush' &&
      !key.startsWith('bm:') &&
      !key.startsWith('f:')
    ) {
      out[key] = usr[key];
    }
  });

  return out;
}

export function useServiceBookingModal() {
  const location = useLocation();
  const navigate = useNavigate();
  const entry = location.state?.bookingModal || null;

  return {
    service: entry ? entry.service : null,
    openToken: entry ? entry.base : 0,

    open: (nextService) => {
      const base = window.history.state?.idx || 0;
      const usr = window.history.state?.usr || {};
      const { pathname, search, hash } = window.location;

      navigate(
        { pathname, search, hash },
        {
          state: {
            ...stripBooking(usr),
            bookingModal: { service: nextService, base },
            __formPush: true,
          },
        }
      );
    },

    close: () => {
      const idx = window.history.state?.idx;
      const base = entry?.base;

      if (
        typeof idx === 'number' &&
        typeof base === 'number' &&
        idx > base
      ) {
        navigate(base - idx);
      } else {
        const usr = window.history.state?.usr || {};
        const { pathname, search, hash } = window.location;

        navigate(
          { pathname, search, hash },
          {
            replace: true,
            state: stripBooking(usr),
          }
        );
      }
    },
  };
}

export default function ServiceBookingModal({ service, onClose }) {
  const [selectedInteriorSpace, setSelectedInteriorSpace] =
    useHistoryState('bm:interiorSpace', null, { push: true });

  const [selectedInteriorDesign, setSelectedInteriorDesign] =
    useHistoryState('bm:interiorDesign', null, { push: true });

  const [showInteriorBooking, setShowInteriorBooking] =
    useHistoryState('bm:interiorBooking', false, { push: true });

  const [selectedInteriorDesignCategory, setSelectedInteriorDesignCategory] =
    useHistoryState('bm:idCategory', null, { push: true });

  const [selectedInteriorDesignProject, setSelectedInteriorDesignProject] =
    useHistoryState('bm:idProject', null, { push: true });

  const [selectedPaintingFlow, setSelectedPaintingFlow] =
    useHistoryState('bm:paintingFlow', null, { push: true });

  const [selectedPopFlow, setSelectedPopFlow] =
    useHistoryState('bm:popFlow', null, { push: true });

  const [selectedPlumbingTab, setSelectedPlumbingTab] =
    useHistoryState('bm:plumbingTab', null, { push: true });

  const [plumbingView, setPlumbingView] =
    useHistoryState('bm:plumbingView', 'category', { push: true });

  const [selectedPlumbingConsultation, setSelectedPlumbingConsultation] =
    useHistoryState('bm:plumbingConsultation', null, { push: true });

  const [selectedOtherService, setSelectedOtherService] =
    useHistoryState('bm:otherService', null, { push: true });

  const formBack = useFormBack();
  const modalScrollRef = useRef(null);
  const [footerNode, setFooterNode] = useState(null);

  const scrollModalToTop = useCallback(() => {
    requestAnimationFrame(() => {
      modalScrollRef.current?.scrollTo({
        top: 0,
        behavior: 'auto',
      });
    });
  }, []);

  if (!service) return null;

  const hideMainHeader =
    (service.slug === 'painting' && Boolean(selectedPaintingFlow)) ||
    (service.slug === 'pop-ceiling-design' && Boolean(selectedPopFlow));

  const wideModal =
    service.slug === 'interior-by-choice' ||
    service.slug === 'interior-design';

  return (
    <div
      className="
        fixed inset-0 z-[2000] flex items-center justify-center
        bg-black/65 backdrop-blur-[3px] p-4
      "
      onClick={onClose}
    >
      <div
        className={`
          relative w-full
          ${wideModal ? 'max-w-[1000px]' : 'max-w-[550px]'}
          flex flex-col max-h-[88vh] h-auto overflow-hidden
          rounded-2xl bg-white shadow-2xl
          max-sm:h-[92vh] max-sm:max-h-[92vh] max-sm:rounded-xl
        `}
        style={
          service.slug === 'painting'
            ? { height: '88dvh', maxHeight: '88dvh' }
            : undefined
        }
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className={`
            !absolute !right-5 !z-50 !flex !h-10 !w-10
            !items-center !justify-center !rounded-full !border
            !border-gray-200 !bg-white !text-xl !text-gray-700
            !shadow-sm transition hover:!bg-gray-100
            ${hideMainHeader ? '!top-3' : '!top-5'}
          `}
          aria-label="Close booking modal"
        >
          ✕
        </button>

        {hideMainHeader ? (
          <div className="h-14 shrink-0" aria-hidden="true" />
        ) : (
          <>
            <div className="shrink-0 px-6 pt-6 pr-16">
              <p className="mb-1 text-sm font-semibold uppercase tracking-[0.16em] text-amber-500">
                Book a service
              </p>

              <h2 className="text-2xl font-bold text-gray-950">
                {service.name}
              </h2>
            </div>

            <div className="mt-5 mb-4 h-px shrink-0 bg-gray-200" />
          </>
        )}

        <ModalFooterContext.Provider value={footerNode}>
          <div
            ref={modalScrollRef}
            className="
              bm-scroll min-h-0 flex-auto overflow-y-auto px-6 pb-6
              max-sm:flex-1 [scrollbar-width:none]
              [&::-webkit-scrollbar]:hidden
            "
          >
            {service.slug === 'interior-by-choice' ? (
              <>
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
                ) : selectedInteriorSpace && selectedInteriorDesign ? (
                  <div className="pb-2 md:pb-8">
                    {(() => {
                      const design = getDesignBySlug(
                        selectedInteriorSpace,
                        selectedInteriorDesign
                      );

                      const space = interiorSpaces.find(
                        (item) => item.slug === selectedInteriorSpace
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
                              formBack(() =>
                                setSelectedInteriorDesign(null)
                              );
                              scrollModalToTop();
                            }}
                          >
                            BACK
                          </button>

                          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            <div className="overflow-hidden rounded-xl">
                              <img
                                loading="lazy"
                                decoding="async"
                                src={design.image}
                                alt={design.name}
                                className="h-auto max-h-[420px] w-full object-cover"
                              />
                            </div>

                            <div>
                              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-600">
                                {space?.name}
                              </p>

                              <h3 className="mt-2 text-2xl font-bold text-gray-950">
                                {design.name}
                              </h3>

                              {design.tagline && (
                                <p className="mt-2 text-sm leading-6 text-gray-500">
                                  {design.tagline}
                                </p>
                              )}

                              <p className="mt-3 text-lg font-semibold text-gray-900">
                                ₹{design.pricePerSqft} / sq.ft.
                              </p>

                              {design.description && (
                                <p className="mt-4 text-sm leading-6 text-gray-600">
                                  {design.description}
                                </p>
                              )}

                              <button
                                type="button"
                                className="btn btn-primary mt-6 w-full md:w-auto"
                                onClick={() => {
                                  setShowInteriorBooking(true);
                                  scrollModalToTop();
                                }}
                              >
                                CUSTOMISE THIS DESIGN
                              </button>
                            </div>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                ) : selectedInteriorSpace ? (
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
                      BACK
                    </button>

                    <div className="ibc-filter-row">
                      {interiorSpaces.map((space) => (
                        <button
                          key={space.slug}
                          type="button"
                          className={`ibc-filter-chip ${
                            space.slug === selectedInteriorSpace
                              ? 'active'
                              : ''
                          }`}
                          onClick={() => {
                            setSelectedInteriorSpace(space.slug);
                            setSelectedInteriorDesign(null);
                            scrollModalToTop();
                          }}
                        >
                          {space.name}
                        </button>
                      ))}
                    </div>

                    {getDesignsBySpace(selectedInteriorSpace).length === 0 ? (
                      <p className="ibc-empty">
                        More designs for this space are on the way.
                        Book a home visit and our designer will bring
                        options for you.
                      </p>
                    ) : (
                      <div className="ibc-design-grid">
                        {getDesignsBySpace(selectedInteriorSpace).map(
                          (design) => (
                            <div
                              key={design.slug}
                              className="ibc-design-card"
                            >
                              <button
                                type="button"
                                className="ibc-design-media !block !w-full !border-0 !p-0"
                                onClick={() => {
                                  setSelectedInteriorDesign(design.slug);
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
                                className="ibc-design-body !w-full !border-0 !text-left"
                                onClick={() => {
                                  setSelectedInteriorDesign(design.slug);
                                  scrollModalToTop();
                                }}
                              >
                                <span className="ibc-design-name">
                                  {design.name}
                                </span>
                                <span className="ibc-design-price">
                                  ₹{design.pricePerSqft} / sq.ft.
                                </span>
                              </button>
                            </div>
                          )
                        )}
                      </div>
                    )}

                    <button
                      type="button"
                      className="btn btn-primary ibc-customise-cta"
                      onClick={() => {
                        setSelectedInteriorDesign(null);
                        setShowInteriorBooking(true);
                        scrollModalToTop();
                      }}
                    >
                      Customise Your Design
                    </button>
                  </div>
                ) : (
                  <div className="pb-2 md:pb-8">
                    <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4">
                      <p className="text-sm font-semibold text-gray-900">
                        Book a Home Visit at just ₹{HOME_VISIT_FEE}
                      </p>
                      <p className="mt-1 text-sm leading-6 text-gray-600">
                        Get expert advice, measurement and a custom
                        design as per your choice.
                      </p>
                    </div>

                    <h3 className="mb-4 text-lg font-bold text-gray-950">
                      Choose Your Space
                    </h3>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      {interiorSpaces.map((space) => (
                        <button
                          key={space.slug}
                          type="button"
                          onClick={() => {
                            setSelectedInteriorSpace(space.slug);
                            setSelectedInteriorDesign(null);
                            scrollModalToTop();
                          }}
                          className="
                            group relative overflow-hidden rounded-xl
                            border border-gray-200 bg-white text-left shadow-sm
                            transition hover:-translate-y-1 hover:shadow-lg
                          "
                        >
                          <img
                            src={space.image}
                            alt={space.name}
                            loading="lazy"
                            className="h-[170px] w-full object-cover transition duration-300 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                          <span className="absolute bottom-3 left-4 text-base font-semibold text-white">
                            {space.name}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : service.slug === 'interior-design' ? (
              selectedInteriorDesignProject ? (
                <InteriorDesignFlow
                  modal={true}
                  categorySlug={selectedInteriorDesignCategory}
                  projectSlug={selectedInteriorDesignProject}
                  onBackToCatalogue={() => {
                    formBack(() =>
                      setSelectedInteriorDesignProject(null)
                    );
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
                    console.log('Custom interior design');
                  }}
                />
              )
            ) : service.slug === 'painting' ? (
              <div className="painting-modal-scope">
                {selectedPaintingFlow ? (
                  <PaintingFlow
                    modal={true}
                    flowSlug={selectedPaintingFlow}
                    onBackToCategories={() => {
                      formBack(() => setSelectedPaintingFlow(null));
                      scrollModalToTop();
                    }}
                    onStepChange={scrollModalToTop}
                  />
                ) : (
                  <PaintingCategory
                    modal={true}
                    onSelectFlow={(flowSlug) => {
                      setSelectedPaintingFlow(flowSlug);
                      scrollModalToTop();
                    }}
                  />
                )}
              </div>
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
                      formBack(() =>
                        setPlumbingView(
                          selectedPlumbingTab ? 'tab' : 'category'
                        )
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
                      formBack(() => {
                        setSelectedPlumbingConsultation(null);
                        setPlumbingView('category');
                      });
                      scrollModalToTop();
                    }}
                    onSelectType={(typeSlug) => {
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
            ) : (
              <ServiceBooking
                serviceSlug={service.slug}
                modal={true}
                onClose={onClose}
                onStepChange={scrollModalToTop}
              />
            )}
          </div>
        </ModalFooterContext.Provider>

        <div ref={setFooterNode} className="bm-foot" />
      </div>
    </div>
  );
}