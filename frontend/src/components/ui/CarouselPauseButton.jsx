/**
 * Pause / play for an auto-advancing carousel, so visitors can stop the
 * slides moving (WCAG 2.2.2). Position it with a className from the caller.
 */
export default function CarouselPauseButton({ paused, onToggle, label = 'slides', className = '' }) {
  return (
    <button
      type="button"
      className={`carousel-pause ${className}`}
      onClick={onToggle}
      aria-pressed={paused}
      aria-label={paused ? `Play ${label}` : `Pause ${label}`}
      title={paused ? 'Play' : 'Pause'}
    >
      {paused ? (
        <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
          <path d="M4 2.5v11l9-5.5z" fill="currentColor" />
        </svg>
      ) : (
        <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
          <rect x="3.5" y="2.5" width="3" height="11" rx="1" fill="currentColor" />
          <rect x="9.5" y="2.5" width="3" height="11" rx="1" fill="currentColor" />
        </svg>
      )}
    </button>
  );
}
