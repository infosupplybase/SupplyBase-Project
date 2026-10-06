import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import HomeHero from '../home/HomeHero';
import './HeroSlider.css';

const slides = [
  {
    src: '/assets/home-slider/1.webp',
    mobileSrc: '/assets/home-slider/4.webp',
    mobileWidth: 1455,
    mobileHeight: 1081,
    width: 2048,
    height: 684,
    alt: 'SupplyBase painting services: Fresh Walls, Brighter Spaces. Get 5% off.',
  },
  {
    src: '/assets/home-slider/2.webp',
    mobileSrc: '/assets/home-slider/5.webp',
    mobileWidth: 1454,
    mobileHeight: 1082,
    width: 2170,
    height: 725,
    alt: 'SupplyBase POP and ceiling designs: Stylish Ceilings for Modern Homes. Get 5% off.',
  },
  {
    src: '/assets/home-slider/3.webp',
    mobileSrc: '/assets/home-slider/6.webp',
    mobileWidth: 1455,
    mobileHeight: 1081,
    width: 2048,
    height: 684,
    alt: 'SupplyBase waterproofing services: Keep Your Home Safe from Water Damage. Get 5% off.',
  },
];

export default function HeroSlider() {
  const [active, setActive] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [interacting, setInteracting] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const startTouch = useRef(null);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    if (reducedMotion || interacting || searchFocused) return undefined;

    const timer = window.setInterval(() => {
      if (!document.hidden) {
        setActive((current) => (current + 1) % slides.length);
      }
    }, 4000);

    return () => window.clearInterval(timer);
  }, [active, reducedMotion, interacting, searchFocused]);

  // Keep the full artwork below the site header.
  useLayoutEffect(() => {
    const banner = document.querySelector('.sb-final-banner');
    const header = document.querySelector('header');

    if (!banner || !header) return undefined;

    const alignBanner = () => {
      banner.style.setProperty('margin-top', '0px', 'important');

      // Page coordinates, so the result is the same however far the
      // visitor has scrolled (the header is fixed, the banner is not).
      const headerBottom = header.getBoundingClientRect().bottom;
      const bannerTop = banner.getBoundingClientRect().top + window.scrollY;
      const overlap = Math.max(0, headerBottom - bannerTop);

      banner.style.setProperty(
        'margin-top',
        `${Math.ceil(overlap)}px`,
        'important'
      );
    };

    alignBanner();

    const observer = new ResizeObserver(alignBanner);
    observer.observe(header);
    window.addEventListener('resize', alignBanner);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', alignBanner);
      banner.style.removeProperty('margin-top');
    };
  }, []);

  const current = slides[active];

  return (
    <section
      className="sb-home-banner sb-final-banner"
      aria-label="SupplyBase service offers"
      style={{
        '--banner-ratio': `${current.width} / ${current.height}`,
        '--mobile-banner-ratio': `${current.mobileWidth} / ${current.mobileHeight}`,
      }}
    >
      <div
        className="sb-final-banner__images"
        onTouchStart={(event) => {
          const touch = event.touches[0];
          if (touch) {
            startTouch.current = { x: touch.clientX, y: touch.clientY };
          }
          setInteracting(true);
        }}
        onTouchEnd={(event) => {
          const start = startTouch.current;
          const touch = event.changedTouches[0];

          if (start && touch) {
            const dx = touch.clientX - start.x;
            const dy = touch.clientY - start.y;

            if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
              setActive((index) =>
                (index + (dx < 0 ? 1 : -1) + slides.length) % slides.length
              );
            }
          }

          startTouch.current = null;
          setInteracting(false);
        }}
        onTouchCancel={() => {
          startTouch.current = null;
          setInteracting(false);
        }}
      >
        <div
          className="sb-final-banner__track"
          style={{ transform: `translateX(-${active * 100}%)` }}
        >
        {slides.map((slide, index) => (
          <picture
            key={slide.src}
            className={`sb-final-banner__image ${
              active === index ? 'is-active' : ''
            }`}
            aria-hidden={active !== index}
          >
            <source
              media="(max-width: 767px)"
              srcSet={slide.mobileSrc}
              width={slide.mobileWidth}
              height={slide.mobileHeight}
            />
            <img
              src={slide.src}
              alt={slide.alt}
              width={slide.width}
              height={slide.height}
              loading="eager"
              fetchPriority={index === 0 ? 'high' : 'auto'}
              decoding="async"
              draggable={false}
            />
          </picture>
        ))}
        </div>
      </div>

      <h1 className="sr-only">
        Home services in Mumbai: painting, waterproofing, plumbing, electrical, AC servicing, POP ceilings and interiors
      </h1>

      <div
        className="sb-final-banner__search"
        onFocusCapture={() => setSearchFocused(true)}
        onBlurCapture={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) {
            setSearchFocused(false);
          }
        }}
      >
        <HomeHero />
      </div>

      <div className="sb-final-banner__dots" style={{ '--image-height': `${current.height / current.width * 100}vw` }} aria-label="Choose banner">
        {slides.map((slide, index) => (
          <button
            key={slide.src}
            type="button"
            className={active === index ? 'is-active' : ''}
            aria-label={`Show banner ${index + 1}`}
            aria-current={active === index ? 'true' : undefined}
            onClick={() => setActive(index)}
          />
        ))}
      </div>
    </section>
  );
}