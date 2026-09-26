import { useEffect } from 'react';
import Icon from '../ui/Icon';

/**
 * The top of every admin page: an icon, the page name, one line saying what
 * the page is for, and the page's main actions on the right. Also names the
 * browser tab after the page, so several open admin tabs can be told apart.
 */
export default function PageHeader({ icon, title, subtitle, actions, eyebrow }) {
  useEffect(() => {
    document.title = `${title} · Supplybase Admin`;
  }, [title]);

  return (
    <header className="admin-page-header">
      <div className="admin-page-heading">
        {icon && (
          <span className="admin-page-icon" aria-hidden="true">
            <Icon name={icon} size={22} />
          </span>
        )}
        <div>
          {eyebrow && <span className="admin-page-eyebrow">{eyebrow}</span>}
          <h1>{title}</h1>
          {subtitle && <p>{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="admin-page-actions">{actions}</div>}
    </header>
  );
}
