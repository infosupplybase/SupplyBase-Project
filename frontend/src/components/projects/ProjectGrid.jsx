import ProjectCard from './ProjectCard';

export default function ProjectGrid({ projects = [] }) {
  if (!projects.length) {
    return (
      <p style={{ padding: '30px 0', color: 'var(--grey-500)' }}>
        No projects in this category yet — please check back soon.
      </p>
    );
  }

  return (
    <div className="project-grid">
      {projects.map((project, i) => (
        <ProjectCard key={project.slug} project={project} delay={(i % 4) * 70} />
      ))}
    </div>
  );
}
