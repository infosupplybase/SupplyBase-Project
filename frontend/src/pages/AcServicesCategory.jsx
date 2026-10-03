import { useState } from 'react';
import { Link } from 'react-router-dom';
import PageHero from '../components/ui/PageHero';
import Icon from '../components/ui/Icon';
import { acCategories } from '../data/acContent';

const categoryImages = {
  regular: '/assets/ac-services/matched/jet-cleaning.jpg',
  repair: '/assets/ac-services/matched/electrical-diagnosis.webp',
  installation: '/assets/ac-services/installation.png',
  uninstallation: '/assets/ac-services/uninstallation.jpeg',
  'gas-charging': '/assets/ac-services/matched/pressure-testing.jpg',
  amc: '/assets/ac-services/matched/filter-cleaning.jpg',
};

const categoryIcons = {
  regular: 'settings',
  repair: 'settings',
  installation: 'plus',
  uninstallation: 'settings',
  'gas-charging': 'settings',
  amc: 'calendar',
};

function CategoryVisual({ category }) {
  const [failedImage, setFailedImage] = useState(null);
  const image = categoryImages[category.slug];
  const showImage = image && failedImage !== image;

  return (
    <span
      className="plb-overview-photo"
      aria-hidden="true"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: 125,
        overflow: 'hidden',
        background: '#fff8e8',
        color: '#9a7317',
      }}
    >
      {showImage ? (
        <img
          src={image}
          alt=""
          width={300}
          height={125}
          loading="lazy"
          decoding="async"
          onError={() => setFailedImage(image)}
          style={{
            display: 'block',
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center',
          }}
        />
      ) : (
        <Icon
          name={categoryIcons[category.slug] || 'settings'}
          size={42}
        />
      )}
    </span>
  );
}

export default function AcServicesCategory({
  modal = false,
  onSelectFlow,
}) {
  return (
    <>
      {!modal && (
        <PageHero
          eyebrow="AC SERVICES"
          title="AC Services"
          text="Choose the care your air conditioner needs."
          breadcrumbs={[
            { label: 'Services', to: '/services' },
            { label: 'AC Services' },
          ]}
        />
      )}

      <section
        className={modal ? 'plb-section !py-0 !pb-4' : 'plb-section'}
      >
        <div
          className={
            modal
              ? 'container container-narrow !w-full !max-w-none !px-0'
              : 'container container-narrow'
          }
        >
          <div
            className="plb-overview-grid ac-category-compact"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
              gap: 14,
            }}
          >
            {acCategories.map((category) => {
              const content = (
                <>
                  <CategoryVisual category={category} />

                  <span className="plb-overview-name">
                    {category.label}
                    <Icon name="chevron-right" size={16} />
                  </span>

                  <span
                    className="plb-overview-price-note"
                    style={{ paddingTop: 8 }}
                  >
                    {category.hint}
                  </span>
                </>
              );

              return modal ? (
                <button
                  key={category.slug}
                  type="button"
                  className="plb-overview-card !w-full !text-left"
                  onClick={() => onSelectFlow?.(category.slug)}
                >
                  {content}
                </button>
              ) : (
                <Link
                  key={category.slug}
                  to={`/services/ac-services/${category.slug}`}
                  className="plb-overview-card"
                >
                  {content}
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}