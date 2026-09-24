import Icon from '../ui/Icon';

/** A single card with an icon, a title and a short message — one for each
    account state that is not "approved and working" (no application, under
    review, declined, paused). */
export default function StatusCard({
  icon,
  tone,
  title,
  children,
}) {

  return (
    <div className="partner-status-card">

      <span
        className={`partner-status-icon ${
          tone === 'danger'
            ? 'danger'
            : ''
        }`}
      >

        <Icon
          name={icon}
          size={22}
        />

      </span>


      <h2>
        {title}
      </h2>


      {children}

    </div>
  );
}
