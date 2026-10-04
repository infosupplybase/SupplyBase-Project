import { useCallback, useRef, useState } from 'react';

import { useLocation, useNavigate } from 'react-router-dom';

import {
  useFormBack,
  useHistoryState,
} from '../../hooks/useHistoryState';

import Icon from '../ui/Icon';

import { ModalFooterContext } from './ModalFoot';

import ServiceBooking from '../../pages/ServiceBooking';

import InteriorBooking from '../../pages/InteriorBooking';

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

import {
  interiorSpaces,
  getDesignsBySpace,
  getDesignBySlug,
  livingRoomSubOptions,
  livingRoomColorImages,
  livingRoomDescriptions,
  livingRoomFeatures,
  livingRoomGalleryImages,
  HOME_VISIT_FEE,
} from '../../data/interiorCatalog';

/**
 * Opens the "Book a service" modal, shared by every page that lets someone
 * pick a service and book it.
 */


export function useServiceBookingModal() {
  const location = useLocation();

  const navigate = useNavigate();

  const entry =
    (location.state && location.state.bookingModal) || null;

  return {
    service: entry ? entry.service : null,

    openToken: entry ? entry.base : 0,

    open: (nextService) => {
      const base =
        (window.history.state &&
          window.history.state.idx) ||
        0;

      const usr =
        (window.history.state &&
          window.history.state.usr) ||
        {};

      const {
        pathname,
        search,
        hash,
      } = window.location;

      navigate(
        {
          pathname,
          search,
          hash,
        },
        {
          state: {
            ...stripBooking(usr),

            bookingModal: {
              service: nextService,
              base,
            },

            __formPush: true,
          },
        }
      );
    },

    close: () => {
      const idx =
        window.history.state &&
        window.history.state.idx;

      const base =
        entry && entry.base;

      if (
        typeof idx === 'number' &&
        typeof base === 'number' &&
        idx > base
      ) {
        navigate(base - idx);
      } else {
        const usr =
          (window.history.state &&
            window.history.state.usr) ||
          {};

        const {
          pathname,
          search,
          hash,
        } = window.location;

        navigate(
          {
            pathname,
            search,
            hash,
          },
          {
            replace: true,
            state: stripBooking(usr),
          }
        );
      }
    },
  };
}

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

export default function ServiceBookingModal({
  service,
  onClose,
}) {
  const [
    selectedInteriorSpace,
    setSelectedInteriorSpace,
  ] = useHistoryState(
    'bm:interiorSpace',
    null,
    { push: true }
  );

  const [
    selectedInteriorDesign,
    setSelectedInteriorDesign,
  ] = useHistoryState(
    'bm:interiorDesign',
    null,
    { push: true }
  );

  const [
    selectedLivingRoomOption,
    setSelectedLivingRoomOption,
  ] = useHistoryState(
    'bm:livingRoomOption',
    null,
    { push: true }
  );

  const [
    selectedLivingRoomColor,
    setSelectedLivingRoomColor,
  ] = useHistoryState(
    'bm:livingRoomColor',
    null,
    { push: true }
  );

  const [
  isLivingRoomSaved,
  setIsLivingRoomSaved,
] = useState(false);


  const [
    showInteriorBooking,
    setShowInteriorBooking,
  ] = useHistoryState(
    'bm:interiorBooking',
    false,
    { push: true }
  );

  const [
    selectedInteriorDesignCategory,
    setSelectedInteriorDesignCategory,
  ] = useHistoryState(
    'bm:idCategory',
    null,
    { push: true }
  );

  const [
    selectedInteriorDesignProject,
    setSelectedInteriorDesignProject,
  ] = useHistoryState(
    'bm:idProject',
    null,
    { push: true }
  );

  const [
    selectedPaintingFlow,
    setSelectedPaintingFlow,
  ] = useHistoryState(
    'bm:paintingFlow',
    null,
    { push: true }
  );

  const [
    selectedPlumbingTab,
    setSelectedPlumbingTab,
  ] = useHistoryState(
    'bm:plumbingTab',
    null,
    { push: true }
  );

  const [
    plumbingView,
    setPlumbingView,
  ] = useHistoryState(
    'bm:plumbingView',
    'category',
    { push: true }
  );

  const [
    selectedPlumbingConsultation,
    setSelectedPlumbingConsultation,
  ] = useHistoryState(
    'bm:plumbingConsultation',
    null,
    { push: true }
  );

  const [
    selectedOtherService,
    setSelectedOtherService,
  ] = useHistoryState(
    'bm:otherService',
    null,
    { push: true }
  );

  const formBack = useFormBack();

  const modalScrollRef = useRef(null);

  const [footerNode, setFooterNode] =
    useState(null);

  const scrollModalToTop = useCallback(() => {
    requestAnimationFrame(() => {
      modalScrollRef.current?.scrollTo({
        top: 0,
        behavior: 'auto',
      });
    });
  }, []);

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
          ${
            service.slug === 'interior-by-choice'
              ? 'max-w-[800px]'
              : service.slug === 'interior-design'
                ? 'max-w-[800px]'
                : 'max-w-[550px]'
          }
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
        onClick={(event) =>
          event.stopPropagation()
        }
      >
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
            {service.name}
          </h2>
        </div>

        <div className="mt-1 mb-4 h-px shrink-0 bg-gray-200" />

        <ModalFooterContext.Provider
          value={footerNode}
        >
          <div
            ref={modalScrollRef}
            className="
              bm-scroll
              min-h-0
              flex-auto
              overflow-y-auto
              px-6
              pb-6
              max-sm:flex-1
              [scrollbar-width:none]
              [&::-webkit-scrollbar]:hidden
            "
          >
            {service.slug ===
            'interior-by-choice' ? (
              <>
                {showInteriorBooking ? (
                  <InteriorBooking
  modal={true}

  spaceSlug={
    selectedInteriorSpace
  }

  designSlug={
    selectedInteriorDesign
  }

  selectedPanelName={
    selectedInteriorSpace === 'living-room'
      ? selectedLivingRoomOption
      : null
  }

  selectedColorName={
    selectedInteriorSpace === 'living-room'
      ? selectedLivingRoomColor
      : null
  }

  referenceImage={
    selectedInteriorSpace === 'living-room' &&
    selectedLivingRoomOption &&
    selectedLivingRoomColor
      ? livingRoomColorImages?.[
          selectedLivingRoomOption
        ]?.[
          selectedLivingRoomColor
        ]
      : null
  }

  onBack={() => {
    formBack(() =>
      setShowInteriorBooking(
        false
      )
    );

    scrollModalToTop();
  }}

  onStepChange={
    scrollModalToTop
  }
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
                            Design details could not
                            be loaded.
                          </p>
                        );
                      }

                      return (
                        <>
                          <button
                            type="button"
                            className="
                              btn
                              btn-ghost
                              btn-sm
                              mb-4
                            "
                            onClick={() => {
                              formBack(() =>
                                setSelectedInteriorDesign(
                                  null
                                )
                              );

                              scrollModalToTop();
                            }}
                          >
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
                            <div
                              className="
                                overflow-hidden
                                rounded-xl
                              "
                            >
                              <img
                                loading="lazy"
                                decoding="async"
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
                                ₹
                                {
                                  design.pricePerSqft
                                }{' '}
                                / sq.ft.
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
                                  {
                                    design.description
                                  }
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
                                  setShowInteriorBooking(
                                    true
                                  );

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
                  <>
                    <div className="pb-2 md:pb-8">
                      {!(
                        selectedInteriorSpace ===
                          'living-room' &&
                        (selectedLivingRoomOption ||
                          selectedLivingRoomColor)
                      ) && (
                        <>
                          <button
                            type="button"
                            className="
                              btn
                              btn-ghost
                              btn-sm
                              mb-4
                            "
                            onClick={() => {
                              formBack(() => {
                                if (
                                  selectedLivingRoomColor
                                ) {
                                  setSelectedLivingRoomColor(
                                    null
                                  );
                                  return;
                                }

                                if (
                                  selectedLivingRoomOption
                                ) {
                                  setSelectedLivingRoomOption(
                                    null
                                  );
                                  return;
                                }

                                setSelectedInteriorSpace(
                                  null
                                );

                                setSelectedInteriorDesign(
                                  null
                                );
                              });

                              scrollModalToTop();
                            }}
                          >
                            BACK
                          </button>

                          <div className="ibc-filter-row">
                            {interiorSpaces.map(
                              (space) => (
                                <button
                                  key={space.slug}
                                  type="button"
                                  className={`
                                    ibc-filter-chip
                                    ${
                                      space.slug ===
                                      selectedInteriorSpace
                                        ? 'active'
                                        : ''
                                    }
                                  `}
                                  onClick={() => {
                                    setSelectedInteriorSpace(
                                      space.slug
                                    );

                                    setSelectedInteriorDesign(
                                      null
                                    );

                                    setSelectedLivingRoomOption(
                                      null
                                    );

                                    setSelectedLivingRoomColor(
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
                        </>
                      )}

                      {getDesignsBySpace(
                        selectedInteriorSpace
                      ).length === 0 ? (
                        <p className="ibc-empty">
                          More designs for this space
                          are on the way. Book a home
                          visit and our designer will
                          bring options for you.
                        </p>
                      ) : selectedInteriorSpace ===
                        'living-room' ? (

                        /*
                         * ==================================================
                         * LIVING ROOM
                         * SECOND PAGE + COLOUR PAGE
                         * ==================================================
                         */

                        selectedLivingRoomColor ? (
                          <div className="pb-2 md:pb-8">
                            {(() => {
                              const selectedDesign =
                                getDesignsBySpace(
                                  'living-room'
                                ).find(
                                  (design) =>
                                    design.name ===
                                    selectedLivingRoomOption
                                );

                              const selectedColorImage =
                                livingRoomColorImages?.[
                                  selectedLivingRoomOption
                                ]?.[
                                  selectedLivingRoomColor
                                ] ||
                                selectedDesign?.image;

                              const colorOptions =
                                livingRoomSubOptions[
                                  selectedLivingRoomOption
                                ] || [];

                              const galleryImages = [
                                selectedColorImage,
                                selectedDesign?.image,
                                selectedColorImage,
                              ].filter(Boolean);

                              return (
                                <>
                                  <div className="mb-5 flex items-center justify-between gap-3">
                                    <button
                                      type="button"
                                      className="
                                        flex
                                        h-10
                                        w-10
                                        shrink-0
                                        items-center
                                        justify-center
                                        rounded-full
                                        border
                                        border-gray-200
                                        bg-white
                                        text-gray-900
                                        shadow-sm
                                      "
                                      onClick={() => {
                                        formBack(() =>
                                          setSelectedLivingRoomColor(
                                            null
                                          )
                                        );

                                        scrollModalToTop();
                                      }}
                                      aria-label="Back to panel details"
                                    >
                                      <Icon
                                        name="arrow-left"
                                        size={21}
                                      />
                                    </button>

                                    <h3 className="flex-1 text-center text-xl font-bold text-gray-950">
                                      {
                                        selectedLivingRoomOption
                                      }
                                    </h3>

                                    <div className="flex items-center gap-2">
                                      <span
                                        className="
                                          text-2xl
                                          leading-none
                                          text-gray-900
                                        "
                                        aria-hidden="true"
                                      >
                                        ↗
                                      </span>

                                      <span
                                        className="
                                          text-3xl
                                          leading-none
                                          text-gray-900
                                        "
                                        aria-hidden="true"
                                      >
                                        ♡
                                      </span>
                                    </div>
                                  </div>

                                  <div className="mb-5">
                                    <h4 className="text-2xl font-bold text-gray-950">
                                      Choose Your Colour
                                    </h4>

                                    <p className="mt-1 text-sm leading-5 text-gray-600">
                                      Select a colour to see how it looks in your living room.
                                    </p>
                                  </div>

                                  <div
                                    className="
                                      mb-5
                                      grid
                                      grid-cols-4
                                      gap-x-3
                                      gap-y-4
                                      sm:grid-cols-4
                                    "
                                  >
                                    {colorOptions.map(
                                      (option) => {
                                        // const image =
                                        //   livingRoomColorImages?.[
                                        //     selectedLivingRoomOption
                                        //   ]?.[option] ||
                                        //   selectedDesign?.image;

                                        const active =
                                          option ===
                                          selectedLivingRoomColor;

                                        return (
                                          <button
                                            key={option}
                                            type="button"
                                            className="flex min-w-0 flex-col items-center"
                                            onClick={() => {
                                              setSelectedLivingRoomColor(
                                                option
                                              );

                                              scrollModalToTop();
                                            }}
                                          >
                                            <span
                                              className={`
                                                block
                                                h-[68px]
                                                w-[68px]
                                                overflow-hidden
                                                rounded-full
                                                border
                                                bg-gray-200
                                                bg-cover
                                                bg-center
                                                shadow-sm
                                                transition
                                                sm:h-[76px]
                                                sm:w-[76px]
                                                ${
                                                  active
                                                    ? 'border-[3px] border-[#8f5528] p-[3px]'
                                                    : 'border border-gray-200'
                                                }
                                              `}
                                              style={{
                                                backgroundColor:
                                                  {
                                                    'Natural Oak':
                                                      '#d7b083',
                                                    Teak:
                                                      '#a96532',
                                                    Walnut:
                                                      '#75411f',
                                                    Wenge:
                                                      '#2b211b',
                                                    Coffee:
                                                      '#7b5035',
                                                    'White Oak':
                                                      '#ead7bc',
                                                    'Grey Wood':
                                                      '#9b9b9b',
                                                    'Mocha Brown':
                                                      '#7a4b2d',
                                                    'Pecan Brown':
                                                      '#a66a3f',
                                                    'Marble White':
                                                      '#e9e5df',
                                                    Black:
                                                      '#202020',
                                                    White:
                                                      '#f5f5f5',
                                                    'Dark Grey':
                                                      '#555555',
                                                    'Light Grey':
                                                      '#bcbcbc',
                                                  }[option] ||
                                                  '#c9b7a4',

                                              }}
                                            >
                                             
                                            </span>

                                            <span
                                              className="
                                                mt-2
                                                line-clamp-2
                                                text-center
                                                text-xs
                                                font-medium
                                                leading-4
                                                text-gray-900
                                              "
                                            >
                                              {option}
                                            </span>
                                          </button>
                                        );
                                      }
                                    )}
                                  </div>

                                  <div
                                    className="
                                      overflow-hidden
                                      rounded-2xl
                                      bg-gray-100
                                      shadow-sm
                                    "
                                  >
                                    <img
                                      src={selectedColorImage}
                                      alt={`${selectedLivingRoomOption} - ${selectedLivingRoomColor}`}
                                      className="
                                        block
                                        h-[260px]
                                        w-full
                                        object-cover
                                        sm:h-[360px]
                                      "
                                      loading="eager"
                                      decoding="async"
                                      onError={(event) => {
                                        if (
                                          selectedDesign?.image &&
                                          !event.currentTarget
                                            .dataset
                                            .fallbackApplied
                                        ) {
                                          event.currentTarget.dataset.fallbackApplied =
                                            'true';

                                          event.currentTarget.src =
                                            selectedDesign.image;
                                        }
                                      }}
                                    />
                                  </div>

                                  <div
                                    className="
                                      relative
                                      -mt-10
                                      ml-4
                                      mb-5
                                      w-fit
                                      rounded-xl
                                      border
                                      border-gray-200
                                      bg-white
                                      px-4
                                      py-2
                                      shadow-md
                                    "
                                  >
                                    <span className="mr-2 inline-block h-7 w-7 rounded-full bg-[#c99560] align-middle" />

                                    <span className="align-middle text-sm font-semibold text-gray-900">
                                      {
                                        selectedLivingRoomColor
                                      }
                                    </span>
                                  </div>

                                  <div className="mb-6 grid grid-cols-3 gap-3">
                                    {galleryImages.map(
                                      (image, index) => (
                                        <button
                                          key={`${image}-${index}`}
                                          type="button"
                                          className="
                                            overflow-hidden
                                            rounded-xl
                                            border
                                            border-gray-200
                                            bg-gray-100
                                            shadow-sm
                                          "
                                          onClick={() => {
                                            const targetColor =
                                              index === 0
                                                ? selectedLivingRoomColor
                                                : null;

                                            if (
                                              targetColor
                                            ) {
                                              setSelectedLivingRoomColor(
                                                targetColor
                                              );
                                            }

                                            scrollModalToTop();
                                          }}
                                        >
                                          <img
                                            src={image}
                                            alt={`${selectedLivingRoomOption} preview ${index + 1}`}
                                            className="
                                              h-[86px]
                                              w-full
                                              object-cover
                                              sm:h-[105px]
                                            "
                                            loading="lazy"
                                            decoding="async"
                                            onError={(event) => {
                                              if (
                                                selectedDesign?.image &&
                                                !event.currentTarget
                                                  .dataset
                                                  .fallbackApplied
                                              ) {
                                                event.currentTarget.dataset.fallbackApplied =
                                                  'true';

                                                event.currentTarget.src =
                                                  selectedDesign.image;
                                              }
                                            }}
                                          />
                                        </button>
                                      )
                                    )}
                                  </div>

                                  <button
                                    type="button"
                                    className="
                                      btn
                                      btn-primary
                                      flex
                                      w-full
                                      items-center
                                      justify-between
                                      gap-3
                                    "
                                    onClick={() => {
                                      const selectedDesign =
                                        getDesignsBySpace(
                                          'living-room'
                                        ).find(
                                          (design) =>
                                            design.name ===
                                            selectedLivingRoomOption
                                        );

                                      if (
                                        selectedDesign?.slug
                                      ) {
                                        setSelectedInteriorDesign(
                                          selectedDesign.slug
                                        );

                                        setShowInteriorBooking(
                                          true
                                        );
                                      }

                                      scrollModalToTop();
                                    }}
                                  >
                                    <span>
                                      BOOK A ₹
                                      {HOME_VISIT_FEE}{' '}
                                      HOME VISIT
                                    </span>

                                    <span className="text-xl">
                                      →
                                    </span>
                                  </button>
                                </>
                              );
                            })()}
                          </div>
                        ) : selectedLivingRoomOption ? (
                          <div className="pb-2 md:pb-8">
                            {(() => {
                              const selectedDesign =
                                getDesignsBySpace(
                                  'living-room'
                                ).find(
                                  (design) =>
                                    design.name ===
                                    selectedLivingRoomOption
                                );

                              const heroImage =
                                selectedDesign?.image ||
                                '/assets/projects/Living_room.webp';

                              const description =
                                livingRoomDescriptions?.[
                                  selectedLivingRoomOption
                                ] ||
                                'A warm and stylish wall finish designed for modern living rooms.';

                              const gallery =
                                livingRoomGalleryImages?.[
                                  selectedLivingRoomOption
                                ] || [heroImage];

                              return (
                                <>
                                  <div className="mb-4 flex items-center justify-between gap-3">
                                    <button
                                      type="button"
                                      className="
                                        flex
                                        h-10
                                        w-10
                                        shrink-0
                                        items-center
                                        justify-center
                                        rounded-full
                                        text-gray-900
                                      "
                                      onClick={() => {
                                        formBack(() => {
                                          setSelectedLivingRoomOption(
                                            null
                                          );

                                          setSelectedLivingRoomColor(
                                            null
                                          );
                                        });

                                        scrollModalToTop();
                                      }}
                                      aria-label="Back to living room"
                                    >
                                      <Icon
                                        name="arrow-left"
                                        size={24}
                                      />
                                    </button>

                                    <h3 className="flex-1 text-center text-xl font-bold text-gray-950">
                                      {
                                        selectedLivingRoomOption
                                      }
                                    </h3>

                                    <button
  type="button"
  onClick={() =>
    setIsLivingRoomSaved(
      (previous) => !previous
    )
  }
  className="
    flex
    h-10
    w-10
    items-center
    justify-center
    rounded-full
    text-3xl
    leading-none
    transition
    duration-200
    hover:bg-gray-100
    active:scale-90
  "
  aria-label={
    isLivingRoomSaved
      ? 'Remove from saved'
      : 'Save design'
  }
>
  <span
    className={
      isLivingRoomSaved
        ? 'text-[#9A5B2D]'
        : 'text-gray-900'
    }
  >
    {isLivingRoomSaved ? '♥' : '♡'}
  </span>
</button>
                                  </div>

                                  <button
                                    type="button"
                                    className="
                                      block
                                      w-full
                                      overflow-hidden
                                      rounded-2xl
                                      bg-gray-100
                                      shadow-sm
                                    "
                                    onClick={() => {
                                      const firstColor =
                                        livingRoomSubOptions[
                                          selectedLivingRoomOption
                                        ]?.[0];

                                      if (firstColor) {
                                        setSelectedLivingRoomColor(
                                          firstColor
                                        );
                                      }

                                      scrollModalToTop();
                                    }}
                                    aria-label="Choose colour"
                                  >
                                    <img
                                      src={`${heroImage}?v=20261003`}
                                      alt={
                                        selectedLivingRoomOption
                                      }
                                      className="
                                        block
                                        h-[270px]
                                        w-full
                                        object-cover
                                        sm:h-[390px]
                                      "
                                      loading="eager"
                                      decoding="async"
                                    />
                                  </button>

                                  <div className="flex items-center justify-center gap-2 py-3">
                                    {[0, 1, 2, 3, 4].map(
                                      (dot) => (
                                        <span
                                          key={dot}
                                          className={`
                                            block
                                            h-2.5
                                            w-2.5
                                            rounded-full
                                            ${
                                              dot === 0
                                                ? 'bg-gray-900'
                                                : 'bg-gray-300'
                                            }
                                          `}
                                        />
                                      )
                                    )}
                                  </div>

                                  <div className="px-1">
                                    <h4 className="text-3xl font-bold leading-tight text-gray-950">
                                      {
                                        selectedLivingRoomOption
                                      }
                                    </h4>

                                    <p className="mt-2 text-base leading-6 text-gray-600">
                                      {description}
                                    </p>
                                  </div>

                                  <div
                                    className="
                                      mt-6
                                      grid
                                      grid-cols-4
                                      divide-x
                                      divide-gray-200
                                      border-y
                                      border-gray-100
                                      py-4
                                    "
                                  >
                                    {(
                                      livingRoomFeatures ||
                                      []
                                    ).map(
                                      (feature) => (
                                        <div
                                          key={`${feature.label}-${feature.sublabel}`}
                                          className="
                                            flex
                                            min-w-0
                                            flex-col
                                            items-center
                                            px-2
                                            text-center
                                          "
                                        >
                                          <Icon
                                            name={
                                              feature.icon
                                            }
                                            size={28}
                                          />

                                          <span className="mt-2 text-xs font-medium leading-4 text-gray-800 sm:text-sm">
                                            {feature.label}
                                            <br />
                                            {
                                              feature.sublabel
                                            }
                                          </span>
                                        </div>
                                      )
                                    )}
                                  </div>

                                  <button
  type="button"
  className="
    mt-5
    flex
    w-full
    items-center
    justify-between
    gap-3
    rounded-xl
    border
    border-[#9A5B2D]
    bg-white
    px-5
    py-4
    text-left
    transition
    duration-200
    hover:bg-[#fff8f2]
    active:scale-[0.99]
  "
  onClick={() => {
    const firstColor =
      livingRoomSubOptions[
        selectedLivingRoomOption
      ]?.[0];

    if (firstColor) {
      setSelectedLivingRoomColor(firstColor);
    }

    scrollModalToTop();
  }}
>
  <div>
    <span className="block text-base font-bold text-gray-950">
      Choose Your Colour
    </span>

    <span className="mt-1 block text-xs text-gray-500">
      Select a colour to see how it looks in your living room.
    </span>
  </div>

  <span
    className="
      flex
      h-9
      w-9
      shrink-0
      items-center
      justify-center
      rounded-full
      bg-[#9A5B2D]
      text-lg
      text-white
    "
  >
    →
  </span>
</button>

                                  <button
                                    type="button"
                                    className="
                                      btn
                                      btn-primary
                                      mt-5
                                      flex
                                      w-full
                                      items-center
                                      justify-between
                                      gap-3
                                    "
                                    onClick={() => {
                                      if (
                                        selectedDesign?.slug
                                      ) {
                                        setSelectedInteriorDesign(
                                          selectedDesign.slug
                                        );

                                        setShowInteriorBooking(
                                          true
                                        );
                                      }

                                      scrollModalToTop();
                                    }}
                                  >
                                    <span>
                                      BOOK A ₹
                                      {HOME_VISIT_FEE}{' '}
                                      HOME VISIT
                                    </span>

                                    <span className="text-xl">
                                      →
                                    </span>
                                  </button>
                                </>
                              );
                            })()}
                          </div>
                        ) : (
                          <div className="living-room-options">
                            {getDesignsBySpace(
                              selectedInteriorSpace
                            ).map(
                              (design) => (
                                <button
                                  key={design.slug}
                                  type="button"
                                  className="
                                    living-room-option-card
                                  "
                                  onClick={() => {
                                    if (
                                      selectedInteriorSpace ===
                                        'living-room' &&
                                      livingRoomSubOptions[
                                        design.name
                                      ]
                                    ) {
                                      setSelectedLivingRoomOption(
                                        design.name
                                      );

                                      setSelectedLivingRoomColor(
                                        null
                                      );

                                      scrollModalToTop();

                                      return;
                                    }

                                    setSelectedInteriorDesign(
                                      design.slug
                                    );

                                    scrollModalToTop();
                                  }}
                                >
                                  <div className="living-room-option-image">
                                    <img
                                      src={`${design.image}?v=20260930`}
                                      alt={design.name}
                                      loading="eager"
                                      decoding="async"
                                    />
                                  </div>

                                  <div className="living-room-option-content">
                                    <strong>
                                      {design.name}
                                    </strong>

                                    <span>
                                      {design.slug ===
                                      'fluted-panel'
                                        ? 'Modern vertical lines for a stylish look'
                                        : design.slug ===
                                          'wooden-panel'
                                          ? 'Warm wood finish for a rich look'
                                          : design.slug ===
                                            'marble-and-fluted-panel'
                                            ? 'Marble with fluted panels for a premium look'
                                            : design.slug ===
                                              'plain-panel'
                                              ? 'Simple and clean wall design'
                                              : 'Unique patterns for a modern look'}
                                    </span>
                                  </div>

                                  <span className="living-room-option-arrow">
                                    <Icon
                                      name="arrow-right"
                                      size={18}
                                    />
                                  </span>
                                </button>
                              )
                            )}
                          </div>
                        )
                      ) : (
                        <div className="ibc-design-grid">
                          {getDesignsBySpace(
                            selectedInteriorSpace
                          ).map(
                            (design) => (
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
                                    decoding="async"
                                    onError={(event) => {
                                      event.currentTarget.onerror =
                                        null;

                                      const currentSpace =
                                        interiorSpaces.find(
                                          (item) =>
                                            item.slug ===
                                            selectedInteriorSpace
                                        );

                                      if (
                                        currentSpace
                                      ) {
                                        event.currentTarget.src =
                                          currentSpace.image;
                                      }
                                    }}
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
                                    ₹
                                    {
                                      design.pricePerSqft
                                    }{' '}
                                    / sq.ft.
                                  </span>
                                </button>
                              </div>
                            )
                          )}
                        </div>
                      )}

                      {!selectedLivingRoomOption &&
                        !selectedLivingRoomColor && (
                          <button
                            type="button"
                            className="
                              btn
                              btn-primary
                              ibc-customise-cta
                            "
                            onClick={() => {
                              setSelectedInteriorDesign(
                                null
                              );

                              setShowInteriorBooking(
                                true
                              );

                              scrollModalToTop();
                            }}
                          >
                            Customise Your Design
                          </button>
                        )}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="pb-2 md:pb-8">
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
                          grid-cols-2
                          gap-4
                          sm:grid-cols-3
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

                                setSelectedLivingRoomOption(
                                  null
                                );

                                setSelectedLivingRoomColor(
                                  null
                                );

                                scrollModalToTop();
                              }}
                              className="
                                group
                                relative
                                aspect-square
                                w-full
                                overflow-hidden
                                rounded-xl
                                text-left
                              "
                            >
                              <img
                                loading="lazy"
                                decoding="async"
                                src={space.image}
                                alt={space.name}
                                className="
                                  absolute
                                  inset-0
                                  h-full
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
                                  bottom-2
                                  left-3
                                  text-sm
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
            ) : service.slug ===
              'interior-design' ? (
              selectedInteriorDesignProject ? (
                <InteriorDesignFlow
                  modal={true}
                  categorySlug={
                    selectedInteriorDesignCategory
                  }
                  projectSlug={
                    selectedInteriorDesignProject
                  }
                  onBackToCatalogue={() => {
                    formBack(() =>
                      setSelectedInteriorDesignProject(
                        null
                      )
                    );

                    scrollModalToTop();
                  }}
                  onStepChange={
                    scrollModalToTop
                  }
                />
              ) : selectedInteriorDesignCategory ? (
                <InteriorDesignCatalogue
                  modal={true}
                  categorySlug={
                    selectedInteriorDesignCategory
                  }
                  onSelectProject={(projectSlug) => {
                    setSelectedInteriorDesignProject(
                      projectSlug
                    );

                    scrollModalToTop();
                  }}
                  onBack={() => {
                    formBack(() => {
                      setSelectedInteriorDesignCategory(
                        null
                      );

                      setSelectedInteriorDesignProject(
                        null
                      );
                    });

                    scrollModalToTop();
                  }}
                />
              ) : (
                <InteriorDesignCategory
                  modal={true}
                  onSelectCategory={(categorySlug) => {
                    setSelectedInteriorDesignCategory(
                      categorySlug
                    );

                    setSelectedInteriorDesignProject(
                      null
                    );

                    scrollModalToTop();
                  }}
                  onCustom={() => {
                    console.log(
                      'Custom interior design'
                    );
                  }}
                />
              )
            ) : service.slug === 'painting' ? (
              selectedPaintingFlow ? (
                <div className="painting-modal-scope">
                  <PaintingFlow
                    modal={true}
                    flowSlug={
                      selectedPaintingFlow
                    }
                    onBackToCategories={() => {
                      formBack(() =>
                        setSelectedPaintingFlow(
                          null
                        )
                      );

                      scrollModalToTop();
                    }}
                    onStepChange={
                      scrollModalToTop
                    }
                  />
                </div>
              ) : (
                <div className="painting-modal-scope">
                  <PaintingCategory
                    modal={true}
                    onSelectFlow={(flowSlug) => {
                      setSelectedPaintingFlow(
                        flowSlug
                      );

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
                      setSelectedPlumbingTab(
                        tabSlug
                      );

                      setPlumbingView('tab');

                      scrollModalToTop();
                    }}
                    onSelectConsultation={() => {
                      setSelectedPlumbingConsultation(
                        null
                      );

                      setPlumbingView(
                        'consultations'
                      );

                      scrollModalToTop();
                    }}
                  />
                ) : plumbingView === 'tab' ? (
                  <PlumbingTab
                    modal={true}
                    tabSlug={
                      selectedPlumbingTab
                    }
                    onBackToCategories={() => {
                      formBack(() => {
                        setSelectedPlumbingTab(
                          null
                        );

                        setPlumbingView(
                          'category'
                        );
                      });

                      scrollModalToTop();
                    }}
                    onOpenConsultation={() => {
                      setSelectedPlumbingConsultation(
                        null
                      );

                      setPlumbingView(
                        'consultations'
                      );

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
                          selectedPlumbingTab
                            ? 'tab'
                            : 'category'
                        )
                      );

                      scrollModalToTop();
                    }}
                    onCheckout={() => {
                      setPlumbingView(
                        'checkout'
                      );

                      scrollModalToTop();
                    }}
                  />
                ) : plumbingView === 'checkout' ? (
                  <PlumbingCheckout
                    modal={true}
                    onBackToCart={() => {
                      formBack(() =>
                        setPlumbingView('cart')
                      );

                      scrollModalToTop();
                    }}
                    onStepChange={
                      scrollModalToTop
                    }
                    onBackToServices={() => {
                      setSelectedPlumbingTab(
                        null
                      );

                      setPlumbingView(
                        'category'
                      );

                      scrollModalToTop();
                    }}
                  />
                ) : plumbingView ===
                  'consultations' ? (
                  <PlumbingConsultationList
                    modal={true}
                    onBackToCategories={() => {
                      formBack(() =>
                        setPlumbingView(
                          'category'
                        )
                      );

                      scrollModalToTop();
                    }}
                    onSelectConsultationType={(
                      typeSlug
                    ) => {
                      setSelectedPlumbingConsultation(
                        typeSlug
                      );

                      setPlumbingView(
                        'consultation-book'
                      );

                      scrollModalToTop();
                    }}
                  />
                ) : plumbingView ===
                  'consultation-book' ? (
                  <PlumbingConsultationBook
                    modal={true}
                    typeSlug={
                      selectedPlumbingConsultation
                    }
                    onBackToConsultations={() => {
                      formBack(() => {
                        setSelectedPlumbingConsultation(
                          null
                        );

                        setPlumbingView(
                          'consultations'
                        );
                      });

                      scrollModalToTop();
                    }}
                    onStepChange={
                      scrollModalToTop
                    }
                    onBackToServices={() => {
                      setSelectedPlumbingConsultation(
                        null
                      );

                      setPlumbingView(
                        'category'
                      );

                      scrollModalToTop();
                    }}
                  />
                ) : null}
              </div>
            ) : service.slug ===
              'other-services' ? (
              selectedOtherService ? (
                <ServiceBooking
                  serviceSlug={
                    selectedOtherService
                  }
                  modal={true}
                  onClose={onClose}
                  onStepChange={
                    scrollModalToTop
                  }
                />
              ) : (
                <OtherServicesCategory
                  modal={true}
                  onSelectService={(serviceSlug) => {
                    setSelectedOtherService(
                      serviceSlug
                    );

                    scrollModalToTop();
                  }}
                />
              )
            ) : (
              <ServiceBooking
                serviceSlug={service.slug}
                modal={true}
                onClose={onClose}
                onStepChange={
                  scrollModalToTop
                }
              />
            )}
          </div>
        </ModalFooterContext.Provider>

        <div
          ref={setFooterNode}
          className="bm-foot"
        />
      </div>
    </div>
  );
}