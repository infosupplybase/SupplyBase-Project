import { useLayoutEffect, useRef } from 'react';

/**
 * The admin's list table. On a wide screen it is an ordinary table; on a
 * phone (see .admin-table-cards in admin.css) each row becomes a stacked card
 * with every value labelled, because a six-column table squeezed into a
 * phone shows half its columns and hides the rest behind a sideways scroll.
 *
 * The labels come from the table's own column headers: after each render,
 * every body cell is given its header's text as `data-label`, which the phone
 * layout prints above the value. Pages write a normal <thead>/<tbody> and
 * never have to repeat the column names.
 */
export default function DataTable({ label, children }) {
  const tableRef = useRef(null);

  useLayoutEffect(() => {
    const table = tableRef.current;
    if (!table) return;
    const headings = [...table.querySelectorAll('thead th')].map((th) => th.textContent.trim());
    table.querySelectorAll('tbody tr').forEach((row) => {
      [...row.children].forEach((cell, index) => {
        if (cell.colSpan > 1) return; // loading/empty rows span the table
        if (cell.getAttribute('data-label') !== headings[index]) {
          cell.setAttribute('data-label', headings[index] || '');
        }
      });
    });
  });

  return (
    <div className="admin-table-wrap admin-table-wrap-cards">
      <table ref={tableRef} className="admin-table admin-table-cards" aria-label={label}>
        {children}
      </table>
    </div>
  );
}
