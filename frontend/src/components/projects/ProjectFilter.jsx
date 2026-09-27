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
          className={`
  filter-btn
  backdrop-blur-lg
  !border-white/35
  !shadow-[0_4px_16px_rgba(0,0,0,0.06)]
  ${active === category.id ? 'active' : '!bg-white/35'}
`}
          onClick={() => onChange(category.id)}
        >
          {category.label}
        </button>
      ))}
    </div>
  );
}
