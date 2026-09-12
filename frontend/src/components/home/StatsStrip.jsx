import Icon from '../ui/Icon';
export default function StatsStrip() {
  return (
    <section className="uc-stats-strip">
      <div className="uc-container">
        <div className="uc-stats-row">

          {/* Stat 1 — Rating with Star SVG */}
          <div className="uc-stat-item">
            <span className="uc-stat-icon">
              <svg
                width="36"
                height="36"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            </span>
            <div className="uc-stat-text">
              <span className="uc-stat-value">4.5</span>
              <span className="uc-stat-label">Service Rating</span>
            </div>
          </div>

          {/* Stat 2 — Customers with Users SVG */}
          <div className="uc-stat-item">
            <span className="uc-stat-icon">
              <svg
                width="36"
                height="36"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </span>
            <div className="uc-stat-text">
              <span className="uc-stat-value">500+</span>
              <span className="uc-stat-label">Trusted by Customers</span>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}