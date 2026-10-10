import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import HomeHero from '../home/HomeHero';
import Icon from '../ui/Icon';
import './HeroSlider.css';

const slides = [
  '/assets/home-slider/supplybase-carousel.mp4',
  '/assets/home-slider/supplybase-interior-carousel.mp4',
  '/assets/home-slider/supplybase-pop-carousel.mp4',
];

const slideText = [
  {
    title: 'Beautiful Walls.',
    highlight: 'Fresh Beginnings.',
    description: 'Give your home a fresh look with professional painting.',
  },
  {
    title: 'Inspired Interiors.',
    highlight: 'Made for You.',
    description: 'Beautiful interiors designed for your home.',
  },
  {
    title: 'Stylish Ceilings.',
    highlight: 'Beautiful Homes.',
    description: 'Give your home a new look with POP ceiling designs.',
  },
];

export default function HeroSlider() {
  const sectionRef = useRef(null);
  const videoRefs = useRef([]);
  const readyRefs = useRef([]);
  const [active, setActive] = useState(0);
  const [previous, setPrevious] = useState(null);
  const [canPlay, setCanPlay] = useState(false);

  useLayoutEffect(() => {
    const banner = sectionRef.current;
    const header = document.querySelector('header');
    if (!banner || !header) return undefined;

    const align = () => {
      banner.style.setProperty('margin-top', '0px', 'important');
      const headerBottom = header.getBoundingClientRect().bottom;
      const bannerTop = banner.getBoundingClientRect().top + window.scrollY;

      banner.style.setProperty(
        'margin-top',
        `${Math.ceil(Math.max(0, headerBottom - bannerTop))}px`,
        'important'
      );
    };

    align();
    const observer = new ResizeObserver(align);
    observer.observe(header);
    window.addEventListener('resize', align);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', align);
      banner.style.removeProperty('margin-top');
    };
  }, []);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return undefined;

    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    let visible = true;

    const update = () => {
      const allowed = visible && !document.hidden && !media.matches;
      if (!allowed) {
        videoRefs.current.forEach((video) => video?.pause());
      }
      setCanPlay(allowed);
    };

    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      update();
    }, { threshold: 0.1 });

    observer.observe(section);
    media.addEventListener('change', update);
    document.addEventListener('visibilitychange', update);
    update();

    return () => {
      observer.disconnect();
      media.removeEventListener('change', update);
      document.removeEventListener('visibilitychange', update);
      videoRefs.current.forEach((video) => video?.pause());
    };
  }, []);

  useEffect(() => {
    const video = videoRefs.current[active];
    if (video) video.currentTime = 0;
  }, [active]);

  useEffect(() => {
    const current = videoRefs.current[active];
    let fadeTimer;

    if (canPlay) {
      current?.play().catch(() => {});
      fadeTimer = window.setTimeout(() => {
        videoRefs.current.forEach((video, index) => {
          if (index !== active) video?.pause();
        });
      }, 700);
    } else {
      videoRefs.current.forEach((video) => video?.pause());
    }

    return () => window.clearTimeout(fadeTimer);
  }, [active, canPlay]);

  const advance = (index) => {
    if (index !== active || !canPlay) return;

    const next = (index + 1) % slides.length;
    if (readyRefs.current[next]) {
      setPrevious(index);
      setActive(next);
    } else {
      const video = videoRefs.current[index];
      if (video) {
        video.currentTime = 0;
        video.play().catch(() => {});
      }
    }
  };

  return (
    <section
      ref={sectionRef}
      className="sb-home-banner sb-final-banner sb-video-hero"
      aria-label="SupplyBase home services"
    >
      <div className="sb-video-hero__background" aria-hidden="true">
        {slides.map((src, index) => (
          <video
            key={src}
            ref={(video) => { videoRefs.current[index] = video; }}
            className={`sb-carousel-video ${index === active ? 'is-active' : ''}`}
            style={{
              transform: index === active
                ? 'translateX(0)'
                : index === previous
                  ? 'translateX(-100%)'
                  : 'translateX(100%)',
              visibility: index === active || index === previous
                ? 'visible'
                : 'hidden',
            }}
            muted
            playsInline
            preload="auto"
            onCanPlay={() => {
              readyRefs.current[index] = true;
              if (index === active && canPlay) {
                videoRefs.current[index]?.play().catch(() => {});
              }
            }}
            onEnded={() => advance(index)}
          >
            <source src={src} type="video/mp4" />
          </video>
        ))}
      </div>

      <div className="sb-video-hero__shade" aria-hidden="true" />

      <h1 className="sr-only">
        Home painting, waterproofing, POP ceiling and interior design services in Thane and Mumbai
      </h1>

      <div className="container sb-video-hero__inner">
        <div className="sb-video-hero__content">
          <img
            className="sb-video-hero__logo"
            src="/assets/brand/hero-logo-20261011.webp"
            alt="SupplyBase — One Partner. Complete Project."
          />

          <h2>
            {slideText[active].title}<br />
            <span>{slideText[active].highlight}</span>
          </h2>

          <p>{slideText[active].description}</p>

          <div className="sb-video-hero__search">
            <HomeHero />
          </div>

          <Link className="sb-video-hero__book" to="/services">
            BOOK NOW
            <Icon name="arrow-right" size={18} />
          </Link>
        </div>
      </div>
    </section>
  );
}
