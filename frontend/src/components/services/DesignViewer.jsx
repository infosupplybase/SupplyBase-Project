import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

/**
 * Full-screen viewer for a design's Front / Side / Detail views.
 * - every image fills the stage, however small the source file is
 * - fade + zoom animation when the view changes
 * - blurred copy of the photo as a moving backdrop
 * - thumbnail strip, arrows, keyboard (← → Esc), swipe on phones
 * - click the photo to zoom in on that spot, click again to zoom out
 */
export default function DesignViewer({
  title,
  views,
  index,
  fallback,
  onChange,
  onClose,
}) {
  const [zoom, setZoom] = useState(null); // { x, y } in % or null
  const touchStart = useRef(null);

  const total = views.length;
  const current = views[index];

  const go = (next) => {
    setZoom(null);
    onChange((next + total) % total);
  };

  // Keyboard + stop the page behind from scrolling.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') go(index - 1);
      if (e.key === 'ArrowRight') go(index + 1);
    };
    window.addEventListener('keydown', onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [index]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!current) return null;

  const useFallback = (e) => {
    e.currentTarget.onerror = null;
    e.currentTarget.src = fallback;
  };

  const toggleZoom = (e) => {
    if (zoom) {
      setZoom(null);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    setZoom({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    });
  };

  const onTouchStart = (e) => {
    touchStart.current = e.touches[0].clientX;
  };

  const onTouchEnd = (e) => {
    if (touchStart.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStart.current;
    touchStart.current = null;
    if (Math.abs(delta) > 50) go(delta > 0 ? index - 1 : index + 1);
  };

  const arrowBtn =
    'absolute top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-md transition hover:scale-110 hover:bg-white/30 active:scale-95 max-sm:h-9 max-sm:w-9';

  return createPortal(
    <div
      className="dv-fade fixed inset-0 z-[5000] flex flex-col items-center justify-center overflow-hidden bg-black/95"
      onClick={onClose}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      role="dialog"
      aria-modal="true"
      aria-label={`${title} – ${current.label}`}
    >
      <style>{`
        @keyframes dvFade { from { opacity: 0 } to { opacity: 1 } }
        @keyframes dvPop {
          from { opacity: 0; transform: scale(.94) translateY(12px) }
          to   { opacity: 1; transform: scale(1) translateY(0) }
        }
        @keyframes dvDrift {
          from { transform: scale(1.15) translate(0,0) }
          to   { transform: scale(1.3) translate(-2%, -2%) }
        }
        .dv-fade { animation: dvFade .25s ease-out }
        .dv-pop  { animation: dvPop .35s cubic-bezier(.2,.8,.2,1) }
        .dv-drift { animation: dvDrift 14s ease-in-out infinite alternate }
      `}</style>

      {/* Blurred, slowly drifting copy of the photo as backdrop */}
      <img
        key={`bg-${index}`}
        src={current.src}
        alt=""
        aria-hidden="true"
        onError={useFallback}
        className="dv-drift pointer-events-none absolute inset-0 h-full w-full object-cover opacity-40 blur-3xl"
      />

      {/* Top bar */}
      <div
        className="absolute left-0 right-0 top-0 z-10 flex items-start justify-between gap-3 p-4 max-sm:p-3"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-white/70">
            {title}
          </p>
          <p className="mt-0.5 text-lg font-bold text-white max-sm:text-base">
            {current.label}
            <span className="ml-3 text-sm font-medium text-white/60">
              {index + 1} / {total}
            </span>
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Close view"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-xl text-gray-900 shadow-lg transition hover:scale-110 active:scale-95 max-sm:h-10 max-sm:w-10"
        >
          ✕
        </button>
      </div>

      {/* Arrows */}
      {total > 1 && (
        <>
          <button
            type="button"
            className={`${arrowBtn} left-3 max-sm:left-1.5`}
            aria-label="Previous view"
            onClick={(e) => {
              e.stopPropagation();
              go(index - 1);
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>

          <button
            type="button"
            className={`${arrowBtn} right-3 max-sm:right-1.5`}
            aria-label="Next view"
            onClick={(e) => {
              e.stopPropagation();
              go(index + 1);
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </>
      )}

      {/* Stage: the photo always fills this box */}
      <div
        key={index}
        className="dv-pop relative z-[1] mt-12 w-[92vw] max-w-5xl overflow-hidden rounded-2xl bg-black/40 shadow-2xl ring-1 ring-white/15 h-[58vh] sm:h-[64vh]"
        onClick={(e) => {
          e.stopPropagation();
          toggleZoom(e);
        }}
        style={{ cursor: zoom ? 'zoom-out' : 'zoom-in' }}
      >
        <img
          src={current.src}
          alt={`${title} ${current.label}`}
          onError={useFallback}
          draggable={false}
          className="h-full w-full select-none object-contain transition-transform duration-500 ease-out"
          style={{
            transform: zoom ? 'scale(1.8)' : 'scale(1)',
            transformOrigin: zoom ? `${zoom.x}% ${zoom.y}%` : 'center',
            filter: 'contrast(1.04) saturate(1.05)',
          }}
        />

        {!zoom && (
          <span className="pointer-events-none absolute bottom-3 right-3 rounded-full bg-black/55 px-3 py-1 text-[11px] font-medium text-white/80 backdrop-blur">
            Tap to zoom
          </span>
        )}
      </div>

      {/* Thumbnail strip */}
      <div
        className="relative z-10 mt-4 flex items-center justify-center gap-3 px-3 max-sm:gap-2"
        onClick={(e) => e.stopPropagation()}
      >
        {views.map((view, i) => (
          <button
            key={view.label}
            type="button"
            onClick={() => go(i)}
            aria-label={`Show ${view.label}`}
            className={`overflow-hidden rounded-xl bg-black/40 text-center transition duration-300 ${
              i === index
                ? 'scale-105 ring-2 ring-[#e9b44c]'
                : 'opacity-60 ring-1 ring-white/20 hover:opacity-100'
            }`}
          >
            <img
              src={view.src}
              alt=""
              onError={useFallback}
              className="block h-14 w-24 object-cover max-sm:h-11 max-sm:w-[74px]"
            />
            <span className="block bg-black/60 px-2 py-1 text-[11px] font-semibold text-white">
              {view.label}
            </span>
          </button>
        ))}
      </div>
    </div>,
    document.body
  );
}