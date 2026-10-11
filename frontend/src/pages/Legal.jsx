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

const updated = 'October 2026';

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
          <ul>
            <li>
              <strong>Your account</strong> — your name, email address and phone number, and a password (kept only in
              a scrambled form that we cannot read). If you sign in with Google, we receive your name and email
              address from Google.
            </li>
            <li>
              <strong>Bookings</strong> — the service you choose, your answers to the booking questions, your
              preferred date and time, the name, phone number, WhatsApp number, email address, address, city and pin
              code you enter, the location you pick on the map or choose to share from your device, and any photos
              you attach.
            </li>
            <li>
              <strong>Enquiries and quotations</strong> — what you type into the contact and quotation forms, or tell
              us when you call or message us on WhatsApp.
            </li>
          </ul>

          <h2>How the website handles your details</h2>
          <p>
            Bookings, enquiries and account details are sent over an encrypted connection to our server and stored
            there. Our team is notified so we can contact you. To keep you signed in, your browser stores a sign-in
            token on your device until you sign out. This website does not use advertising trackers.
          </p>
          <p>
            To understand how the website is used, we count page visits with Vercel Web Analytics. It sets no cookies
            and does not identify you: it records the page, the website you came from, your country, and your device
            and browser type, and visits cannot be linked across days or other websites.
          </p>

          <h2>Your location</h2>
          <p>
            We use a location only if you pick it on the map or press "Use my current location" — your browser asks
            for your permission first, and you can type your address instead. It is used to find your address and so
            that our team can reach your site.
          </p>

          <h2>How we use your information</h2>
          <ul>
            <li>To arrange and carry out site visits and to prepare a quotation</li>
            <li>To contact you about your booking, enquiry or an ongoing project</li>
            <li>To show you your bookings in your account</li>
            <li>To keep records of work carried out for you</li>
          </ul>

          <h2>Sharing</h2>
          <p>We do not sell your information. We share it only with:</p>
          <ul>
            <li>
              the professional assigned to your visit, who receives your name, phone number, address and the details
              of your request;
            </li>
            <li>suppliers or specialists working on your project, where necessary;</li>
            <li>
              the services that run this website — our hosting providers, our email delivery service and Google (the
              map and address search, the fonts the pages use and, if you choose it, Google sign-in), which receive
              the technical information any website visit involves, such as your IP address, and what you search for
              on the map.
            </li>
          </ul>

          <h2>Retention</h2>
          <p>
            Account, booking, enquiry and project records are kept for as long as needed to serve you and to meet our
            legal and accounting obligations.
          </p>

          <h2>Your choices</h2>
          <p>
            You can correct your name and phone number in your account. You can ask us what information we hold about
            you, ask us to correct it, or ask us to delete it (including your account), by contacting us using the
            details below.
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

          <h2>Your account and bookings</h2>
          <ul>
            <li>You need an account to book a site visit. Keep your password private and give us accurate details.</li>
            <li>A booking is a request for a visit on the date and time you choose; our team contacts you to confirm it.</li>
            <li>Someone must be able to give our team access to the site at the booked time.</li>
            <li>
              Every booking needs a ₹99 visiting fee, paid online when you book. A booking is confirmed only once it is
              paid, and an unpaid booking is cancelled. The fee is adjusted into your final bill if you go ahead with
              the work.
            </li>
            <li>To change or cancel a visit, contact us using the details below.</li>
          </ul>

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
