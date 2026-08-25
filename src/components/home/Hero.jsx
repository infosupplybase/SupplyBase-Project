import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../ui/Icon';
import { company } from '../../data/siteConfig';

/**
 * Hero — full-width architectural hero with a slow auto-rotating slider.
 * Replace the `image` values with your own photography / renders.
 */
const slides = [
  {
    eyebrow: company.statement,
    titleLead: 'ONE PARTNER.',
    titleTail: 'COMPLETE PROJECT.',
    text: company.shortIntro,
    image: '/assets/hero-house.svg',
  },
  {
    eyebrow: 'ARCHITECTURE & 3D DESIGN',
    titleLead: 'SEE IT BEFORE',
    titleTail: 'YOU BUILD IT.',
    text: '2D plans, 3D exterior and 3D interior views prepared before construction starts — so there are no surprises on site.',
    image: '/assets/services/architectural-design.svg',
  },
  {
    eyebrow: 'TURNKEY EXECUTION',
    titleLead: 'LABOUR. MATERIAL.',
    titleTail: 'MANAGEMENT.',
    text: 'Civil work, interiors, electrical, plumbing, ceiling and finishing delivered by one team under one contract.',
    image: '/assets/projects/luxury-bungalow.svg',
  },
];

export default function Hero() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setIndex((i) => (i + 1) % slides.length), 7000);
    return () => clearInterval(timer);
  }, []);

  const go = (dir) => setIndex((i) => (i + dir + slides.length) % slides.length);
  const slide = slides[index];

  return (
    <section className="hero">
      <div className="hero-bg">
        <img key={slide.image} src={slide.image} alt="" />
      </div>
      <div className="hero-overlay" />

      <button type="button" className="hero-arrow prev" onClick={() => go(-1)} aria-label="Previous slide">
        <Icon name="arrow-left" size={20} />
      </button>
      <button type="button" className="hero-arrow next" onClick={() => go(1)} aria-label="Next slide">
        <Icon name="arrow-right" size={20} />
      </button>

      <div className="container">
        <div className="hero-inner" key={index}>
          <span className="eyebrow">{slide.eyebrow}</span>
          <h1>
            {slide.titleLead}
            <br />
            <span className="gold">{slide.titleTail}</span>
          </h1>
          <p>{slide.text}</p>
          {/* Two lanes, not one CTA: a defined job and a full project promise
              different things, and one button cannot say both honestly. */}
          <div className="btn-row">
            <Link to="/book?type=service" className="btn btn-primary btn-lg">
              <Icon name="calendar" size={18} />
              BOOK A SERVICE
            </Link>
            <Link to="/book?type=project" className="btn btn-dark btn-lg">
              START A PROJECT
              <Icon name="arrow-right" size={18} />
            </Link>
          </div>
        </div>
      </div>

      <div className="hero-dots">
        {slides.map((s, i) => (
          <button
            key={s.titleLead}
            type="button"
            className={`hero-dot ${i === index ? 'active' : ''}`}
            onClick={() => setIndex(i)}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
