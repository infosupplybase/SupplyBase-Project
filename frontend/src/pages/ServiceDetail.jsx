import { Link, useParams } from 'react-router-dom';
import PageHero from '../components/ui/PageHero';
import SectionHeading from '../components/ui/SectionHeading';
import Reveal from '../components/ui/Reveal';
import CtaBand from '../components/ui/CtaBand';
import Faq from '../components/ui/Faq';
import Icon from '../components/ui/Icon';
import ProjectGrid from '../components/projects/ProjectGrid';
import NotFound from './NotFound';
import { slugify } from '../components/home/ServiceCard';
import { activeServices as services, getServiceBySlug } from '../data/services';
import { getProjectsByService } from '../data/projects';
import { contact } from '../data/siteConfig';
import { telHref, whatsappHref } from '../lib/contact';

/**
 * ServiceDetail — ONE reusable template that renders all 10 services
 * from the data in src/data/services.js. Route: /services/:slug
 */
export default function ServiceDetail() {
  const { slug } = useParams();
  const service = getServiceBySlug(slug);

  if (!service) return <NotFound />;

  const relatedProjects = getProjectsByService(service.slug, 3);

  return (
    <>
      <PageHero
        accent={service.slug}
        eyebrow={`SERVICE ${service.number}`}
        title={service.name}
        text={service.tagline}
        image={service.heroImage}
        breadcrumbs={[{ label: 'Services', to: '/services' }, { label: service.name }]}
      >
        <div className="btn-row" style={{ marginTop: 26 }}>
          <Link to={`/quote?service=${service.slug}`} className="btn btn-primary">
            GET A QUOTE
            <Icon name="arrow-right" size={17} />
          </Link>
          <a href={telHref} className="btn btn-outline">
            <Icon name="phone" size={17} />
            {contact.phoneDisplay}
          </a>
        </div>
      </PageHero>

      {/* horizontal service switcher */}
      <div className="section-light" style={{ borderBottom: '1px solid var(--grey-200)' }}>
        <div className="container">
          <nav className="service-nav-strip" aria-label="All services">
            {services.map((item) => (
              <Link
                key={item.slug}
                to={`/services/${item.slug}`}
                className={item.slug === service.slug ? 'active' : ''}
              >
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      <section className="section">
        <div className="container">
          <div className="service-layout">
            {/* ------------------------------------------------- main */}
            <div>
              {/* overview */}
              <Reveal>
                <span className="eyebrow">OVERVIEW</span>
                <div className="rule" />
                <h2>{service.tagline}</h2>
                <p style={{ fontSize: '1.05rem', color: 'var(--grey-600)' }}>{service.summary}</p>
              </Reveal>

              <Reveal className="split-media" style={{ margin: '30px 0 46px' }} delay={80}>
                <img src={service.heroImage} alt={service.name} />
              </Reveal>

              {/* sub-services */}
              <Reveal id="sub-services">
                <span className="eyebrow">WHAT&rsquo;S INCLUDED</span>
                <div className="rule" />
                <h2>OUR {service.name.toUpperCase()} SERVICES</h2>
              </Reveal>

              <div className="sub-service-grid" style={{ margin: '24px 0 50px' }}>
                {service.subServices.map((sub, i) => (
                  <Reveal key={sub.name} delay={(i % 3) * 70}>
                    <div className="sub-service" id={slugify(sub.name)}>
                      <h4>{sub.name}</h4>
                      <p>{sub.text}</p>
                    </div>
                  </Reveal>
                ))}
              </div>

              {/* why choose us */}
              <Reveal id="why-us">
                <span className="eyebrow">WHY CHOOSE US</span>
                <div className="rule" />
                <h2>WHY CLIENTS PICK SUPPLYBASE</h2>
                <ul className="check-list">
                  {service.highlights.map((point) => (
                    <li key={point}>
                      <Icon name="check" size={19} strokeWidth={2.2} />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </Reveal>

              {/* process */}
              <Reveal id="process" style={{ marginTop: 46 }}>
                <span className="eyebrow">OUR PROCESS</span>
                <div className="rule" />
                <h2>HOW WE DELIVER IT</h2>
              </Reveal>

              <div className="sub-service-grid" style={{ marginTop: 22 }}>
                {service.process.map((step, i) => (
                  <Reveal key={step.title} delay={i * 70}>
                    <div className="sub-service" style={{ borderLeftColor: 'var(--black)' }}>
                      <span className="service-card-num">STEP {String(i + 1).padStart(2, '0')}</span>
                      <h4 style={{ marginTop: 4 }}>{step.title}</h4>
                      <p>{step.text}</p>
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>

            {/* ---------------------------------------------- sidebar */}
            <aside className="sidebar">
              <div className="sidebar-card">
                <h4>All Services</h4>
                <div className="sidebar-list">
                  {services.map((item) => (
                    <Link
                      key={item.slug}
                      to={`/services/${item.slug}`}
                      className={item.slug === service.slug ? 'active' : ''}
                    >
                      {item.name}
                      <Icon name="chevron-right" size={15} />
                    </Link>
                  ))}
                </div>
              </div>

              <div className="sidebar-card sidebar-cta">
                <h4>Need a quotation?</h4>
                <p>Tell us the scope and we will come back with an itemised quote for {service.name.toLowerCase()}.</p>
                <div className="sidebar-contact">
                  <Link to={`/quote?service=${service.slug}`} className="btn btn-primary btn-sm btn-block">
                    GET A QUOTE
                    <Icon name="arrow-right" size={16} />
                  </Link>
                  <a href={telHref} className="btn btn-outline btn-sm btn-block">
                    <Icon name="phone" size={16} />
                    {contact.phoneDisplay}
                  </a>
                  <a
                    href={whatsappHref(`Hello Supplybase Projects, I would like a quote for ${service.name}.`)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-whatsapp btn-sm btn-block"
                  >
                    <Icon name="whatsapp" size={16} />
                    WHATSAPP US
                  </a>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* related projects */}
      {relatedProjects.length > 0 && (
        <section className="section section-light">
          <div className="container">
            <div className="section-head-row" style={{ marginBottom: '2rem' }}>
              <div>
                <span className="eyebrow">RELATED WORK</span>
                <div className="rule" />
                <h2>PROJECTS WITH {service.name.toUpperCase()}</h2>
              </div>
              <Link to="/projects" className="btn btn-ghost">
                VIEW ALL PROJECTS
                <Icon name="arrow-right" size={17} />
              </Link>
            </div>
            <ProjectGrid projects={relatedProjects} />
          </div>
        </section>
      )}

      {/* faq */}
      <section className="section">
        <div className="container container-narrow">
          <SectionHeading
            center
            eyebrow="FAQ"
            title="COMMON QUESTIONS"
            text={`What clients usually ask us about ${service.name.toLowerCase()}.`}
          />
          <Faq items={service.faqs} />
        </div>
      </section>

      <CtaBand
        title={`READY TO START YOUR ${service.name.toUpperCase()} WORK?`}
        text="Send us your requirement and we will get back to you with a clear, itemised quotation."
      />
    </>
  );
}
