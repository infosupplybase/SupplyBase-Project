import PageHero from '../components/ui/PageHero';
import { company, contact } from '../data/siteConfig';
import { telHref, mailtoHref } from '../lib/contact';

/**
 * Legal — Privacy Policy and Terms & Conditions.
 *
 * ⚠️  TEMPLATE TEXT. These are reasonable starting drafts, not legal advice.
 *     Have them reviewed by a professional and adjust them to how your business
 *     actually handles data and contracts before you go live.
 */

const updated = 'August 2026';

export function PrivacyPolicy() {
  return (
    <>
      <PageHero
        eyebrow="LEGAL"
        title="PRIVACY POLICY"
        text={`How ${company.name} handles the information you share with us.`}
        breadcrumbs={[{ label: 'Privacy Policy' }]}
      />
      <section className="section">
        <div className="container container-narrow legal-content">
          <p style={{ color: 'var(--grey-500)' }}>Last updated: {updated}</p>

          <h2>Information we collect</h2>
          <p>
            When you use the enquiry form, call us or message us on WhatsApp, we receive the details you choose to
            share — typically your name, phone number, email address, project location and a description of the work
            you need.
          </p>

          <h2>How the enquiry form works</h2>
          <p>
            The enquiry form on this website does not send your details to a server. It prepares a message in your own
            WhatsApp or email application with the information you entered, which you then send yourself. Any files you
            select stay on your device until you attach them to that message.
          </p>

          <h2>How we use your information</h2>
          <ul>
            <li>To understand your requirement and prepare a quotation</li>
            <li>To contact you about your enquiry or an ongoing project</li>
            <li>To keep records of work carried out for you</li>
          </ul>

          <h2>Sharing</h2>
          <p>
            We do not sell your information. We share it only with the members of our own team and, where necessary,
            with suppliers or specialists working on your project.
          </p>

          <h2>Retention</h2>
          <p>
            Enquiry and project records are kept for as long as needed to serve you and to meet our legal and
            accounting obligations.
          </p>

          <h2>Your choices</h2>
          <p>
            You can ask us what information we hold about you, ask us to correct it, or ask us to delete it, by
            contacting us using the details below.
          </p>

          <h2>Contact</h2>
          <p>
            {company.name}
            <br />
            Phone: <a href={telHref}>{contact.phoneDisplay}</a>
            <br />
            Email: <a href={mailtoHref}>{contact.email}</a>
          </p>
        </div>
      </section>
    </>
  );
}

export function Terms() {
  return (
    <>
      <PageHero
        eyebrow="LEGAL"
        title="TERMS & CONDITIONS"
        text={`The terms on which ${company.name} provides this website and its services.`}
        breadcrumbs={[{ label: 'Terms & Conditions' }]}
      />
      <section className="section">
        <div className="container container-narrow legal-content">
          <p style={{ color: 'var(--grey-500)' }}>Last updated: {updated}</p>

          <h2>About this website</h2>
          <p>
            This website describes the services offered by {company.name}. The content is provided for general
            information and does not by itself form a contract.
          </p>

          <h2>Quotations</h2>
          <ul>
            <li>Prices are confirmed only in a written quotation issued after a site visit or scope discussion.</li>
            <li>Quotations are valid for the period stated on them.</li>
            <li>Work outside the quoted scope is charged separately and agreed in writing before it is carried out.</li>
          </ul>

          <h2>Project execution</h2>
          <ul>
            <li>Timelines are agreed at the start of the project and depend on site readiness, approvals and payments.</li>
            <li>Material specifications are recorded in the quotation; substitutions are agreed with you in advance.</li>
            <li>Payments are linked to completed stages of work as set out in the agreement.</li>
          </ul>

          <h2>Images and project content</h2>
          <p>
            Project images and descriptions on this website illustrate the type of work we carry out. Every site is
            different, and the finished result depends on the specification agreed for your project.
          </p>

          <h2>Liability</h2>
          <p>
            Our responsibility for any project is governed by the written agreement for that project. We are not
            responsible for delays caused by circumstances outside our control, including approvals, supply shortages
            and weather.
          </p>

          <h2>Contact</h2>
          <p>
            {company.name}
            <br />
            Phone: <a href={telHref}>{contact.phoneDisplay}</a>
            <br />
            Email: <a href={mailtoHref}>{contact.email}</a>
          </p>
        </div>
      </section>
    </>
  );
}
