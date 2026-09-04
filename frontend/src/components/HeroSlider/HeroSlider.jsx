import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../ui/Icon';
import { heroSlides, AUTOPLAY_MS } from './heroSlides';
import './HeroSlider.css';

/**
 * HeroSlider — four approved banners, shown as artwork.
 *
 * The images already contain their own headings, ₹25 card and BOOK NOW
 * button, so nothing is drawn on top of them. The only overlays are the
 * controls (arrows, dots) and one transparent hotspot sitting exactly over
 * the painted BOOK NOW button, which is what makes it clickable without
 * putting a second button on the page.
 *
 * All four slides are stacked and cross-faded rather than translated, so a
 * fade never shows a seam between two images and the layout height never
 * shifts mid-transition.
 */
export default function HeroSlider() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const navigate = useNavigate();

  const rootRef = useRef(null);
  const touchStartX = useRef(null);
  const touchStartY = useRef(null);

  const count = heroSlides.length;

  const goTo = useCallback((next) => setIndex(((next % count) + count) % count), [count]);
  const next = useCallback(() => goTo(index + 1), [goTo, index]);
  const prev = useCallback(() => goTo(index - 1), [goTo, index]);

  /* ------------------------------------------------------- autoplay */

  useEffect(() => {
    if (paused) return undefined;

    // Someone who has asked for reduced motion should not have the page
    // changing under them on a timer either.
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return undefined;

    const timer = setTimeout(() => goTo(index + 1), AUTOPLAY_MS);
    return () => clearTimeout(timer);
  }, [index, paused, goTo]);

  // Advancing while the tab is hidden just means a burst of slides when the
  // visitor comes back, so the timer stops with the tab.
  useEffect(() => {
    const onVisibility = () => setPaused(document.hidden);
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  /* ------------------------------------------------------- keyboard */

  const onKeyDown = (event) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      prev();
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      next();
    }
  };

  /* ---------------------------------------------------------- touch */

  const onTouchStart = (event) => {
    touchStartX.current = event.touches[0].clientX;
    touchStartY.current = event.touches[0].clientY;
  };

  const onTouchEnd = (event) => {
    if (touchStartX.current === null) return;
    const dx = event.changedTouches[0].clientX - touchStartX.current;
    const dy = event.changedTouches[0].clientY - touchStartY.current;

    // Only treat it as a swipe if it is decisively sideways. Without the
    // vertical comparison, scrolling the page down with a thumb that drifts
    // slightly would flick the slide.
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      if (dx < 0) next();
      else prev();
    }
    touchStartX.current = null;
    touchStartY.current = null;
  };

  return (
    <section
      className="hero-slider"
      ref={rootRef}
      aria-roledescription="carousel"
      aria-label="Supplybase services"
      tabIndex={0}
      onKeyDown={onKeyDown}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <div className="hero-slider-track">
        {heroSlides.map((slide, i) => {
          const active = i === index;
          // Load the current slide and the one after it. Purely lazy slides
          // fade in blank, because a lazy image inside a hidden slide has not
          // started downloading when the transition begins. As the carousel
          // advances this walks forward, so nothing loads before it is needed
          // and nothing is missing when it is.
          const preload = i === 0 || i === index || i === (index + 1) % count;
          return (
            <div
              key={slide.id}
              className={`hero-slide ${active ? 'active' : ''}`}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${count}: ${slide.alt}`}
              aria-hidden={!active}
            >
              <img
                src={slide.image}
                alt={slide.alt}
                width={1672}
                height={941}
                /* The first banner is the largest thing above the fold, so it
                   loads eagerly at high priority. The rest follow one slide
                   ahead — four 2MB PNGs racing on a phone would delay the one
                   actually being looked at. */
                loading={preload ? 'eager' : 'lazy'}
                fetchPriority={i === 0 ? 'high' : 'low'}
                decoding="async"
                draggable={false}
              />
           
              {/* Transparent, sitting exactly over the BOOK NOW painted into
                  the artwork. No visible button is added — the one in the
                  image is the button. */}
              <button
                type="button"
                className="hero-hotspot"
                style={{
                  left: `${slide.hotspot.left}%`,
                  top: `${slide.hotspot.top}%`,
                  width: `${slide.hotspot.width}%`,
                  height: `${slide.hotspot.height}%`,
                }}
                aria-label={slide.bookLabel}
                tabIndex={active ? 0 : -1}
                onClick={() => navigate(slide.route)}
              />
            </div>
          );
        })}
      </div>

      {/* ------------------------------------------------- controls */}

      <button
        type="button"
        className="hero-arrow prev"
        onClick={prev}
        aria-label="Previous slide"
      >
        <Icon name="arrow-left" size={22} />
      </button>

      <button
        type="button"
        className="hero-arrow next"
        onClick={next}
        aria-label="Next slide"
      >
        <Icon name="arrow-right" size={22} />
      </button>

      <div className="hero-dots" role="tablist" aria-label="Choose slide">
        {heroSlides.map((slide, i) => (
          <button
            key={slide.id}
            type="button"
            role="tab"
            aria-selected={i === index}
            aria-label={slide.alt}
            className={`hero-dot ${i === index ? 'active' : ''}`}
            onClick={() => goTo(i)}
          />
        ))}
      </div>

      {/* Announces the change to a screen reader without stealing focus. */}
      <p className="sr-only" aria-live="polite">
        {heroSlides[index].alt}, slide {index + 1} of {count}
      </p>
    </section>
  );
}
