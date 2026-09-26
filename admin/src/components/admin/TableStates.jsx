import Icon from '../ui/Icon';

/** Placeholder rows while a table loads — keeps the table's shape so nothing jumps. */
export function TableLoading({ columns, rows = 5 }) {
  return Array.from({ length: rows }).map((_, r) => (
    <tr key={r} className="admin-skeleton-row" aria-hidden="true">
      {Array.from({ length: columns }).map((__, c) => (
        <td key={c}>
          <span className="admin-skeleton" style={{ width: `${55 + ((r * 7 + c * 13) % 40)}%` }} />
        </td>
      ))}
    </tr>
  ));
}

/** One full-width row explaining why the table is empty, and what to do about it. */
export function TableEmpty({ columns, icon = 'inbox', title, children }) {
  return (
    <tr>
      <td colSpan={columns} className="admin-table-empty">
        <EmptyState icon={icon} title={title}>
          {children}
        </EmptyState>
      </td>
    </tr>
  );
}

export function EmptyState({ icon = 'inbox', title, children }) {
  return (
    <div className="admin-empty">
      <span className="admin-empty-icon" aria-hidden="true">
        <Icon name={icon} size={26} />
      </span>
      {title && <strong>{title}</strong>}
      {children && <p>{children}</p>}
    </div>
  );
}

/** An error banner with an optional retry. */
export function ErrorBanner({ children, onRetry }) {
  if (!children) return null;
  return (
    <div role="alert" className="alert alert-error admin-alert">
      <Icon name="alert" size={18} />
      <span>{children}</span>
      {onRetry && (
        <button type="button" className="admin-link-button" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}
