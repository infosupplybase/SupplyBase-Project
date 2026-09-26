/** Horizontal filter tabs. `active` is the currently-selected label;
    `onChange` receives the clicked label. Scrolls on mobile rather than
    wrapping, matching the reference. */
export default function CategoryTabs({ tabs, active, onChange }) {
  return (
    <div className="plb-tabs" role="tablist">
      {tabs.map((label) => (
        <button
          key={label}
          type="button"
          role="tab"
          aria-selected={active === label}
          className={`plb-tab ${active === label ? 'active' : ''}`}
          onClick={() => onChange(label)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
