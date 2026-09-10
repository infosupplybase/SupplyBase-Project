import { Link } from 'react-router-dom';
import PageHero from '../components/ui/PageHero';
import Icon from '../components/ui/Icon';
import PricingBanner from '../components/plumbing/PricingBanner';
import StickyCartBar from '../components/plumbing/StickyCartBar';
import usePlumbingCatalogue from '../hooks/usePlumbingCatalogue';
import { plumbingConsultationContent, plumbingTrustPoints } from '../data/plumbingContent';
import { formatRupees } from '../lib/money';

/**
 * /services/plumbing — the overview grid (PDF screen 2): eight category
 * tiles + the consultation tile, each showing a real "From ₹X" computed live
 * from the catalogue's own lowest-priced item in that tab, so it can never
 * drift out of sync with the detail pages the way the source PDF's own
 * overview screen had (see V14 migration's pricing-conflict notes).
 */
export default function PlumbingCategory() {
  const { tabs, loading, error } = usePlumbingCatalogue();

  return (
    <>
      <PageHero
        eyebrow="PLUMBING"
        title="Plumbing Services"
        text="Verified plumbers. Quality materials. Transparent pricing. On-time service."
        breadcrumbs={[{ label: 'Services', to: '/services' }, { label: 'Plumbing' }]}
      />

      <section className="plb-section">
        <div className="container container-narrow">
          <PricingBanner />

          {loading && <p className="question-hint">Loading services…</p>}
          {error && (
            <div role="alert" className="alert alert-error">
              <Icon name="info" size={18} />
              <span>{error}</span>
            </div>
          )}

          {!loading && !error && (
            <div className="plb-overview-grid">
              {tabs.map((tab) => (
                <Link key={tab.slug} to={`/services/plumbing/${tab.slug}`} className="plb-overview-card">
                  <span className="plb-overview-photo">
                    <img src={tab.overviewImage} alt="" width={200} height={125} loading="lazy" />
                  </span>
                  <span className="plb-overview-name">
                    {tab.name}
                    <Icon name="chevron-right" size={16} />
                  </span>
                  {tab.fromPrice != null && (
                    <>
                      <span className="plb-overview-price">From {formatRupees(tab.fromPrice)}</span>
                      <span className="plb-overview-price-note">(Actual pricing)</span>
                    </>
                  )}
                </Link>
              ))}

              <Link to="/services/plumbing/consultation" className="plb-overview-card plb-overview-consult">
                <span className="plb-overview-photo">
                  <img src={plumbingConsultationContent.overviewImage} alt="" width={200} height={125} loading="lazy" />
                </span>
                <span className="plb-overview-name">
                  {plumbingConsultationContent.name}
                  <Icon name="chevron-right" size={16} />
                </span>
                <span className="plb-overview-price">₹99 Home Visit</span>
                <span className="plb-overview-price-note">For projects above ₹5,000 (adjusted in final bill)</span>
              </Link>
            </div>
          )}

          <ul className="plb-trust-row">
            {plumbingTrustPoints.map((t) => (
              <li key={t.label}>
                <Icon name={t.icon} size={24} />
                <span>{t.label}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <StickyCartBar />
    </>
  );
}
