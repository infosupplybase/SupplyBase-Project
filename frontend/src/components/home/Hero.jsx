import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Icon from '../ui/Icon';
import api from '../../lib/api';
import { company } from '../../data/siteConfig';

/**
 * Home hero — headline on the left, booking card on the right.
 *
 * The card is the point of the page: a customer who already knows they want a
 * plumber should be one tap from the plumbing form, without scrolling or
 * reading anything first.
 *
 * Services come from the catalogue API, the same source the booking form and
 * the services page read, so the three can never disagree about what is on
 * offer. The trust points are static: they are brand copy, not data.
 */
const TRUST = [
  { icon: 'shield', label: 'Verified Professionals' },
  { icon: 'clock', label: 'On-Time Service' },
  { icon: 'check-circle', label: 'Quality Assurance' },
];

/** Fallback order and blurbs, used only until the API answers. */
const BLURB = {
  'painting-waterproofing': 'Interior, exterior & leak repair',
  plumbing: 'Leaks, fittings, tanks & drainage',
  electrician: 'Wiring, fittings & fault repair',
  'interior-work': 'Kitchens, wardrobes & full interiors',
};

export default function Hero() {
  const [services, setServices] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    api
      .services()
      .then((r) => {
        if (!cancelled) setServices(r);
      })
      // The hero must still render its headline if the API is down — the
      // card simply shows nothing rather than the whole page failing.
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="hero">
      <div className="hero-bg">
        {/* The hero image is the largest thing on the page and is above the
            fold, so it is eager and high priority — lazy-loading it would
            delay the very first thing a visitor sees. */}
        <img
          src="/assets/hero-house.svg"
          alt=""
          fetchPriority="high"
          decoding="async"
        />
      </div>
      <div className="hero-overlay" />

      <div className="container">
        <div className="hero-inner">
          {/* ------------------------------------------------ left */}
          <div className="hero-copy">
            <span className="eyebrow">{company.statement}</span>
            <h1>
              ONE PARTNER.
              <br />
              <span className="gold">COMPLETE PROJECT.</span>
            </h1>
            <p>
              From design to execution, we provide skilled professionals and quality service for
              your home and workspace.
            </p>

            <ul className="hero-trust">
              {TRUST.map((item) => (
                <li key={item.label}>
                  <Icon name={item.icon} size={20} strokeWidth={1.8} />
                  {item.label}
                </li>
              ))}
            </ul>
          </div>

          {/* ----------------------------------------------- right */}
          <div className="hero-card">
            <div className="hero-card-head">
              <h2>BOOK A SERVICE</h2>
              <p>Choose a service to get started</p>
            </div>

            <div className="hero-services">
              {services.map((service, i) => (
                <button
                  key={service.slug}
                  type="button"
                  className="hero-service"
                  onClick={() => navigate(`/services/${service.slug}`)}
                >
                  <span className="hero-service-icon">
                    <Icon name={service.icon || 'tools'} size={20} strokeWidth={1.6} />
                  </span>
                  <span className="hero-service-body">
                    <span className="hero-service-title">{service.name}</span>
                    <span className="hero-service-desc">
                      {BLURB[service.slug] || service.tagline}
                    </span>
                  </span>
                  <span className="hero-service-num">{String(i + 1).padStart(2, '0')}</span>
                  <Icon name="arrow-right" size={17} className="hero-service-arrow" />
                </button>
              ))}
            </div>

            <Link to="/services" className="btn btn-primary btn-block btn-lg">
              BOOK NOW
              <Icon name="arrow-right" size={18} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
