import { Link } from 'react-router-dom';
import Icon from '../components/ui/Icon';
import PaintingHero from '../components/painting/PaintingHero';
import { wpBathroomServices, WP_BATHROOM_IMAGE } from '../data/waterproofingContent';

/**
 * /services/waterproofing/bathroom — Bathroom's own six-row list. Only
 * Floor Waterproofing has a full reference flow; the other five open the
 * existing generic site-visit wizard with their subservice preselected
 * (see V17's migration note 3 and ServiceBooking.jsx's `preselect` param).
 */
export default function WaterproofingBathroom({ modal = false, onBackToCategories, onSelectService }) {
  return (
    <>
      {modal && (
        <div className="container container-narrow wp-modal-back-row">
          <button type="button" className="btn btn-ghost btn-sm" onClick={onBackToCategories}>
            <Icon name="arrow-left" size={16} /> WATERPROOFING SERVICES
          </button>
        </div>
      )}
      <PaintingHero
        eyebrow="BATHROOM WATERPROOFING"
        title="Bathroom Waterproofing"
        tagline="Keep Your Bathroom Dry. Stop Leaks Before They Start."
        image={WP_BATHROOM_IMAGE}
        trustPoints={[]}
      />

      <section className="pnt-section">
        <div className="container container-narrow">
          <div className="pnt-overview-list">
            {wpBathroomServices.map((svc) => (
              modal ? (
                <button key={svc.slug} type="button" className="pnt-overview-card" onClick={() => onSelectService(svc.route)}>
                  <span className="pnt-overview-photo pce-overview-icon"><Icon name={svc.icon} size={30} /></span>
                  <span className="pnt-overview-body">
                    <span className="pnt-overview-name">{svc.name}</span>
                    <span className="pnt-overview-tagline">{svc.tagline}</span>
                  </span>
                  <Icon name="chevron-right" size={18} className="pnt-overview-arrow" />
                </button>
              ) : (
                <Link key={svc.slug} to={svc.route} className="pnt-overview-card">
                  <span className="pnt-overview-photo pce-overview-icon"><Icon name={svc.icon} size={30} /></span>
                  <span className="pnt-overview-body">
                    <span className="pnt-overview-name">{svc.name}</span>
                    <span className="pnt-overview-tagline">{svc.tagline}</span>
                  </span>
                  <Icon name="chevron-right" size={18} className="pnt-overview-arrow" />
                </Link>
              )
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
