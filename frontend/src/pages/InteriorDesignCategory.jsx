import { Link } from 'react-router-dom';
import ServiceSeoContent from '../components/services/ServiceSeoContent';
import PaintingHero from '../components/painting/PaintingHero';
import {
  idOverviewIntro,
  idTrustPoints,
  idCategories,
  ID_HERO_IMAGE,
} from '../data/interiorDesignContent';

function CategoryContent({ category }) {
  return (
    <>
      <span
        className="id-category-photo"
        style={{
          display: 'block',
          width: '100%',
          height: 'clamp(90px, 16vw, 115px)',
          flexShrink: 0,
          overflow: 'hidden',
        }}
      >
        <img
          src={category.image}
          alt={category.name}
          loading="lazy"
          decoding="async"
          style={{
            display: 'block',
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center',
          }}
        />
      </span>

      <span
        className="id-category-body"
        style={{
          display: 'flex',
          flex: 1,
          flexDirection: 'column',
          alignItems: 'flex-start',
          gap: 6,
          padding: '12px',
          minWidth: 0,
        }}
      >
        <strong style={{ lineHeight: 1.3 }}>
          {category.name}
        </strong>

        <span style={{ lineHeight: 1.5 }}>
          {category.tagline}
        </span>

        <span
          className="id-category-area"
          style={{
            marginTop: 'auto',
            paddingTop: 4,
            lineHeight: 1.4,
          }}
        >
          {category.areaNote}
        </span>
      </span>
    </>
  );
}

export default function InteriorDesignCategory({
  modal = false,
  onSelectCategory,
}) {
  const cardStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'stretch',
    width: '100%',
    height: '100%',
    minWidth: 0,
    margin: 0,
    padding: 0,
    boxSizing: 'border-box',
    overflow: 'hidden',
    textAlign: 'left',
    font: 'inherit',
    color: 'inherit',
    textDecoration: 'none',
    border: '1px solid #e5e7eb',
    borderRadius: 14,
    background: '#fff',
    cursor: 'pointer',
  };

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
        <div
          className={
            modal ? 'w-full' : 'container container-narrow'
          }
        >
          <div
            className="id-category-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
              alignItems: 'stretch',
              gap: 12,
              width: '100%',
              margin: 0,
              padding: 0,
            }}
          >
            {idCategories.map((category) =>
              modal ? (
                <button
                  key={category.slug}
                  type="button"
                  className="id-category-card"
                  style={cardStyle}
                  onClick={() =>
                    onSelectCategory?.(category.slug)
                  }
                >
                  <CategoryContent category={category} />
                </button>
              ) : (
                <Link
                  key={category.slug}
                  to={`/services/interior-design/${category.slug}`}
                  className="id-category-card"
                  style={cardStyle}
                >
                  <CategoryContent category={category} />
                </Link>
              )
            )}
          </div>
        </div>
      </section>
      {!modal && <ServiceSeoContent slug="interior-design" />}
    </>
  );
}