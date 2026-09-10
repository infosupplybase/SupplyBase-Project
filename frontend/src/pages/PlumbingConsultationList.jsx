import Icon from '../components/ui/Icon';
import PlumbingHero from '../components/plumbing/PlumbingHero';
import ConsultationCard from '../components/plumbing/ConsultationCard';
import StickyCartBar from '../components/plumbing/StickyCartBar';
import usePlumbingCatalogue from '../hooks/usePlumbingCatalogue';
import { plumbingConsultationContent } from '../data/plumbingContent';

/** /services/plumbing/consultation — PDF page 11: five real consultation
    types from the catalogue's `consultation_type` question, each with a
    working "Book" button that opens its own booking flow. */
export default function PlumbingConsultationList() {
  const { consultationTypes, loading, error } = usePlumbingCatalogue();

  return (
    <>
      <PlumbingHero
        eyebrow="EXPERT ADVICE"
        title={plumbingConsultationContent.name}
        tagline={plumbingConsultationContent.heroTagline}
      />

      <section className="plb-section">
        <div className="container container-narrow">
          {loading && <p className="question-hint">Loading consultation types…</p>}
          {error && (
            <div role="alert" className="alert alert-error">
              <Icon name="info" size={18} />
              <span>{error}</span>
            </div>
          )}

          {!loading && !error && (
            <div className="plb-consult-list">
              {consultationTypes.map((type) => (
                <ConsultationCard key={type.value} type={type} />
              ))}
            </div>
          )}
        </div>
      </section>

      <StickyCartBar />
    </>
  );
}
