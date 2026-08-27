/**
 * The faint architectural line-work behind the statistics.
 *
 * Drawn rather than photographed: a blueprint frame on the left, a tower crane
 * on the right, a dot grid in each lower corner. It is decorative, so it is
 * hidden from assistive tech and ignores the pointer, and every stroke is set
 * in CSS so the opacity can drop on a phone without touching this file.
 */
export default function StatsBackdrop() {
  return (
    <svg
      className="wss-backdrop"
      viewBox="0 0 1600 700"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <pattern id="wss-dots" width="16" height="16" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1.6" />
        </pattern>
      </defs>

      {/* ---- left: a building under construction, seen straight on ---- */}
      <g className="wss-lines">
        <path d="M60 620V250l150-70 150 70v370" />
        <path d="M60 250h300M110 620V300h200v320M160 300v320M260 300v320" />
        <path d="M110 380h200M110 460h200M110 540h200" />
        <path d="M210 180V90M150 130h120" />

        <path d="M330 620V330l130-58 130 58v290" />
        <path d="M330 330h260M395 620V380h130v240M395 450h130M395 520h130" />
      </g>

      {/* ---- right: tower crane ---- */}
      <g className="wss-lines">
        <path d="M1430 640V120M1400 640h60" />
        <path d="M1430 140h180M1430 140h-90M1195 140v70M1610 140v40" />
        <path d="M1430 120 1520 140 1430 160M1430 120l-60 20 60 20" />
        <path d="M1430 190 1610 140M1430 190l-235-50" />
        <path d="M1300 140v-40h-40M1300 100l130 40" />
        <path d="M1195 210h44M1217 210v40M1200 250h34" />
      </g>

      {/* ---- corner dot grids ---- */}
      <rect className="wss-dotfield" x="30" y="560" width="130" height="110" fill="url(#wss-dots)" />
      <rect className="wss-dotfield" x="1450" y="560" width="130" height="110" fill="url(#wss-dots)" />
    </svg>
  );
}
