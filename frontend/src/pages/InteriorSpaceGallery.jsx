import { useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import PageHero from '../components/ui/PageHero';
import Icon from '../components/ui/Icon';
import Reveal from '../components/ui/Reveal';
import { interiorSpaces, getSpaceBySlug, getDesignsBySpace } from '../data/interiorCatalog';

/**
 * /interior-by-choice/:spaceSlug — the design gallery for one space, with a
 * filter row across all spaces so switching space doesn't mean going back.
 */
export default function InteriorSpaceGallery() {
  const { spaceSlug } = useParams();
  const navigate = useNavigate();
  const space = getSpaceBySlug(spaceSlug);
  const [wishlist, setWishlist] = useState(() => new Set());

  if (!space) return <Navigate to="/interior-by-choice" replace />;

  const designs = getDesignsBySpace(spaceSlug);

  const toggleWishlist = (slug) => {
    setWishlist((prev) => {
      const next = new Set(prev);
      next.has(slug) ? next.delete(slug) : next.add(slug);
      return next;
    });
  };

  return (
    <>
      <PageHero
        eyebrow="INTERIOR BY CHOICE"
        title={space.name}
        breadcrumbs={[{ label: 'Interior by Choice', to: '/interior-by-choice' }, { label: space.name }]}
      />

      <section className="ibc-section">
        <div className="container">
          <div className="ibc-filter-row">
            {interiorSpaces.map((s) => (
              <button
                key={s.slug}
                type="button"
                className={`ibc-filter-chip ${s.slug === spaceSlug ? 'active' : ''}`}
                onClick={() => navigate(`/interior-by-choice/${s.slug}`)}
              >
                {s.name}
              </button>
            ))}
          </div>

          {designs.length === 0 ? (
            <p className="ibc-empty">More designs for this space are on the way. Book a home visit and our designer will bring options for you.</p>
          ) : (
            <div className="ibc-design-grid">
              {designs.map((design, i) => (
                <Reveal key={design.slug} delay={i * 40}>
                  <div className="ibc-design-card">
                    <Link to={`/interior-by-choice/${spaceSlug}/${design.slug}`} className="ibc-design-media">
                      <img src={design.image} alt={design.name} loading="lazy" />
                    </Link>
                    <button
                      type="button"
                      className={`ibc-wishlist ${wishlist.has(design.slug) ? 'active' : ''}`}
                      aria-label={wishlist.has(design.slug) ? `Remove ${design.name} from wishlist` : `Add ${design.name} to wishlist`}
                      onClick={() => toggleWishlist(design.slug)}
                    >
                      <Icon name="heart" size={17} />
                    </button>
                    <Link to={`/interior-by-choice/${spaceSlug}/${design.slug}`} className="ibc-design-body">
                      <span className="ibc-design-name">{design.name}</span>
                      <span className="ibc-design-price">₹{design.pricePerSqft} / sq.ft.</span>
                    </Link>
                  </div>
                </Reveal>
              ))}
            </div>
          )}

          <Link to="/interior-by-choice/book" className="btn btn-primary ibc-customise-cta">
            Customise Your Design
            <Icon name="arrow-right" size={17} />
          </Link>
        </div>
      </section>
    </>
  );
}
