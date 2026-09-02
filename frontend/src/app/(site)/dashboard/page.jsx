'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import PageHero from '../../../components/ui/PageHero';
import Icon from '../../../components/ui/Icon';
import Reveal from '../../../components/ui/Reveal';
import ProtectedRoute from '../../../components/layout/ProtectedRoute';
import { useAuth } from '../../../context/AuthContext';
import { contact, processSteps } from '../../../data/siteConfig';
import { telHref, mailtoHref, whatsappHref } from '../../../lib/contact';

/**
 * The page a signed-in client lands on.
 * For now it is a welcome page. When you are ready to show real project
 * information here (stage, photos, payments), that content goes in this file.
 */
function Dashboard() {
  const { user, logout } = useAuth();
  const router = useRouter();

  // Staff have their own back-office in a separate app — this welcome page
  // is for paying clients, so an admin who lands here is sent straight
  // there. That app runs at a different origin, so this is a full
  // cross-app navigation rather than an in-app route push.
  useEffect(() => {
    if (user && user.role === 'ADMIN') {
      const adminUrl = process.env.NEXT_PUBLIC_ADMIN_URL || 'http://localhost:3001';
      window.location.href = adminUrl;
    }
  }, [user]);

  // fullName, not displayName — the API's user shape, not Firebase's.
  const name = (user && (user.fullName || (user.email || '').split('@')[0])) || 'there';

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  return (
    <>
      <PageHero
        eyebrow="YOUR ACCOUNT"
        title={`WELCOME, ${String(name).toUpperCase()}`}
        text="You are signed in to your Supplybase Projects account."
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
                    href={whatsappHref('Hello Supplybase Projects, I have a question about my project.')}
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
                  <Link href="/services">
                    Our Services
                    <Icon name="chevron-right" size={15} />
                  </Link>
                  <Link href="/projects">
                    Our Projects
                    <Icon name="chevron-right" size={15} />
                  </Link>
                  <Link href="/quote">
                    Start a New Enquiry
                    <Icon name="chevron-right" size={15} />
                  </Link>
                  <Link href="/contact">
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

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  );
}
