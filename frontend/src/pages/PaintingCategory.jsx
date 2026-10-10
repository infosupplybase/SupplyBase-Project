import { Link } from 'react-router-dom';
import ServiceSeoContent from '../components/services/ServiceSeoContent';
import Icon from '../components/ui/Icon';
import PaintingHero from '../components/painting/PaintingHero';
import {
  paintingOverviewIntro,
  paintingCategories,
} from '../data/paintingContent';

export default function PaintingCategory({
  modal = false,
  onSelectFlow,
}) {
  // Renovation is chosen inside Full Home (as a painting type), so the page
  // offers just the two journeys.
  const categories = paintingCategories.filter(
    (category) =>
      category.slug === 'full-home' ||
      category.slug === 'few-walls'
  );

  const renderCardContent = (category) => (
    <>
      <img
        src={category.image}
        alt=""
        loading="lazy"
        style={{
          display: 'block',
          width: '100%',
          height: 'clamp(120px, 25vw, 180px)',
          objectFit: 'cover',
        }}
      />

      <span
        style={{
          display: 'flex',
          flex: 1,
          flexDirection: 'column',
          gap: 8,
          padding: 14,
        }}
      >
        <strong
          style={{
            color: '#202020',
            fontSize: 16,
            lineHeight: 1.4,
          }}
        >
          {category.name}
        </strong>

        <span
          style={{
            color: '#737373',
            fontSize: 13,
            lineHeight: 1.5,
          }}
        >
          {category.tagline}
        </span>

        <span
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
            marginTop: 'auto',
            paddingTop: 10,
            color: '#946b08',
            fontSize: 13,
            fontWeight: 700,
          }}
        >
          Select service
          <Icon name="arrow-right" size={18} />
        </span>
      </span>
    </>
  );

  const cardStyle = {
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
    height: '100%',
    padding: 0,
    overflow: 'hidden',
    border: '1px solid #e7e7e7',
    borderRadius: 14,
    background: '#ffffff',
    boxShadow: '0 4px 14px rgba(0, 0, 0, 0.06)',
    textAlign: 'left',
    textDecoration: 'none',
    font: 'inherit',
    cursor: 'pointer',
  };

  return (
    <>
      {!modal && (
        <PaintingHero
          eyebrow={paintingOverviewIntro.eyebrow}
          title={paintingOverviewIntro.title}
          tagline={paintingOverviewIntro.text}
        />
      )}

      <section
        className={`pnt-section ${modal ? '!m-0 !p-0' : ''}`}
      >
        <div
          className={`container container-narrow ${
            modal ? '!m-0 !p-0 !max-w-none' : ''
          }`}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
              gap: 14,
              padding: modal ? '4px 0 12px' : '24px 0',
            }}
          >
            {categories.map((category) =>
              modal ? (
                <button
                  key={category.slug}
                  type="button"
                  style={cardStyle}
                  onClick={() => onSelectFlow?.(category.slug)}
                >
                  {renderCardContent(category)}
                </button>
              ) : (
                <Link
                  key={category.slug}
                  to={category.route}
                  style={cardStyle}
                >
                  {renderCardContent(category)}
                </Link>
              )
            )}
          </div>
        </div>
      </section>
      {!modal && <ServiceSeoContent slug="painting" />}
    </>
  );
}