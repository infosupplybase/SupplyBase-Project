import Icon from '../ui/Icon';

/** "10:42 am" */
const clock = (date) => date.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });

/**
 * The dark band at the top of the dashboard: who this is, one plain sentence
 * about their day, and a refresh button with the time it last updated — a
 * partner who keeps the page open all day can see how fresh it is.
 */
export default function WelcomeBand({ eyebrow, title, summary, onRefresh, refreshing, updatedAt, children }) {
  return (
    <section className="pp-band">
      <div className="container pp-band-inner">
        <div className="pp-band-text">
          <span className="pp-eyebrow">{eyebrow}</span>
          <h1>{title}</h1>
          {summary && <p>{summary}</p>}
        </div>

        {onRefresh && (
          <div className="pp-band-tools">
            <button
              type="button"
              className="pp-refresh"
              onClick={onRefresh}
              disabled={refreshing}
              aria-label={refreshing ? 'Refreshing' : 'Refresh jobs and earnings'}
            >
              <Icon name="refresh" size={17} className={refreshing ? 'pp-spin' : ''} />
              <span>{refreshing ? 'Refreshing…' : 'Refresh'}</span>
            </button>
            {updatedAt && <small aria-live="polite">Updated {clock(updatedAt)}</small>}
          </div>
        )}
      </div>
      {children}
    </section>
  );
}
