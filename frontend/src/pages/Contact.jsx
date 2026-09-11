import PageHero from '../components/ui/PageHero';
import SectionHeading from '../components/ui/SectionHeading';
import ContactSection from '../components/forms/ContactSection';
import QuoteForm from '../components/forms/QuoteForm';
import Reveal from '../components/ui/Reveal';
import CtaBand from '../components/ui/CtaBand';
import { contact } from '../data/siteConfig';

export default function Contact() {
  return (
    <>
    <PageHero
  eyebrow="CONTACT US"
  title="LET'S DISCUSS YOUR PROJECT"
  image="/assets/projects/office-fitout.svg"
  breadcrumbs={[{ label: 'Contact Us' }]}
  className="contact-page-hero"
/>
     <section className="section contact-section">
        <div className="container">
          <div className="contact-layout">
            <div>
              <SectionHeading
                eyebrow="SEND AN ENQUIRY"
                title="TELL US WHAT YOU NEED"
                text="Fill in the details below and send it straight to our team on WhatsApp or by email."
              />
              <QuoteForm source="CONTACT_FORM" />
            </div>

            <Reveal>
              <ContactSection />
            </Reveal>
          </div>
        </div>
      </section>

      <CtaBand
        title="PREFER TO TALK IT THROUGH?"
        text="Call us and we will talk through your requirement, or arrange a site visit."
        primaryLabel="GET A QUOTE"
      />
    </>
  );
}
