import { useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import PageHero from '../components/ui/PageHero';
import Icon from '../components/ui/Icon';
import {
  getSpaceBySlug,
  getDesignBySlug,
  interiorColourNames,
  interiorFeatures,
  HOME_VISIT_FEE,
} from '../data/interiorCatalog';
import { whatsappHref } from '../lib/contact';

/**
 * /interior-by-choice/:spaceSlug/:designSlug
 *
 * One design's detail page:
 * - Design images
 * - What's included
 * - Estimated price and exclusions
 * - Available colours
 * - Features and material specifications
 * - Consultation booking and WhatsApp quote
 */
export default function InteriorDesignDetail() {
  const { spaceSlug, designSlug } = useParams();

  const space = getSpaceBySlug(spaceSlug);
  const design = getDesignBySlug(spaceSlug, designSlug);

  const [activeColour, setActiveColour] = useState(null);
  const [shared, setShared] = useState(false);
  const [activeView, setActiveView] = useState(0);

  if (!space || !design) {
    return <Navigate to="/interior-by-choice" replace />;
  }

  const isTvWall = design.spaceSlug === 'tv-wall';
  const isStudy = design.spaceSlug === 'study';

  // Read the detail data belonging to the selected category.
  const details = isTvWall
    ? design.tvDetails
    : isStudy
      ? design.studyDetails
      : null;

  const colourHex =
    activeColour != null ? design.colours[activeColour] : null;

  const colourName = colourHex
    ? interiorColourNames[colourHex] || colourHex
    : '';

  const quoteMessage = `Hello Supplybase, I would like a quote for the ${design.name}${
    colourName ? ` in ${colourName}` : ''
  }. Estimated range: ${
    design.priceRange || design.estimatedPrice || 'To be confirmed'
  }. Please arrange a measurement and consultation.`;

  const bookHref = `/interior-by-choice/${spaceSlug}/${designSlug}/book${
    colourName ? `?colour=${encodeURIComponent(colourName)}` : ''
  }`;

  const handleShare = async () => {
    const url = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({
          title: design.name,
          url,
        });
        return;
      } catch {
        // The user cancelled the share sheet.
        return;
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    } catch {
      // Clipboard unavailable. The URL remains in the address bar.
    }
  };

  // Study uses its catalogue gallery paths.
  // TV Wall keeps its existing image naming convention.
  const gallery = design.galleryImages || {};

  const designViews = isStudy
    ? [
        {
          label: 'Front View',
          src: gallery.front || design.image,
        },
        {
          label: 'Side View',
          src: gallery.side || design.image,
        },
        {
          label: 'Detail View',
          src: gallery.detail || design.image,
        },
      ]
    : isTvWall
      ? [
          {
            label: 'Front View',
            src: design.image,
          },
          {
            label: 'Side View',
            src: design.image.replace(/\.webp$/i, '-side.webp'),
          },
          {
            label: 'Detail View',
            src: design.image.replace(/\.webp$/i, '-detail.webp'),
          },
        ]
      : [];

  const displayPrice =
    design.priceRange || design.estimatedPrice;

  const formatImageError = (event) => {
    event.currentTarget.onerror = null;
    event.currentTarget.src = design.fallbackImage || design.image;
  };

  return (
    <>
      <PageHero
        eyebrow={space.name}
        title={design.name}
        breadcrumbs={[
          {
            label: 'Interior by Choice',
            to: '/interior-by-choice',
          },
          {
            label: space.name,
            to: `/interior-by-choice/${spaceSlug}`,
          },
          {
            label: design.name,
          },
        ]}
      />

      <section className="ibc-section">
        <div className="container container-narrow">
          {/* MAIN DESIGN IMAGE */}
          <div
            className={`ibc-detail-media ${
              design.spaceSlug === 'entrance'
                ? 'ibc-detail-media--entrance'
                : ''
            }`}
          >
            <img
              src={
                designViews.length > 0
                  ? designViews[activeView]?.src || design.image
                  : design.image
              }
              alt={`${design.name}${
                designViews.length > 0
                  ? ` - ${designViews[activeView]?.label || 'View'}`
                  : ''
              }`}
              onError={formatImageError}
            />
          </div>

          {/* FRONT / SIDE / DETAIL IMAGE SELECTOR */}
          {designViews.length > 0 && (
            <div className="ibc-study-views">
              {designViews.map((view, index) => (
                <button
                  key={view.label}
                  type="button"
                  className={`ibc-study-view ${
                    activeView === index ? 'active' : ''
                  }`}
                  onClick={() => setActiveView(index)}
                  aria-label={`Show ${view.label}`}
                  aria-pressed={activeView === index}
                >
                  <img
                    src={view.src}
                    alt={`${design.name} ${view.label}`}
                    loading="lazy"
                    onError={formatImageError}
                  />
                  <span>{view.label}</span>
                </button>
              ))}
            </div>
          )}

          {/* DESIGN TITLE AND PRICE */}
          <div className="ibc-detail-head">
            <div>
              <h2>{design.name}</h2>
              <p className="ibc-detail-tagline">{design.tagline}</p>
            </div>

            <span className="ibc-detail-price">
              {displayPrice || `₹${design.pricePerSqft} / sq.ft.`}
            </span>
          </div>

          {/* DESCRIPTION */}
          {design.description && (
            <p className="ibc-detail-description">
              {design.description}
            </p>
          )}

          {/* WHAT'S INCLUDED */}
          {details?.included?.length > 0 && (
            <section className="ibc-tv-pdf-section">
              <h3>What's Included</h3>

              <div className="ibc-tv-included-grid">
                {details.included.map((item) => (
                  <div
                    key={item}
                    className="ibc-tv-included-card"
                  >
                    <span className="ibc-tv-check">✓</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ESTIMATED PRICE */}
          {displayPrice && (
            <section className="ibc-tv-price-box">
              <span>Estimated Price</span>

              <strong>{displayPrice}</strong>

              <p>
                Final price depends on actual dimensions, material
                selection, hardware and site measurements. A detailed
                quotation will be provided after consultation.
              </p>
            </section>
          )}

          {/* EXCLUSIONS */}
          {details?.exclusions && (
            <section className="ibc-tv-exclusions">
              <strong>Exclusions</strong>
              <p>{details.exclusions}</p>
            </section>
          )}

          {/* OTHER CATEGORIES: EXISTING PRICE NOTE */}
          {!details && displayPrice && (
            <p className="ibc-estimate-note">
              Estimated range only. Final pricing depends on
              measurements, materials, design customisation and
              site conditions.
            </p>
          )}

          {/* AVAILABLE COLOURS */}
          {design.colours.length > 0 && (
            <div className="ibc-detail-block">
              <h3>Available Colours</h3>

              <div
                className="ibc-swatch-row"
                role="group"
                aria-label="Colour"
              >
                {design.colours.map((hex, index) => {
                  const name =
                    interiorColourNames[hex] || `Colour ${index + 1}`;

                  return (
                    <button
                      key={hex}
                      type="button"
                      className={`ibc-swatch ${
                        index === activeColour ? 'active' : ''
                      }`}
                      style={{ background: hex }}
                      aria-label={name}
                      aria-pressed={index === activeColour}
                      title={name}
                      onClick={() => setActiveColour(index)}
                    />
                  );
                })}
              </div>

              <p className="ibc-swatch-name">
                {colourName
                  ? `Selected: ${colourName}`
                  : 'Tap a colour to add it to your booking.'}
              </p>
            </div>
          )}

          {/* FEATURES */}
          {design.features.length > 0 && (
            <div className="ibc-feature-row">
              {design.features.map((key) => {
                const feature = interiorFeatures[key];

                if (!feature) return null;

                return (
                  <div className="ibc-feature" key={key}>
                    <Icon name={feature.icon} size={20} />
                    <span>{feature.label}</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* MATERIAL DETAILS */}
          <div className="ibc-detail-block">
            <h3>Material Details</h3>

            <table className="ibc-material-table">
              <tbody>
                {Object.entries(design.materialDetails).map(
                  ([label, value]) => (
                    <tr key={label}>
                      <th>{label}</th>
                      <td>{value}</td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>

          {/* SHARE, WHATSAPP AND BOOKING */}
          <div className="ibc-detail-actions">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={handleShare}
            >
              <Icon name="share" size={17} />
              {shared ? 'Link Copied' : 'Share'}
            </button>

            {displayPrice && (
              <a
                href={whatsappHref(quoteMessage)}
                className="btn btn-whatsapp"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Icon name="whatsapp" size={17} />
                Get Quote on WhatsApp
              </a>
            )}

            <Link to={bookHref} className="btn btn-primary">
              {displayPrice
                ? `Book a Consultation – ₹${HOME_VISIT_FEE}`
                : `Book Home Visit – ₹${HOME_VISIT_FEE}`}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
