import { useMemo, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import Icon from '../components/ui/Icon';
import PaintingHero from '../components/painting/PaintingHero';
import { getCategoryBySlug, getProjectsByCategory, idPackageTiers } from '../data/interiorDesignContent';

const SAVED_KEY = 'id-saved-concepts';

/** A real, if local-only, saved-concepts feature — persisted per browser
    via localStorage, not just ephemeral component state — per the brief's
    explicit instruction not to ship a dead heart button when no backend
    favourites feature exists yet. */
function useSavedConcepts() {
  const [saved, setSaved] = useState(() => {
    try {
      return new Set(JSON.parse(localStorage.getItem(SAVED_KEY) || '[]'));
    } catch {
      return new Set();
    }
  });

  const toggle = (slug) => {
    setSaved((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      try {
        localStorage.setItem(SAVED_KEY, JSON.stringify([...next]));
      } catch {
        /* private browsing / storage disabled — the toggle still works for this session */
      }
      return next;
    });
  };

  return { saved, toggle };
}

/**
 * /services/interior-design/:categorySlug — project grid for one category,
 * with an All/Standard/Premium/Luxury tier filter. The reference's own
 * "All (12)" pill always showed a fixed number; this counts the real,
 * currently-filtered array instead (per the brief).
 */
export default function InteriorDesignCatalogue() {
  const { categorySlug } = useParams();
  const category = getCategoryBySlug(categorySlug);
  const [tier, setTier] = useState('all');
  const { saved, toggle } = useSavedConcepts();

  const projects = useMemo(() => (category ? getProjectsByCategory(category.slug) : []), [category]);
  const visible = tier === 'all' ? projects : projects.filter((p) => p.tier === tier);

  if (!category) return <Navigate to="/services/interior-design" replace />;

  return (
    <>
      <PaintingHero eyebrow="INTERIOR DESIGN" title={category.name} tagline={category.tagline} image={category.image} trustPoints={[]} />

      <section className="pnt-section">
        <div className="container container-narrow">
          <div className="id-filter-pills" role="tablist">
            <button type="button" role="tab" aria-selected={tier === 'all'} className={`id-filter-pill ${tier === 'all' ? 'active' : ''}`} onClick={() => setTier('all')}>
              All ({projects.length})
            </button>
            {idPackageTiers.map((t) => (
              <button
                key={t.key}
                type="button"
                role="tab"
                aria-selected={tier === t.key}
                className={`id-filter-pill ${tier === t.key ? 'active' : ''}`}
                onClick={() => setTier(t.key)}
              >
                {t.name}
              </button>
            ))}
          </div>

          <div className="id-project-grid">
            {visible.map((p) => (
              <Link key={p.slug} to={`/services/interior-design/${category.slug}/${p.slug}`} className="id-project-card">
                <span className="id-project-photo">
                  <img src={p.image} alt="" loading="lazy" />
                  <button
                    type="button"
                    className={`id-save-btn ${saved.has(p.slug) ? 'saved' : ''}`}
                    aria-label={saved.has(p.slug) ? 'Remove from saved concepts' : 'Save this concept'}
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggle(p.slug); }}
                  >
                    <Icon name="heart" size={16} />
                  </button>
                </span>
                <span className="id-project-body">
                  <strong>{p.name}</strong>
                  <span><Icon name="map-pin" size={13} /> {p.location}</span>
                </span>
              </Link>
            ))}
          </div>

          {visible.length === 0 && (
            <p className="question-hint">No projects in this tier yet — try a different filter.</p>
          )}
        </div>
      </section>
    </>
  );
}
