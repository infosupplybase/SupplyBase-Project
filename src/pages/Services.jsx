import { Link } from 'react-router-dom';
import PageHero from '../components/ui/PageHero';
import ServiceGrid from '../components/home/ServiceGrid';
import ProcessSection from '../components/home/ProcessSection';
import SectionHeading from '../components/ui/SectionHeading';
import Reveal from '../components/ui/Reveal';
import CtaBand from '../components/ui/CtaBand';
import Icon from '../components/ui/Icon';
import { getServicesByGroup } from '../data/services';

export default function Services() {
  const groups = getServicesByGroup();

  return (
    <>
      <PageHero
        eyebrow="OUR SERVICES"
        title="EVERYTHING YOUR PROJECT NEEDS"
        text="Ten service categories covering design, construction, services and finishing — delivered by one team under one contract."
        image="/assets/services/architectural-design.svg"
        breadcrumbs={[{ label: 'Services' }]}
      />

      {/* grouped quick index */}
      <section className="section-tight section-light">
        <div className="container">
          <div className="service-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
            {groups.map((group) => (
              <Reveal key={group.group}>
                <div className="sidebar-card" style={{ height: '100%' }}>
                  <h4 style={{ color: 'var(--gold-dark)' }}>{group.group}</h4>
                  <div className="sidebar-list">
                    {group.items.map((service) => (
                      <Link key={service.slug} to={`/services/${service.slug}`}>
                        {service.name}
                        <Icon name="chevron-right" size={15} />
                      </Link>
                    ))}
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* all services */}
      <section className="section">
        <div className="container">
          <SectionHeading
            center
            eyebrow="ALL SERVICES"
            title="WHAT WE DO"
            text="Click any service to see the full scope, our process and related projects."
          />
          <ServiceGrid />
        </div>
      </section>

      <ProcessSection />
      <CtaBand />
    </>
  );
}
