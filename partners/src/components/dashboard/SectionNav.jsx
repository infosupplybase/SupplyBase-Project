import Icon from '../ui/Icon';

export const SECTIONS = [
  { key: 'jobs', label: 'Jobs', icon: 'briefcase' },
  { key: 'earnings', label: 'Earnings', icon: 'rupee' },
  { key: 'account', label: 'Account', icon: 'user', phoneOnly: true },
];

/**
 * The dashboard's sections. On a wide screen: tabs above the content (Account
 * is the sidebar there, so it has no tab). On a phone: a bar fixed to the
 * bottom of the screen, where a thumb reaches, with Account as a third item.
 */
export default function SectionNav({ tab, onChange, jobsBadge }) {
  const item = (section, variant) => {
    const active = tab === section.key;
    // On the tabs the count sits after the word; on the bottom bar, on the icon.
    const badge =
      section.key === 'jobs' && jobsBadge > 0 ? (
        <span className="pp-badge-dot" aria-hidden="true">
          {jobsBadge}
        </span>
      ) : null;
    return (
      <button
        key={section.key}
        type="button"
        className={`${variant}-item ${active ? 'active' : ''} ${section.phoneOnly ? 'phone-only' : ''}`}
        aria-current={active ? 'page' : undefined}
        aria-label={section.key === 'jobs' && jobsBadge > 0 ? `Jobs, ${jobsBadge} active` : undefined}
        onClick={() => onChange(section.key)}
      >
        <span className={`${variant}-icon`}>
          <Icon name={section.icon} size={variant === 'pp-bottomnav' ? 21 : 17} />
          {variant === 'pp-bottomnav' && badge}
        </span>
        <span className={`${variant}-label`}>{section.label}</span>
        {variant === 'pp-tabs' && badge}
      </button>
    );
  };

  return (
    <>
      <nav className="pp-tabs" aria-label="Dashboard sections">
        {SECTIONS.filter((s) => !s.phoneOnly).map((s) => item(s, 'pp-tabs'))}
      </nav>
      <nav className="pp-bottomnav" aria-label="Dashboard sections">
        {SECTIONS.map((s) => item(s, 'pp-bottomnav'))}
      </nav>
    </>
  );
}
