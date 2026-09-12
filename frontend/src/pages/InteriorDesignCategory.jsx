import { useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../components/ui/Icon';
import PaintingHero from '../components/painting/PaintingHero';
import { idOverviewIntro, idTrustPoints, idProjectTypeFilters, idCategories, ID_HERO_IMAGE } from '../data/interiorDesignContent';

/**
 * /services/interior-design — landing page: type filter pills (All /
 * Apartments / Villas / Custom) + four category cards. "Custom" carries
 * the project type into the existing quotation enquiry flow rather than
 * inventing a fixed custom package (per the brief).
 */
export default function InteriorDesignCategory({
  modal = false,
  onSelectCategory,
  onCustom,
}) {
  const [filter, setFilter] = useState('all');
  const visible = filter === 'all' ? idCategories : idCategories.filter((c) => c.type === filter);

  return (
    <>
      {!modal && (
  <PaintingHero
    eyebrow={idOverviewIntro.eyebrow}
    title={idOverviewIntro.title}
    tagline={idOverviewIntro.text}
    image={ID_HERO_IMAGE}
    trustPoints={idTrustPoints}
  />
)}

      <section className={modal ? 'w-full' : 'pnt-section'}>
  <div className={modal ? 'w-full' : 'container container-narrow'}>
          <div className="id-filter-pills" role="tablist">
            {idProjectTypeFilters.map((f) => (
              f.key === 'custom' ? (
                modal ? (
  <button
    key={f.key}
    type="button"
    className="id-filter-pill"
    onClick={onCustom}
  >
    {f.label}
  </button>
) : (
  <Link
    key={f.key}
    to="/quote?service=interior-design"
    className="id-filter-pill"
  >
    {f.label}
  </Link>
)
              ) : (
                <button
                  key={f.key}
                  type="button"
                  role="tab"
                  aria-selected={filter === f.key}
                  className={`id-filter-pill ${filter === f.key ? 'active' : ''}`}
                  onClick={() => setFilter(f.key)}
                >
                  {f.label}
                </button>
              )
            ))}
          </div>

          <div className="id-category-grid">
            {visible.map((cat) =>
  modal ? (
    <button
      key={cat.slug}
      type="button"
      className="id-category-card !w-full !text-left"
      onClick={() => onSelectCategory?.(cat.slug)}
    >
      <span className="id-category-photo">
        <img
          src={cat.image}
          alt=""
          loading="lazy"
        />
      </span>

      <span className="id-category-body">
        <strong>{cat.name}</strong>
        <span>{cat.tagline}</span>
        <span className="id-category-area">
          {cat.areaNote}
        </span>
      </span>

      <Icon
        name="chevron-right"
        size={18}
        className="pnt-overview-arrow"
      />
    </button>
  ) : (
    <Link
      key={cat.slug}
      to={`/services/interior-design/${cat.slug}`}
      className="id-category-card"
    >
      <span className="id-category-photo">
        <img
          src={cat.image}
          alt=""
          loading="lazy"
        />
      </span>

      <span className="id-category-body">
        <strong>{cat.name}</strong>
        <span>{cat.tagline}</span>
        <span className="id-category-area">
          {cat.areaNote}
        </span>
      </span>

      <Icon
        name="chevron-right"
        size={18}
        className="pnt-overview-arrow"
      />
    </Link>
  )
)}
          </div>
        </div>
      </section>
    </>
  );
}
