import { useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import PageHero from '../components/ui/PageHero';
import Icon from '../components/ui/Icon';
import { getSpaceBySlug, getDesignBySlug, interiorFeatures, HOME_VISIT_FEE } from '../data/interiorCatalog';

/**
 * /interior-by-choice/:spaceSlug/:designSlug — one design's detail page:
 * colours, features, material spec, and the entry point into the paid
 * home-visit booking flow.
 */
export default function InteriorDesignDetail() {
  const { spaceSlug, designSlug } = useParams();
  const space = getSpaceBySlug(spaceSlug);
  const design = getDesignBySlug(spaceSlug, designSlug);
  const [activeColour, setActiveColour] = useState(0);
  const [shared, setShared] = useState(false);

  if (!space || !design) return <Navigate to="/interior-by-choice" replace />;

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
          <div className="ibc-detail-media">
            <img src={design.image} alt={design.name} />
          </div>

          <div className="ibc-detail-head">
            <div>
              <h2>{design.name}</h2>
              <p className="ibc-detail-tagline">{design.tagline}</p>
            </div>
            <span className="ibc-detail-price">₹{design.pricePerSqft} / sq.ft.</span>
          </div>

          <div className="ibc-detail-block">
            <h3>Available Colours</h3>
            <div className="ibc-swatch-row">
              {design.colours.map((hex, i) => (
                <button
                  key={hex}
                  type="button"
                  className={`ibc-swatch ${i === activeColour ? 'active' : ''}`}
                  style={{ background: hex }}
                  aria-label={`Colour option ${i + 1}`}
                  onClick={() => setActiveColour(i)}
                />
              ))}
            </div>
          </div>

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
            <Link to={`/interior-by-choice/${spaceSlug}/${designSlug}/book`} className="btn btn-primary">
              Book Home Visit – ₹{HOME_VISIT_FEE}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
