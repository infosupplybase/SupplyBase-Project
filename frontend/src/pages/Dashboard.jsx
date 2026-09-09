import { Link, useNavigate } from 'react-router-dom';
import PageHero from '../components/ui/PageHero';
import Icon from '../components/ui/Icon';
import Reveal from '../components/ui/Reveal';
import { useAuth } from '../context/AuthContext';
import { contact, processSteps } from '../data/siteConfig';
import { telHref, mailtoHref, whatsappHref } from '../lib/contact';

/**
 * The page a signed-in client lands on.
 * For now it is a welcome page. When you are ready to show real project
 * information here (stage, photos, payments), that content goes in this file.
 */
export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // fullName, not displayName — the API's user shape, not Firebase's.
  const name = (user && (user.fullName || (user.email || '').split('@')[0])) || 'there';

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <>
      <PageHero
        eyebrow="YOUR ACCOUNT"
        title={`WELCOME, ${String(name).toUpperCase()}`}
        text="You are signed in to your Supplybase account."
        image="/assets/hero-house.svg"
        breadcrumbs={[{ label: 'My Account' }]}
      >
        <div className="btn-row" style={{ marginTop: 24 }}>
          <a href={telHref} className="btn btn-primary">
            <Icon name="phone" size={17} />
            CALL YOUR MANAGER
          </a>
          <button type="button" className="btn btn-outline" onClick={handleLogout}>
            SIGN OUT
          </button>
        </div>
      </PageHero>

      <section className="section">
        <div className="container">
          <div className="service-layout">
            <div>
              <Reveal>
                <span className="eyebrow">YOUR PROJECT</span>
                <div className="rule" />
                <h2>WHERE THINGS STAND</h2>
                <p style={{ color: 'var(--grey-600)' }}>
                  Your project details will appear here. For now, this is where you will be able to
                  see the stage your work has reached, photos from site, and the drawings we have
                  shared with you.
                </p>
              </Reveal>

              <div className="sub-service-grid" style={{ marginTop: 24 }}>
                {processSteps.map((step, i) => (
                  <Reveal key={step.number} delay={i * 70}>
                    <div className="sub-service">
                      <span className="service-card-num">STAGE {step.number}</span>
                      <h4 style={{ marginTop: 4 }}>{step.title}</h4>
                      <p>{step.text}</p>
                    </div>
                  </Reveal>
                ))}
              </div>

              <div className="form-note" style={{ marginTop: 26 }}>
                <Icon name="info" size={18} />
                <span>
                  Signed in as <strong>{user && user.email}</strong>. If anything here looks wrong,
                  call us on <a href={telHref}>{contact.phoneDisplay}</a>.
                </span>
              </div>
            </div>

            <aside className="sidebar">
              <div className="sidebar-card sidebar-cta">
                <h4>Need something?</h4>
                <p>Your project manager is one message away.</p>
                <div className="sidebar-contact">
                  <a href={telHref} className="btn btn-primary btn-sm btn-block">
                    <Icon name="phone" size={16} />
                    {contact.phoneDisplay}
                  </a>
                  <a
                    href={whatsappHref('Hello Supplybase, I have a question about my project.')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-whatsapp btn-sm btn-block"
                  >
                    <Icon name="whatsapp" size={16} />
                    WHATSAPP US
                  </a>
                  <a href={mailtoHref} className="btn btn-outline btn-sm btn-block">
                    <Icon name="mail" size={16} />
                    EMAIL US
                  </a>
                </div>
              </div>

              <div className="sidebar-card">
                <h4>Quick Links</h4>
                <div className="sidebar-list">
                  <Link to="/services">
                    Our Services
                    <Icon name="chevron-right" size={15} />
                  </Link>
                  <Link to="/projects">
                    Our Projects
                    <Icon name="chevron-right" size={15} />
                  </Link>
                  <Link to="/quote">
                    Start a New Enquiry
                    <Icon name="chevron-right" size={15} />
                  </Link>
                  <Link to="/contact">
                    Contact Us
                    <Icon name="chevron-right" size={15} />
                  </Link>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </>
  );
}
