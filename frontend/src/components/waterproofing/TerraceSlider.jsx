import { useEffect, useState } from 'react';

// The banners carry their own headline, so the page title stays for screen
// readers only (see the sr-only h1 below).
const SLIDES = [
  '/assets/waterproofing/terrace-slider/terrace-4.webp',
  '/assets/waterproofing/terrace-slider/terrace-3.webp',
  '/assets/waterproofing/terrace-slider/terrace-5.webp',
  '/assets/waterproofing/terrace-slider/terrace-1.webp',
  '/assets/waterproofing/terrace-slider/terrace-2.webp',
];

/**
 * Terrace waterproofing banner carousel. Advances every 4 seconds; a copy of
 * the first slide sits at the end so the loop slides forward and then jumps
 * back to the start without the jump showing. Holds still for visitors who
 * ask for reduced motion.
 */
export default function TerraceSlider({ title }) {
  const [slide, setSlide] = useState(0);
  const [animate, setAnimate] = useState(true);

  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return undefined;
    const timer = setInterval(() => {
      setAnimate(true);
      setSlide((current) => current + 1);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const onTransitionEnd = () => {
    if (slide !== SLIDES.length) return;
    setAnimate(false);
    setSlide(0);
    requestAnimationFrame(() => requestAnimationFrame(() => setAnimate(true)));
  };

  return (
    <section className="wp-terrace-slider">
      <h1 className="sr-only">{title}</h1>
      <div
        className="wp-terrace-slider-track"
        style={{
          transform: `translateX(-${slide * 100}%)`,
          transition: animate ? 'transform 0.7s ease-in-out' : 'none',
        }}
        onTransitionEnd={onTransitionEnd}
      >
        {[...SLIDES, SLIDES[0]].map((image, index) => (
          <img
            key={`${image}-${index}`}
            src={image}
            alt={index === SLIDES.length ? '' : `Terrace waterproofing banner ${index + 1}`}
            aria-hidden={index === SLIDES.length || undefined}
            className="wp-terrace-slide-image"
          />
        ))}
      </div>

      <div className="wp-terrace-slider-dots">
        {SLIDES.map((image, index) => (
          <button
            key={image}
            type="button"
            className={`wp-terrace-slider-dot ${slide % SLIDES.length === index ? 'active' : ''}`}
            onClick={() => {
              setAnimate(true);
              setSlide(index);
            }}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
