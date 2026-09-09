import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../ui/Icon';
import api, { friendlyError } from '../../lib/api';

/** Where the card should open — interior-by-choice and electrical each have
    their own richer page instead of the generic booking wizard. */
function routeFor(slug) {
  if (slug === 'interior-by-choice') return '/interior-by-choice';
  if (slug === 'electrical') return '/services/electrical';
  return `/services/${slug}`;
}

/** Backend `icon` values are free-text labels, not guaranteed to match a
    key in components/ui/Icon.jsx — used only if a category has no matching
    file in /assets/popular-services (see iconSrc below). */
const ICON_BY_SLUG = {
  'interior-design': 'sofa',
  'interior-by-choice': 'layers',
  painting: 'roller',
  waterproofing: 'droplet',
  'pop-ceiling-design': 'ceiling',
  plumbing: 'tap',
  electrical: 'bolt',
  'other-services': 'settings',
};

/** The client-supplied gold-outline icon for this card, one file per main
    category at /assets/popular-services/<slug>-icon.png — same naming
    convention as the photo itself. */
const iconSrc = (slug) => `/assets/popular-services/${slug}-icon.png`;

export default function PopularServices() {
  const [categories, setCategories] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    api
      .services()
      .then((data) => {
        if (!cancelled) setCategories(data);
      })
      .catch((err) => {
        if (!cancelled) setError(friendlyError(err));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="popular-services">
      <div className="container">
        <h2 className="popular-services-title">Popular Services</h2>

        {error && (
          <div role="alert" className="alert alert-error">
            <Icon name="info" size={18} />
            <span>{error}</span>
          </div>
        )}

        {!error && !categories && (
          <div className="service-tile-grid" aria-hidden="true">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="service-tile service-tile-skeleton" />
            ))}
          </div>
        )}

        {!error && categories && (
          <div className="service-tile-grid">
            {categories.map((category) => (
              <Link key={category.slug} to={routeFor(category.slug)} className="service-tile">
                <span className="service-tile-photo">
                  {category.heroImage ? (
                    <img src={category.heroImage} alt="" width={200} height={200} loading="lazy" />
                  ) : (
                    <span className="service-tile-placeholder">
                      <Icon name={ICON_BY_SLUG[category.slug] || category.icon} size={34} />
                    </span>
                  )}
                </span>
                <img
                  className="service-tile-icon"
                  src={iconSrc(category.slug)}
                  alt=""
                  width={34}
                  height={34}
                  loading="lazy"
                  onError={(e) => {
                    // A category with no dedicated icon file falls back to
                    // the inline icon set instead of a broken image.
                    e.currentTarget.style.display = 'none';
                  }}
                />
                <span className="service-tile-name">{category.name}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
