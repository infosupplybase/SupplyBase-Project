import { projectCategories } from '../../data/projects';

export default function ProjectFilter({ active, onChange }) {
  return (
    <div className="filter-bar" role="tablist" aria-label="Filter projects by category">
      {projectCategories.map((category) => (
        <button
          key={category.id}
          type="button"
          role="tab"
          aria-selected={active === category.id}
          data-category={category.id}
          className={`filter-btn ${active === category.id ? 'active' : ''}`}
          onClick={() => onChange(category.id)}
        >
          {category.label}
        </button>
      ))}
    </div>
  );
}
