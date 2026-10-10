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
  getIncludedItems,
  livingRoomSubOptions,
  livingRoomColorImages,
  livingRoomDescriptions,
  livingRoomFeatures,
  livingRoomGalleryImages,
  mandirImages,
  mandirDescriptions,
  mandirGroups,

  HOME_VISIT_FEE,
  interiorFeatures,
} from '../../data/interiorCatalog';
import InteriorDesignCategory from '../../pages/InteriorDesignCategory';
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
import AcServices from '../../pages/AcServices';

import WaterproofingFlow from '../../pages/WaterproofingFlow';
import WaterproofingBathroom from '../../pages/WaterproofingBathroom';
import { wpFlows, wpCategories } from '../../data/waterproofingContent';

import ElectricalCategory from '../../pages/ElectricalCategory';
import ElectricalTab from '../../pages/ElectricalTab';
import ElectricalCart from '../../pages/ElectricalCart';
import ElectricalCheckout from '../../pages/ElectricalCheckout';
import { getElectricalGroup } from '../../data/electricalContent';
import DesignViewer from './DesignViewer';

/* =========================================================
   "WHAT'S INCLUDED" ICONS (inline SVG, no Icon-name lookup)
   Icons match the reference design: slats, marble layers,
   sun (LED), drawer cabinet, sparkles, wrench + screwdriver.
   ========================================================= */

const includedIconPaths = {
  slat: <path d="M6 4v16M10 4v16M14 4v16M18 4v16" />,
  marble: (<><path d="M12 3l9 4.5-9 4.5-9-4.5z" /><path d="M3 12l9 4.5 9-4.5" /><path d="M3 16.5L12 21l9-4.5" /></>),
  led: (<><circle cx="12" cy="12" r="4" /><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8" /></>),
  cabinet: (<><rect x="3" y="7" width="18" height="11" rx="2" /><path d="M3 12.5h18M10 15h4M7 18v2M17 18v2" /></>),
  tv: (<><rect x="3" y="7" width="18" height="11" rx="2" /><path d="M3 12.5h18M10 15h4M7 18v2M17 18v2" /></>),
  shelf: (<><rect x="3" y="7" width="18" height="11" rx="2" /><path d="M3 12.5h18M10 15h4M7 18v2M17 18v2" /></>),
  install: (<><path d="M14.5 6.5a4 4 0 0 0-5 5L4 17l3 3 5.5-5.5a4 4 0 0 0 5-5l-2.5 2.5-2.5-.5-.5-2.5z" /><path d="M15 15l5 5M19 3l2 2-5 5" /></>),
  sparkle: (<><path d="M9 4l1.6 4.4L15 10l-4.4 1.6L9 16l-1.6-4.4L3 10l4.4-1.6z" /><path d="M18 13l.9 2.1L21 16l-2.1.9L18 19l-.9-2.1L15 16l2.1-.9z" /></>),
  sconce: <path d="M9 4h6v9a3 3 0 0 1-6 0zM12 16v4" />,
  finish: (<><path d="M9 4l1.6 4.4L15 10l-4.4 1.6L9 16l-1.6-4.4L3 10l4.4-1.6z" /><path d="M18 13l.9 2.1L21 16l-2.1.9L18 19l-.9-2.1L15 16l2.1-.9z" /></>),
  consult: (<><circle cx="12" cy="8" r="3.5" /><path d="M5 20c0-4 3-6 7-6s7 2 7 6" /></>),
  fire: <path d="M12 3c1 4 5 5 5 10a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3-1-5 1-9z" />,

  // Study designs
  desk: <path d="M3 9h18M5 9v11M19 9v11M9 9v6h6V9" />,
  shelves: (<><path d="M5 3v18M19 3v18" /><path d="M5 8h14M5 13h14M5 18h14" /></>),
  bulb: (<><path d="M9 18h6M10 21h4" /><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z" /></>),
  door: (<><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M12 3v18M9 12v2M15 12v2" /></>),
  glass: (<><rect x="6" y="3" width="12" height="18" rx="1.5" /><path d="M10 7l4-2M10 12l4-4" /></>),
};

/* Photo for each "What's Included" item, keyed by the item's icon name.
   Put these files in  public/assets/included/
   (A design that supplies its own photo, like the Study designs, uses that instead.) */
const includedImages = {
  slat: '/assets/included/slat.webp',
  marble: '/assets/included/marble.webp',
  led: '/assets/included/led.webp',
  cabinet: '/assets/included/cabinet.webp',
  tv: '/assets/included/cabinet.webp',
  shelf: '/assets/included/cabinet.webp',
  sparkle: '/assets/included/finish.webp',
  finish: '/assets/included/finish.webp',
  install: '/assets/included/install.webp',
};

function IncludedIcon({ name }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="22"
      height="22"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {includedIconPaths[name] || includedIconPaths.finish}
    </svg>
  );
}


/* One "What's Included" item: photo on the left, icon + title + description
   on the right. The photo is hidden if its file fails to load. */
function IncludedCard({ item }) {
  const [showImage, setShowImage] = useState(true);
  const imageSrc = item.customImage || includedImages[item.icon] || item.image;

  return (
    <div className="flex items-center gap-3 rounded-xl bg-[#faf7f3] p-3">
      {showImage && imageSrc && (
        <img
          src={imageSrc}
          alt={item.title}
          className="block h-24! w-24! shrink-0 rounded-xl object-cover"
          loading="lazy"
          decoding="async"
          onError={() => setShowImage(false)}
        />
      )}

      <div className="min-w-0 flex-1">
        <span className="text-[#9A5B2D]">
          <IncludedIcon name={item.icon} />
        </span>

        <p className="mt-1 text-sm font-semibold leading-5 text-gray-950">
          {item.title}
        </p>

        <p className="mt-0.5 text-xs leading-5 text-gray-600">
          {item.desc}
        </p>
      </div>
    </div>
  );
}

/**
 * The "Book a service" modal's content: the booking flow for the chosen
 * service. Opened and closed with useServiceBookingModal (its own file, so the
 * pages that show service tiles do not have to load this whole component
 * until someone actually opens a booking).
 */
export default function ServiceBookingModal({ service, onClose }) {
  const [selectedInteriorSpace, setSelectedInteriorSpace] = useHistoryState('bm:interiorSpace', null, { push: true });
  const [selectedInteriorDesign, setSelectedInteriorDesign] = useHistoryState('bm:interiorDesign', null, { push: true });
  const [selectedLivingRoomOption, setSelectedLivingRoomOption] = useHistoryState('bm:livingRoomOption', null, { push: true });
  const [selectedLivingRoomColor, setSelectedLivingRoomColor] = useHistoryState('bm:livingRoomColor', null, { push: true });
  const [isLivingRoomSaved, setIsLivingRoomSaved] = useState(false);
  // Full-screen viewer for a design's Front / Side / Detail views (index or null).
  const [viewerIndex, setViewerIndex] = useState(null);
  // Full-screen viewer for the Study list: { name, fallback, views, index } or null.
  const [studyViewer, setStudyViewer] = useState(null);
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
  const interiorDesignFlowOpen =
    service.slug === 'interior-design' &&
    Boolean(selectedInteriorDesignCategory);

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
        max-sm:p-2.5
      "
      onClick={onClose}
    >
      <div
        className={`
          ${service.slug === 'ac-services' ? 'booking-pop-ac-layout' : ''}
          ${interiorDesignFlowOpen ? 'booking-interior-flow-layout' : ''}
          ${service.slug === 'pop-ceiling-design' ? 'booking-pop-ceiling-layout' : ''}
          ${service.slug === 'waterproofing' ? 'booking-pop-waterproofing-layout' : ''}
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
          ...(service.slug === 'painting' || service.slug === 'ac-services' || service.slug === 'waterproofing'
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
            ${interiorDesignFlowOpen ? '!top-2' : hideMainHeader ? '!top-3' : '!top-5'}
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

        {interiorDesignFlowOpen ? null : hideMainHeader ? (
          service.slug === 'ac-services' ? null : (
            <div className="h-14 shrink-0" aria-hidden="true" />
          )
        ) : waterproofingFlowOpen ? null : (
        <>
        <div className="shrink-0 px-6 pt-6 pr-16 max-sm:px-4 max-sm:pr-16">
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

            ${waterproofingFlowOpen ? '!px-0 !pb-0' : 'px-6 pb-6 max-sm:px-4'}

            max-sm:flex-1

            [scrollbar-width:none]
            [&::-webkit-scrollbar]:hidden
          `}
        >
          {service.slug === 'interior-by-choice' ? (
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

                    // Front / Side / Detail views — TV wall designs only.
                    // Side and detail photos sit next to the main photo:
                    //   tv-wall/1.webp  ->  1-side.webp, 1-detail.webp
                    // A missing file falls back to the front photo.
                    
const isTvWall = design.spaceSlug === 'tv-wall';
const isStudy = design.spaceSlug === 'study';

const details = isStudy
  ? design.studyDetails
  : isTvWall
    ? design.tvDetails
    : null;

const studyGallery = design.galleryImages || {};

const designViews = isStudy
  ? [
      {
        label: 'Front View',
        src: studyGallery.front || design.image,
      },
      {
        label: 'Side View',
        src: studyGallery.side || design.image,
      },
      {
        label: 'Detail View',
        src: studyGallery.detail || design.image,
      },
    ]
  : isTvWall
    ? [
        {
          label: 'Front View',
          src: design.image,
        },
        {
          label: 'Side View',
          src: design.image.replace(/\.webp$/, '-side.webp'),
        },
        {
          label: 'Detail View',
          src: design.image.replace(/\.webp$/, '-detail.webp'),
        },
      ]
    : [];

const includedItems = getIncludedItems(
  details?.included || []
);

                    return (
                      <>
                        <button
                          type="button"
                          className="
                            mb-4
                            flex
                            h-10
                            w-10
                            items-center
                            justify-center
                            rounded-full
                            border
                            border-gray-200
                            bg-white
                            text-gray-900
                            shadow-sm
                            transition
                            hover:bg-gray-100
                          "
                          aria-label="Back"
                          onClick={() => {
                            formBack(() =>
                              setSelectedInteriorDesign(
                                null
                              )
                            );

                            scrollModalToTop();
                          }}
                        >
                          <Icon
                            name="arrow-left"
                            size={20}
                          />
                        </button>

                        {/* TWO COLUMNS: photos on the left, details on the right */}
                        <div
                          className="
                            grid
                            grid-cols-1
                            gap-6
                            md:grid-cols-2
                            md:items-stretch
                          "
                        >
                          {/* ============ LEFT COLUMN ============ */}
                          <div className="flex flex-col">
                            <div
                              className={`ibc-modal-design-media overflow-hidden rounded-2xl bg-gray-100 shadow-sm ${
                                isStudy ? '' : 'md:min-h-[360px] md:flex-1'
                              } ${
                                design.spaceSlug === 'entrance'
                                  ? 'ibc-modal-design-media--entrance'
                                  : ''
                              }`}
                            >
                              <img
                                loading="eager"
                                decoding="async"
                                src={design.image}
                                alt={design.name}
                                className={`block w-full ${
                                  isStudy
                                    ? 'h-auto!'
                                    : 'h-[300px] sm:h-[360px] md:h-full!'
                                } ${
                                  design.spaceSlug === 'entrance'
                                    ? 'object-contain'
                                    : 'object-cover'
                                }`}
                              />
                            </div>

                            {/* FRONT / SIDE / DETAIL — click one to open it */}
                            {designViews.length > 0 && (
                              <div className="mt-3 grid grid-cols-3 gap-3">
                                {designViews.map((view, index) => (
                                  <button
                                    key={view.label}
                                    type="button"
                                    className="
                                      overflow-hidden
                                      rounded-xl
                                      border
                                      border-gray-200
                                      bg-white
                                      text-center
                                      shadow-sm
                                      transition
                                      hover:border-[#9A5B2D]
                                    "
                                    onClick={() => setViewerIndex(index)}
                                    aria-label={`Open ${view.label}`}
                                  >
                                    <img
                                      src={view.src}
                                      alt={`${design.name} ${view.label}`}
                                      className="block h-24 w-full object-cover"
                                      loading="lazy"
                                      decoding="async"
                                      onError={(event) => {
                                        event.currentTarget.onerror = null;
                                        event.currentTarget.src = design.image;
                                      }}
                                    />

                                    <span className="block px-2 py-2 text-xs font-semibold text-gray-700">
                                      {view.label}
                                    </span>
                                  </button>
                                ))}
                              </div>
                            )}

                          </div>
                          {/* ============ END LEFT COLUMN ============ */}

                          {/* ============ RIGHT COLUMN ============ */}
                          <div className="flex flex-col rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                            <p
                              className="
                                text-xs
                                font-semibold
                                uppercase
                                tracking-[0.14em]
                                text-[#9A5B2D]
                              "
                            >
                              {space?.name}
                            </p>

                            <h3
                              className="
                                mt-2
                                text-2xl
                                font-bold
                                leading-tight
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

                            {design.estimatedPrice ? (
                              <div
                                className="
                                  mt-5
                                  rounded-xl
                                  bg-[#faf7f3]
                                  px-4
                                  py-3
                                "
                              >
                                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500">
                                  Estimated Price
                                </p>

                                <p className="mt-1 text-xl font-bold text-gray-950">
                                  {design.estimatedPrice}
                                </p>
                              </div>
                            ) : (
                              <p className="mt-4 text-lg font-semibold text-gray-900">
                                {design.priceRange ||
                                  `₹${design.pricePerSqft} / sq.ft.`}
                              </p>
                            )}

                            {design.description && (
                              <div className="mt-4 rounded-2xl bg-[#fafafa] p-4">
                                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">
                                  About this design
                                </p>

                                <p className="mt-2 text-sm leading-6 text-gray-700">
                                  {design.description}
                                </p>
                              </div>
                            )}

                            {design.features?.length > 0 && (
                              <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-4">
                                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">
                                  Key Features
                                </p>

                                <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                                  {design.features.map((feature, index) => (
                                    <div
                                      key={`${feature}-${index}`}
                                      className="flex items-start gap-2"
                                    >
                                      <span className="mt-0.5 text-[#9A5B2D]">✓</span>

                                      <span className="text-sm leading-6 text-gray-700">
                                        {interiorFeatures[feature]?.label || feature}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            <div className="mt-auto pt-6">
                              <button
                                type="button"
                                className="
                                  btn
                                  btn-primary
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

{isStudy ? 'BOOK NOW' : 'CUSTOMISE THIS DESIGN'}
                              </button>
                            </div>
                          </div>
                          {/* ============ END RIGHT COLUMN ============ */}
                        </div>

                        {/* WHAT'S INCLUDED — full width, light theme */}
                        {includedItems.length > 0 && (
                          <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                            <div className="flex items-center justify-between gap-3">
                              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">
                                What’s Included
                              </p>

                              <span className="text-xs font-medium text-[#9A5B2D]">
                                {includedItems.length} items
                              </span>
                            </div>

                            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                              {includedItems.map((item) => (
                                <IncludedCard key={item.title} item={item} />
                              ))}
                            </div>

                            
{details?.exclusions && (
  <p className="mt-4 border-t border-gray-100 pt-3 text-xs leading-5 text-gray-500">
    <span className="font-semibold text-gray-700">
      Not included:{' '}
    </span>
    {details.exclusions}
  </p>
)}

                          </div>
                        )}

                        {/* FULL-SCREEN VIEWER */}
                        {viewerIndex !== null &&
                          designViews[viewerIndex] && (
                            <div
                              className="
                                fixed
                                inset-0
                                z-[3000]
                                flex
                                items-center
                                justify-center
                                bg-black/90
                                p-4
                              "
                              onClick={() => setViewerIndex(null)}
                            >
                              <button
                                type="button"
                                className="
                                  absolute
                                  right-4
                                  top-4
                                  flex
                                  h-10
                                  w-10
                                  items-center
                                  justify-center
                                  rounded-full
                                  bg-white
                                  text-xl
                                  text-gray-900
                                "
                                aria-label="Close view"
                                onClick={() => setViewerIndex(null)}
                              >
                                ✕
                              </button>

                              <button
                                type="button"
                                className="
                                  absolute
                                  left-3
                                  top-1/2
                                  flex
                                  h-10
                                  w-10
                                  -translate-y-1/2
                                  items-center
                                  justify-center
                                  rounded-full
                                  bg-white/90
                                  text-gray-900
                                "
                                aria-label="Previous view"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  setViewerIndex(
                                    (viewerIndex + designViews.length - 1) %
                                      designViews.length
                                  );
                                }}
                              >
                                <Icon
                                  name="arrow-left"
                                  size={20}
                                />
                              </button>

                              <div
                                className="flex max-h-full max-w-full flex-col items-center"
                                onClick={(event) =>
                                  event.stopPropagation()
                                }
                              >
                                <img
                                  src={designViews[viewerIndex].src}
                                  alt={`${design.name} ${designViews[viewerIndex].label}`}
                                  className="max-h-[80vh] max-w-full rounded-xl object-contain"
                                  onError={(event) => {
                                    event.currentTarget.onerror = null;
                                    event.currentTarget.src =
                                      design.image;
                                  }}
                                />

                                <p className="mt-3 text-sm font-semibold text-white">
                                  {designViews[viewerIndex].label}
                                </p>
                              </div>

                              <button
                                type="button"
                                className="
                                  absolute
                                  right-3
                                  top-1/2
                                  flex
                                  h-10
                                  w-10
                                  -translate-y-1/2
                                  items-center
                                  justify-center
                                  rounded-full
                                  bg-white/90
                                  text-gray-900
                                "
                                aria-label="Next view"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  setViewerIndex(
                                    (viewerIndex + 1) %
                                      designViews.length
                                  );
                                }}
                              >
                                <Icon
                                  name="arrow-right"
                                  size={20}
                                />
                              </button>
                            </div>
                          )}
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
                            mb-4
                            flex
                            h-10
                            w-10
                            items-center
                            justify-center
                            rounded-full
                            border
                            border-gray-200
                            bg-white
                            text-gray-900
                            shadow-sm
                            transition
                            hover:bg-gray-100
                          "
                          aria-label="Back"
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
                          <Icon
                            name="arrow-left"
                            size={20}
                          />
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
                                 <span
  className="mr-2 inline-block h-7 w-7 shrink-0 rounded-full border border-black/10 align-middle"
  style={{
    backgroundColor:
      {
        'Natural Oak': '#d7b083',
        Teak: '#a96532',
        Walnut: '#75411f',
        Wenge: '#2b211b',
        Coffee: '#7b5035',
        'White Oak': '#ead7bc',
        'Grey Wood': '#9b9b9b',
        'Mocha Brown': '#7a4b2d',
        'Pecan Brown': '#a66a3f',
        'Marble White': '#e9e5df',
        Black: '#202020',
        White: '#f5f5f5',
        'Dark Grey': '#555555',
        'Light Grey': '#bcbcbc',
      }[selectedLivingRoomColor] || '#c9b7a4',
  }}
/>

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


) : selectedInteriorSpace === 'mandir' ? (
  <div className="space-y-8">

    {/* =================================
        BASIC MANDIR DESIGNS
        ================================= */}

    <section>

      <div className="mb-5">
        <h3 className="text-2xl font-bold text-gray-950">
          Basic Mandir Designs
        </h3>

        <p className="mt-1 text-sm text-gray-500">
          Simple • Elegant • Functional
        </p>

        <div className="mt-4 inline-flex rounded-lg bg-[#fff7ed] px-4 py-2">
          <span className="text-sm font-semibold text-[#9A5B2D]">
            ₹8,000 – ₹18,000
          </span>
        </div>
      </div>


      <div className="grid grid-cols-2 gap-4">

        {mandirGroups.basic.map((name) => {

          const design = getDesignsBySpace(
            'mandir'
          ).find(
            (item) => item.name === name
          );

          if (!design) return null;

          return (
            <button
              key={design.slug}
              type="button"
              className="
                overflow-hidden
                rounded-2xl
                bg-white
                text-left
                shadow-sm
                ring-1
                ring-gray-200
                transition
                duration-200
                hover:-translate-y-1
                hover:shadow-lg
              "
              onClick={() => {
                setSelectedInteriorDesign(
                  design.slug
                );

                scrollModalToTop();
              }}
            >

              <div
                className="
                  aspect-[4/3]
                  w-full
                  overflow-hidden
                  bg-gray-100
                "
              >
                <img
                  src={design.image}
                  alt={design.name}
                  loading="lazy"
                  decoding="async"
                  className="
                    h-full!
                    w-full
                    object-cover
                  "
                />
              </div>

              <div className="p-4">

                <h4 className="text-base font-bold text-gray-950">
                  {design.name}
                </h4>

                <p className="mt-1 text-xs leading-5 text-gray-500">
                  {mandirDescriptions[design.name]}
                </p>

              </div>

            </button>
          );
        })}

      </div>

    </section>


    {/* =================================
        PREMIUM MANDIR DESIGNS
        ================================= */}

    <section>

      <div className="mb-5">

        <h3 className="text-2xl font-bold text-gray-950">
          Premium Mandir Designs
        </h3>

        <p className="mt-1 text-sm text-gray-500">
          Luxurious • Modern • Customizable
        </p>

        <div className="mt-4 inline-flex rounded-lg bg-[#fff7ed] px-4 py-2">
          <span className="text-sm font-semibold text-[#9A5B2D]">
            ₹25,000 – ₹75,000
          </span>
        </div>

      </div>


      <div className="grid grid-cols-2 gap-4">

        {mandirGroups.premium.map((name) => {

          const design = getDesignsBySpace(
            'mandir'
          ).find(
            (item) => item.name === name
          );

          if (!design) return null;

          return (
            <button
              key={design.slug}
              type="button"
              className="
                overflow-hidden
                rounded-2xl
                bg-white
                text-left
                shadow-sm
                ring-1
                ring-gray-200
                transition
                duration-200
                hover:-translate-y-1
                hover:shadow-lg
              "
              onClick={() => {
                setSelectedInteriorDesign(
                  design.slug
                );

                scrollModalToTop();
              }}
            >

              <div
                className="
                  aspect-[4/3]
                  w-full
                  overflow-hidden
                  bg-gray-100
                "
              >
                <img
                  src={design.image}
                  alt={design.name}
                  loading="lazy"
                  decoding="async"
                  className="
                    h-full!
                    w-full
                    object-cover
                  "
                />
              </div>

              <div className="p-4">

                <h4 className="text-base font-bold text-gray-950">
                  {design.name}
                </h4>

                <p className="mt-1 text-xs leading-5 text-gray-500">
                  {mandirDescriptions[design.name]}
                </p>

              </div>

            </button>
          );
        })}

      </div>

    </section>


    {/* =================================
        BENEFITS
        ================================= */}

    <section className="rounded-2xl bg-[#faf7f3] p-5">

      <div className="grid grid-cols-2 gap-4">

        <div>


          <p className="mt-1 text-sm font-semibold text-gray-950">
              <span className="text-xl text-[#9A5B2D]">
            ✓
          </span>High Quality Materials
          </p>
        </div>


        <div>


          <p className="mt-1 text-sm font-semibold text-gray-950">
            <span className="text-xl text-[#9A5B2D]">
            ✓
          </span> Custom Sizes & Designs
          </p>
        </div>


        <div>


          <p className="mt-1 text-sm font-semibold text-gray-950">
            <span className="text-xl text-[#9A5B2D]">
            ✓
          </span> Professional Installation
          </p>
        </div>


        <div>


          <p className="mt-1 text-sm font-semibold text-gray-950">
            <span className="text-xl text-[#9A5B2D]">
            ✓
          </span> Expert Site Visit
          </p>
        </div>

      </div>

    </section>


    {/* =================================
        BOOK A SITE VISIT BUTTON
        ================================= */}

    <button
      type="button"
      className="
        btn
        btn-primary
        w-full
      "
      onClick={() => {

        setSelectedInteriorDesign(null);

        setShowInteriorBooking(true);

        scrollModalToTop();

      }}
    >
      Book a Site Visit for your Mandir
    </button>

  </div>
  
) : selectedInteriorSpace === 'study' ? (

  <div className="pb-4">
    <div className="mb-5">
      <h2 className="text-2xl font-bold text-gray-950">
        Study Room Designs
      </h2>
      <p className="mt-2 text-sm leading-6 text-gray-600">
        Choose a design to view its photos, estimated price,
        and included features.
      </p>
    </div>

    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {getDesignsBySpace('study').map((design) => (
        <button
          key={design.slug}
          type="button"
          className="group overflow-hidden rounded-2xl border border-gray-200 bg-white text-left shadow-sm transition hover:-translate-y-1 hover:border-[#9A5B2D] hover:shadow-lg"
          onClick={() => {
            setSelectedInteriorDesign(design.slug);
            scrollModalToTop();
          }}
        >
          <div className="relative h-56 overflow-hidden bg-gray-100">
            <img
              src={design.image}
              alt={design.name}
              className="h-full! w-full object-cover transition duration-300 group-hover:scale-105"
              loading="lazy"
              decoding="async"
              onError={(event) => {
                event.currentTarget.onerror = null;
                if (design.fallbackImage) {
                  event.currentTarget.src = design.fallbackImage;
                }
              }}
            />

            <span className="absolute bottom-3 right-3 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-gray-800 shadow-sm">
              View Details →
            </span>
          </div>

          <div className="p-4">
            <h3 className="text-lg font-bold text-gray-950">
              {design.name}
            </h3>

            {design.description && (
              <p className="mt-2 line-clamp-2 text-sm leading-5 text-gray-600">
                {design.description}
              </p>
            )}

            <div className="mt-4 flex items-center justify-between gap-3 border-t border-gray-100 pt-3">
              <div>
                <span className="block text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                  Estimated Price
                </span>
                <span className="mt-1 block text-sm font-bold text-[#9A5B2D]">
                  {design.estimatedPrice ||
                    design.priceRange ||
                    'Price after consultation'}
                </span>
              </div>

              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gray-200 text-gray-700 transition group-hover:border-[#9A5B2D] group-hover:bg-[#9A5B2D] group-hover:text-white">
                →
              </span>
            </div>
          </div>
        </button>
      ))}
    </div>
  </div>

) : (


  <div
                        className={`ibc-design-grid ${
                          selectedInteriorSpace === 'entrance'
                            ? 'ibc-design-grid--entrance'
                            : selectedInteriorSpace === 'bed-back-wall'
                              ? 'ibc-design-grid--bed-back-wall'
                              : ''
                        }`}
                      >
                        {getDesignsBySpace(
                          selectedInteriorSpace
                        ).map(
                          (design) => (
                            <div
                              key={design.slug}
                              className={`ibc-design-card ${
                                selectedInteriorSpace === 'entrance'
                                  ? 'ibc-design-card--entrance'
                                  : ''
                              }`}
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
  {design.estimatedPrice ? (
    <span className="flex flex-col gap-0.5">
      <span className="text-[11px] font-medium uppercase tracking-wide text-gray-500">
        Estimated Price
      </span>

      <span className="text-sm font-bold text-gray-950">
        {design.estimatedPrice}
      </span>
    </span>
  ) : (
    <span>
      {design.priceRange ||
        `₹${design.pricePerSqft} / sq.ft.`}
    </span>
  )}
</span>
                              </button>
                            </div>
                          )
                        )}
                      </div>
                    )}

                   {/* {!selectedLivingRoomOption &&
                    !selectedLivingRoomColor &&
                    selectedInteriorSpace !== 'mandir' && (
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
                      )} */}
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
                            {/* h-full! so global.css's img { height: auto } can't shrink a non-square photo and leave a gap. */}
                            <img
                              loading="lazy"
                              decoding="async"
                              src={space.image}
                              alt={space.name}
                              className="
                                absolute
                                inset-0
                                h-full!
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
          ) : service.slug === 'interior-design' ? (
            selectedInteriorDesignCategory ? (
              <InteriorDesignFlow
                key={selectedInteriorDesignCategory}
                modal={true}
                categorySlug={selectedInteriorDesignCategory}
                onBackToCatalogue={() => {
                  formBack(() => {
                    setSelectedInteriorDesignCategory(null);
                    setSelectedInteriorDesignProject(null);
                  });
                  scrollModalToTop();
                }}
                onStepChange={scrollModalToTop}
              />
            ) : (
              <InteriorDesignCategory
                modal={true}
                onSelectCategory={(categorySlug) => {
                  setSelectedInteriorDesignCategory(categorySlug);
                  setSelectedInteriorDesignProject(null);
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