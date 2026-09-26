/**
 * Props for a table row that opens something when clicked. A bare onClick on
 * a <tr> can only be used with a mouse; this also makes the row reachable
 * with Tab and openable with Enter or Space, so the whole admin works from
 * the keyboard.
 */
export default function rowProps(onOpen, labelText) {
  return {
    className: 'admin-table-row',
    tabIndex: 0,
    'aria-label': labelText,
    onClick: onOpen,
    onKeyDown: (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onOpen();
      }
    },
  };
}
