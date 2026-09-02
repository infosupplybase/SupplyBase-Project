import Icon from '../ui/Icon';

/**
 * Prev / next pager for a Spring `Page<T>` response.
 * `page` is 0-based, matching what the API takes and returns.
 */
export default function Pagination({ page, totalPages, onChange }) {
  if (!totalPages || totalPages <= 1) return null;

  return (
    <div className="admin-pagination">
      <button
        type="button"
        className="btn btn-outline btn-sm"
        disabled={page <= 0}
        onClick={() => onChange(page - 1)}
      >
        <Icon name="arrow-left" size={15} />
        PREV
      </button>
      <span>
        Page {page + 1} of {totalPages}
      </span>
      <button
        type="button"
        className="btn btn-outline btn-sm"
        disabled={page >= totalPages - 1}
        onClick={() => onChange(page + 1)}
      >
        NEXT
        <Icon name="arrow-right" size={15} />
      </button>
    </div>
  );
}
