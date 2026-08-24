import { useSearchParams } from 'react-router-dom';
import PageHero from '../components/ui/PageHero';
import QuoteForm from '../components/forms/QuoteForm';
import ContactSection from '../components/forms/ContactSection';
import Reveal from '../components/ui/Reveal';
import Icon from '../components/ui/Icon';
import CtaBand from '../components/ui/CtaBand';
import { getServiceBySlug } from '../data/services';
import { processSteps } from '../data/siteConfig';

export default function Quote() {
  const [params] = useSearchParams();
  const preselected = getServiceBySlug(params.get('service') || '');

  return (
    <>
      <PageHero
        eyebrow="GET A QUOTE"
        title="REQUEST A QUOTATION"
        text={
          preselected
            ? `Tell us about your ${preselected.name.toLowerCase()} requirement and we will come back with an itemised quotation.`
            : 'Share your requirement and we will come back with a clear, itemised quotation — no obligation.'
        }
        image="/assets/services/architectural-design.svg"
        breadcrumbs={[{ label: 'Get a Quote' }]}
      />

      <section className="section">
        <div className="container">
          <div className="contact-layout">
            <QuoteForm defaultService={preselected ? preselected.name : ''} />

            <Reveal>
              <div className="sidebar-card" style={{ marginBottom: 20 }}>
                <h4>What happens next</h4>
                <div style={{ display: 'grid', gap: 16, marginTop: 4 }}>
                  {processSteps.map((step) => (
                    <div key={step.number} style={{ display: 'flex', gap: 12 }}>
                      <span
                        style={{
                          flexShrink: 0,
                          width: 30,
                          height: 30,
                          borderRadius: '50%',
                          background: 'rgba(214,165,68,.14)',
                          color: 'var(--gold-deep)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: '0.82rem',
                        }}
                      >
                        {step.number}
                      </span>
                      <span>
                        <strong style={{ display: 'block', color: 'var(--black)', fontSize: '0.95rem' }}>
                          {step.title}
                        </strong>
                        <span style={{ fontSize: '0.88rem', color: 'var(--grey-600)' }}>{step.text}</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <ContactSection />
            </Reveal>
          </div>
        </div>
      </section>

      <CtaBand
        title="NEED AN ANSWER TODAY?"
        text="Call or WhatsApp us directly and we will talk through your requirement."
        primaryLabel="SEE OUR SERVICES"
        primaryTo="/services"
      />
    </>
  );
}
