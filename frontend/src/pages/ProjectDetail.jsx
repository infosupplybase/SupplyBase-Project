import { Link, useParams } from 'react-router-dom';
import PageHero from '../components/ui/PageHero';
import Reveal from '../components/ui/Reveal';
import CtaBand from '../components/ui/CtaBand';
import Icon from '../components/ui/Icon';
import ProjectGrid from '../components/projects/ProjectGrid';
import NotFound from './NotFound';
import { projects, getProjectBySlug } from '../data/projects';
import { getServiceBySlug } from '../data/services';
import { contact } from '../data/siteConfig';
import { telHref } from '../lib/contact';

export default function ProjectDetail() {
  const { slug } = useParams();
  const project = getProjectBySlug(slug);

  if (!project) return <NotFound />;

  const related = projects.filter((p) => p.slug !== project.slug && p.category === project.category).slice(0, 3);
  const services = project.servicesProvided.map(getServiceBySlug).filter(Boolean);

  return (
    <>
      <PageHero
        eyebrow={project.categoryLabel}
        title={project.name}
        text={project.summary}
        image={project.image}
        breadcrumbs={[{ label: 'Projects', to: '/projects' }, { label: project.name }]}
      />

      <section className="section">
        <div className="container">
          <dl className="project-meta">
            <div>
              <dt>Category</dt>
              <dd>{project.categoryLabel}</dd>
            </div>
            <div>
              <dt>Location</dt>
              <dd>{project.location}</dd>
            </div>
            <div>
              <dt>Built-up Area</dt>
              <dd>{project.area}</dd>
            </div>
            <div>
              <dt>Duration</dt>
              <dd>{project.duration}</dd>
            </div>
            <div>
              <dt>Year</dt>
              <dd>{project.year}</dd>
            </div>
            <div>
              <dt>Scope</dt>
              <dd>{project.scopeLabel}</dd>
            </div>
          </dl>

          <div className="service-layout">
            <div>
              <Reveal>
                <span className="eyebrow">ABOUT THE PROJECT</span>
                <div className="rule" />
                <h2>PROJECT OVERVIEW</h2>
                <p style={{ fontSize: '1.05rem', color: 'var(--grey-600)' }}>{project.description}</p>
              </Reveal>

              <Reveal style={{ marginTop: 40 }}>
                <span className="eyebrow">WORK COMPLETED</span>
                <div className="rule" />
                <h2>SCOPE OF WORK</h2>
                <ul className="check-list">
                  {project.scope.map((item) => (
                    <li key={item}>
                      <Icon name="check" size={19} strokeWidth={2.2} />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </Reveal>

              <Reveal style={{ marginTop: 40 }}>
                <span className="eyebrow">GALLERY</span>
                <div className="rule" />
                <h2>PROJECT IMAGES</h2>
                <div className="gallery-grid" style={{ marginTop: 20 }}>
                  {project.gallery.map((image) => (
                    <img key={image} src={image} alt={project.name} loading="lazy" />
                  ))}
                </div>
              </Reveal>

              <Reveal style={{ marginTop: 40 }}>
                <span className="eyebrow">SERVICES PROVIDED</span>
                <div className="rule" />
                <h2>WHAT WE DELIVERED</h2>
                <div className="tag-row" style={{ marginTop: 18 }}>
                  {services.map((service) => (
                    <Link key={service.slug} to={`/services/${service.slug}`} className="tag">
                      <Icon name={service.icon} size={17} />
                      {service.name}
                    </Link>
                  ))}
                </div>
              </Reveal>
            </div>

            <aside className="sidebar">
              <div className="sidebar-card sidebar-cta">
                <h4>Planning something similar?</h4>
                <p>Tell us about your site and we will prepare a quotation for a project like this one.</p>
                <div className="sidebar-contact">
                  <Link to="/quote" className="btn btn-primary btn-sm btn-block">
                    GET A QUOTE
                    <Icon name="arrow-right" size={16} />
                  </Link>
                  <a href={telHref} className="btn btn-outline btn-sm btn-block">
                    <Icon name="phone" size={16} />
                    {contact.phoneDisplay}
                  </a>
                </div>
              </div>

              <div className="sidebar-card">
                <h4>All Projects</h4>
                <div className="sidebar-list">
                  {projects.map((item) => (
                    <Link
                      key={item.slug}
                      to={`/projects/${item.slug}`}
                      className={item.slug === project.slug ? 'active' : ''}
                    >
                      {item.name}
                      <Icon name="chevron-right" size={15} />
                    </Link>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      {related.length > 0 && (
        <section className="section section-light">
          <div className="container">
            <div className="section-head-row" style={{ marginBottom: '2rem' }}>
              <div>
                <span className="eyebrow">MORE WORK</span>
                <div className="rule" />
                <h2>RELATED PROJECTS</h2>
              </div>
              <Link to="/projects" className="btn btn-ghost">
                VIEW ALL PROJECTS
                <Icon name="arrow-right" size={17} />
              </Link>
            </div>
            <ProjectGrid projects={related} />
          </div>
        </section>
      )}

      <CtaBand />
    </>
  );
}
