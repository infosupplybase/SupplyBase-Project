import { Link } from 'react-router-dom';
import Icon from './Icon';

/**
 * Breadcrumbs — items: [{ label, to }], last item is rendered as current page.
 */
export default function Breadcrumbs({ items = [] }) {
  return (
    <nav className="breadcrumbs" aria-label="Breadcrumb">
      <Link to="/">Home</Link>
      {items.map((item, i) => (
        <span key={item.label} style={{ display: 'inline-flex', alignItems: 'center', gap: 9 }}>
          <Icon name="chevron-right" size={13} />
          {i === items.length - 1 || !item.to ? (
            <span aria-current="page">{item.label}</span>
          ) : (
            <Link to={item.to}>{item.label}</Link>
          )}
        </span>
      ))}
    </nav>
  );
}
