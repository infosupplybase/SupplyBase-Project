import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../ui/Icon';
import api, { friendlyError } from '../../lib/api';
import { getServiceBySlug } from '../../data/services';
import "../../styles/grid.css";

/* ============================================================
   MAIN SERVICE ICONS (unused currently — kept for future)
   ============================================================ */
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

/* ============================================================
   MAIN SERVICE IMAGES (public/assets/icons/)
   ============================================================ */
const MAIN_SERVICE_IMAGES = {
  'interior-design': '/assets/icons/fullhome.png',
  'interior-by-choice': '/assets/icons/livingroom.jpg',
  painting: '/assets/icons/renopaint.png',
  waterproofing: '/assets/icons/externalwp.jpg',
  'pop-ceiling-design': '/assets/icons/ceiling.jpg',
  plumbing: '/assets/icons/tap.jpg',
  electrical: '/assets/icons/home-elec.jpg',
  'other-services': '/assets/icons/architect.jpg',
};

const FALLBACK_IMAGE = '/assets/icons/fullhome.jpg';

function getServiceImage(slug) {
  return MAIN_SERVICE_IMAGES[slug] || FALLBACK_IMAGE;
}

/* ============================================================
   HELPERS
   ============================================================ */
function routeFor(slug) {
  // Interior Design → Interior by Choice catalogue page
  if (slug === 'interior-design') return '/interior-by-choice';
  if (slug === 'interior-by-choice') return '/interior-by-choice';

  // Everything else → its service landing page
  return `/services/${slug}`;
}

/* ============================================================
   RIGHT SIDE IMAGES — fixed collage (interior)
   ============================================================ */
const COLLAGE_IMAGES = [
  'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&q=80&w=800',
];

/* ============================================================
   COMPONENT
   ============================================================ */
export default function PopularServices() {
  const [categories, setCategories] = useState(null);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  /* Load Services */
  useEffect(() => {
    let cancelled = false;
    api.services()
      .then((data) => {
        if (cancelled) return;
        const merged = [...data]
          .filter((item) => item.active !== false)
          .sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999))
          .map((item) => {
            const localService = getServiceBySlug(item.slug);
            return {
              ...item,
              icon: item.icon || localService?.icon || 'settings',
            };
          });
        setCategories(merged);
      })
      .catch((err) => {
        if (!cancelled) setError(friendlyError(err));
      });
    return () => { cancelled = true; };
  }, []);

  /* Filter services by search query */
  const filteredServices = useMemo(() => {
    if (!categories) return [];
    const query = search.trim().toLowerCase();
    if (!query) return categories;
    return categories.filter((service) =>
      service.name.toLowerCase().includes(query)
    );
  }, [categories, search]);

  return (
    <section className="uc-section">
      <div className="uc-container">

        {/* ================= TITLE ================= */}
        <div className="uc-header">
          <h1 className="uc-title">Home Services at your Doorstep</h1>
        </div>

        {/* ================= MAIN GRID ================= */}
        <div className="uc-main-grid">

          {/* ================= LEFT COLUMN ================= */}
          <div className="uc-left-col">

            {/* --- SEARCH BAR --- */}
            <div className="uc-search-wrapper">
              <div className="uc-search-box">
                <Icon name="search" size={20} strokeWidth={1.6} />
                <input
                  type="text"
                  value={search}
                  placeholder="Search for a service"
                  onChange={(e) => setSearch(e.target.value)}
                  aria-label="Search for a service"
                />
              </div>
            </div>

            {/* --- MAIN SERVICES GRID --- */}
            <div className="uc-main-services">
              {error && (
                <div className="uc-no-result">{error}</div>
              )}

              {!error && categories && filteredServices.length === 0 && (
                <div className="uc-no-result">No services found</div>
              )}

              {!error && filteredServices.map((service) => (
                <Link
                  key={service.slug}
                  to={routeFor(service.slug)}
                  className="uc-main-service-card"
                >
                  {/* <span className="uc-main-service-icon-box">
                    <img
                      src={getServiceImage(service.slug)}
                      alt={service.name}
                      loading="lazy"
                      onError={(e) => {
                        if (!e.target.src.includes('fullhome.jpg')) {
                          e.target.src = FALLBACK_IMAGE;
                        }
                      }}
                    />
                  </span> */}

                  <span className="uc-main-service-icon-box">
  <img
    src={getServiceImage(service.slug)}
    alt={service.name}
    loading="lazy"
    className={
      ['interior-design', 'painting', 'waterproofing'].includes(service.slug)
        ? 'uc-icon-large'
        : ''
    }
    onError={(e) => {
      if (!e.target.src.includes('fullhome.jpg')) {
        e.target.src = FALLBACK_IMAGE;
      }
    }}
  />
</span>

                  <span className="uc-main-service-name">
                    {service.name}
                  </span>
                </Link>
              ))}
            </div>
          </div>

          {/* ================= RIGHT COLUMN — FIXED IMAGE COLLAGE ================= */}
          <div className="uc-right-col">
            <div className="uc-image-collage">
              <div className="uc-img-wrapper uc-img-1">
                <img src={COLLAGE_IMAGES[0]} alt="Interior" loading="lazy" />
              </div>
              <div className="uc-img-wrapper uc-img-2">
                <img src={COLLAGE_IMAGES[1]} alt="Interior" loading="lazy" />
              </div>
              <div className="uc-img-wrapper uc-img-3">
                <img src={COLLAGE_IMAGES[2]} alt="Interior" loading="lazy" />
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}