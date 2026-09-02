import Link from 'next/link';
import Icon from '../ui/Icon';
import Reveal from '../ui/Reveal';

export default function ProjectCard({ project, delay = 0 }) {
  return (
    <Reveal delay={delay}>
      <Link href={`/projects/${project.slug}`} className="project-card" data-category={project.category}>
        <img src={project.image} alt={project.name} loading="lazy" />
        <div className="project-card-overlay">
          <span className="badge">{project.categoryLabel}</span>
          <h3>{project.name}</h3>
          <span className="project-card-loc">
            <Icon name="map-pin" size={15} />
            {project.location}
          </span>
          <span className="project-card-more">
            VIEW PROJECT
            <Icon name="arrow-right" size={15} />
          </span>
        </div>
      </Link>
    </Reveal>
  );
}
