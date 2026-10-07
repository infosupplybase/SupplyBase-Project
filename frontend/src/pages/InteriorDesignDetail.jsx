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
 * /interior-by-choice/:spaceSlug/:designSlug — one design's detail page:
 * colours, features, material spec, and the entry point into the paid
 * home-visit booking flow.
 */
export default function InteriorDesignDetail() {
  const { spaceSlug, designSlug } = useParams();
  const space = getSpaceBySlug(spaceSlug);
  const design = getDesignBySlug(spaceSlug, designSlug);
  // No colour counts as chosen until the customer taps one.
  const [activeColour, setActiveColour] = useState(null);
  const [shared, setShared] = useState(false);

  if (!space || !design) return <Navigate to="/interior-by-choice" replace />;

  const colourHex = activeColour != null ? design.colours[activeColour] : null;
  const colourName = colourHex ? interiorColourNames[colourHex] || colourHex : '';
  const quoteMessage = `Hello Supplybase, I would like a quote for the ${design.name}${colourName ? ` in ${colourName}` : ''}. Estimated range: ${design.priceRange}. Please arrange a measurement and consultation.`;
  const bookHref = `/interior-by-choice/${spaceSlug}/${designSlug}/book${
    colourName ? `?colour=${encodeURIComponent(colourName)}` : ''
  }`;

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: design.name, url });
        return;
      } catch {
        /* user cancelled the share sheet — fall through to nothing */
        return;
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    } catch {
      /* clipboard blocked — no fallback needed, the link is in the address bar */
    }
  };

  // TV wall designs carry what's included and the exclusions from the catalogue.
  const tvDetails = design.spaceSlug === 'tv-wall' ? design.tvDetails : null;

  return (
    <>
      <PageHero
        eyebrow={space.name}
        title={design.name}
        breadcrumbs={[
          { label: 'Interior by Choice', to: '/interior-by-choice' },
          { label: space.name, to: `/interior-by-choice/${spaceSlug}` },
          { label: design.name },
        ]}
      />

      <section className="ibc-section">
        <div className="container container-narrow">
          <div
            className={`ibc-detail-media ${
              design.spaceSlug === 'entrance' ? 'ibc-detail-media--entrance' : ''
            }`}
          >
           <img src={design.image} alt={design.name} onError={(e) => { e.currentTarget.onerror = null;
           e.currentTarget.src = design.fallbackImage;}}/>
          </div>

          <div className="ibc-detail-head">
            <div>
              <h2>{design.name}</h2>
              <p className="ibc-detail-tagline">{design.tagline}</p>
            </div>
            <span className="ibc-detail-price">
              {design.priceRange || `₹${design.pricePerSqft} / sq.ft.`}
            </span>
          </div>

          {design.description && (
            <p className="ibc-detail-description">{design.description}</p>
          )}

          {tvDetails ? (
            <>
              {tvDetails.included?.length > 0 && (
                <section className="ibc-tv-pdf-section">
                  <h3>What's Included</h3>
                  <div className="ibc-tv-included-grid">
                    {tvDetails.included.map((item) => (
                      <div key={item} className="ibc-tv-included-card">
                        <span className="ibc-tv-check">✓</span>
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              <section className="ibc-tv-price-box">
                <span>Estimated Price</span>
                <strong>{design.priceRange}</strong>
                <p>
                  Final price depends on actual dimensions, material selection,
                  hardware and site measurements. A detailed quotation will be
                  provided after consultation.
                </p>
              </section>

              {tvDetails.exclusions && (
                <section className="ibc-tv-exclusions">
                  <strong>Exclusions</strong>
                  <p>{tvDetails.exclusions}</p>
                </section>
              )}
            </>
          ) : (
            design.priceRange && (
              <p className="ibc-estimate-note">
                Estimated range only. Final pricing depends on measurements,
                materials, design customisation and site conditions.
              </p>
            )
          )}

          {design.colours.length > 0 && (
            <div className="ibc-detail-block">
              <h3>Available Colours</h3>
              <div className="ibc-swatch-row" role="group" aria-label="Colour">
                {design.colours.map((hex, i) => {
                  const name = interiorColourNames[hex] || `Colour ${i + 1}`;
                  return (
                    <button
                      key={hex}
                      type="button"
                      className={`ibc-swatch ${i === activeColour ? 'active' : ''}`}
                      style={{ background: hex }}
                      aria-label={name}
                      aria-pressed={i === activeColour}
                      title={name}
                      onClick={() => setActiveColour(i)}
                    />
                  );
                })}
              </div>
              <p className="ibc-swatch-name">
                {colourName ? `Selected: ${colourName}` : 'Tap a colour to add it to your booking.'}
              </p>
            </div>
          )}

          {design.features.length > 0 && (
            <div className="ibc-feature-row">
              {design.features.map((key) => {
                const f = interiorFeatures[key];
                if (!f) return null;
                return (
                  <div className="ibc-feature" key={key}>
                    <Icon name={f.icon} size={20} />
                    <span>{f.label}</span>
                  </div>
                );
              })}
            </div>
          )}

          <div className="ibc-detail-block">
            <h3>Material Details</h3>
            <table className="ibc-material-table">
              <tbody>
                {Object.entries(design.materialDetails).map(([label, value]) => (
                  <tr key={label}>
                    <th>{label}</th>
                    <td>{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="ibc-detail-actions">
            <button type="button" className="btn btn-ghost" onClick={handleShare}>
              <Icon name="share" size={17} />
              {shared ? 'Link Copied' : 'Share'}
            </button>
            {design.priceRange && (
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
              {design.priceRange
                ? `Book a Consultation – ₹${HOME_VISIT_FEE}`
                : `Book Home Visit – ₹${HOME_VISIT_FEE}`}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
