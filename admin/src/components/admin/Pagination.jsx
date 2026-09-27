import Icon from '../ui/Icon';

/**
 * Prev / next pager for a Spring `Page<T>` response, with "21–40 of 57" so
 * staff know how much there is. `page` is 0-based, matching the API.
 */
export default function Pagination({ data, onChange }) {
  if (!data || !data.totalElements) return null;

  const { number: page, size, totalPages, totalElements, numberOfElements } = data;
  const from = page * size + 1;
  const to = page * size + (numberOfElements ?? 0);

  return (
    <div className="admin-pagination">
      <span className="admin-pagination-info">
        {from}–{to} of {totalElements}
      </span>
      {totalPages > 1 && (
        <div className="admin-pagination-buttons">
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            disabled={page <= 0}
            onClick={() => onChange(page - 1)}
            aria-label="Previous page"
          >
            <Icon name="arrow-left" size={15} />
            PREV
          </button>
          <span className="admin-pagination-page">
            Page {page + 1} / {totalPages}
          </span>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            disabled={page >= totalPages - 1}
            onClick={() => onChange(page + 1)}
            aria-label="Next page"
          >
            NEXT
            <Icon name="arrow-right" size={15} />
          </button>
        </div>
      )}
    </div>
  );
}
