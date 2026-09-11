/**
 * Icon — a single inline-SVG icon set so the site needs no icon library.
 * Usage: <Icon name="phone" size={20} />
 * All icons inherit the current text colour.
 */

const paths = {
  /* ---------------------------------------------------------- services */
  building: (
    <>
      <path d="M3 21h18" />
      <path d="M5 21V6a1 1 0 0 1 1-1h5a1 1 0 0 1 1 1v15" />
      <path d="M12 21V10a1 1 0 0 1 1-1h5a1 1 0 0 1 1 1v11" />
      <path d="M8 9h1M8 13h1M8 17h1M15 13h1M15 17h1" />
    </>
  ),
  crane: (
    <>
      <path d="M4 21h16" />
      <path d="M8 21V4h12" />
      <path d="M8 8 20 4" />
      <path d="M16 4v5" />
      <rect x="13" y="9" width="6" height="5" rx="1" />
      <path d="M5 21v-6h6v6" />
    </>
  ),
  sofa: (
    <>
      <path d="M4 12V8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4" />
      <path d="M2 14a2 2 0 0 1 2-2 2 2 0 0 1 2 2v3h12v-3a2 2 0 0 1 4 0v5H2z" />
      <path d="M7 12V9h10v3" />
    </>
  ),
  roller: (
    <>
      <rect x="3" y="4" width="13" height="6" rx="1" />
      <path d="M16 7h3a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-7v2" />
      <rect x="10" y="14" width="4" height="7" rx="1" />
    </>
  ),
  ceiling: (
    <>
      <path d="M3 5h18" />
      <path d="M5 5v4h14V5" />
      <path d="M7 9v3M12 9v5M17 9v3" />
      <path d="M9 20h6" />
      <path d="M12 14v6" />
    </>
  ),
  bolt: (
    <>
      <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8z" />
    </>
  ),
  tap: (
    <>
      <path d="M9 6h6" />
      <path d="M12 6v4" />
      <path d="M6 14a6 6 0 0 1 12 0" />
      <path d="M4 14h16" />
      <path d="M12 14v3" />
      <path d="M10 21h4" />
      <path d="M12 17v4" />
    </>
  ),
  wardrobe: (
    <>
      <rect x="4" y="3" width="16" height="18" rx="1" />
      <path d="M12 3v18" />
      <path d="M10 11v2M14 11v2" />
      <path d="M4 8h16" />
    </>
  ),
  welding: (
    <>
      <path d="m14 4 6 6-3 3-6-6z" />
      <path d="m11 7-7 7v6h6l7-7" />
      <path d="M4 20 2 22" />
      <path d="M18 3 20 1M21 6l2-2" />
    </>
  ),
  trowel: (
    <>
      <path d="M3 12 12 3l9 9-9 9z" />
      <path d="M8 12h8M12 8v8" />
    </>
  ),
  key: (
    <>
      <path d="M3 12a5 5 0 1 0 10 0 5 5 0 0 0-10 0z" />
      <path d="M13 12h8" />
      <path d="M18 12v4M21 12v3" />
    </>
  ),

  /* ------------------------------------------------------- trust / why */
  partners: (
    <>
      <circle cx="8" cy="8" r="3" />
      <circle cx="17" cy="9" r="2.5" />
      <path d="M2 20a6 6 0 0 1 12 0" />
      <path d="M15 20a5 5 0 0 1 7-4.6" />
    </>
  ),
  /* Three heads rather than two — the stats card reference shows a group,
     and `partners` reads as a pair. */
  users: (
    <>
      <circle cx="12" cy="7.5" r="3" />
      <circle cx="4.75" cy="9" r="2.25" />
      <circle cx="19.25" cy="9" r="2.25" />
      <path d="M6.5 19a5.5 5.5 0 0 1 11 0" />
      <path d="M1.5 17.5a4 4 0 0 1 4.2-3.4" />
      <path d="M22.5 17.5a4 4 0 0 0-4.2-3.4" />
    </>
  ),
  award: (
    <>
      <circle cx="12" cy="9.5" r="5.5" />
      <path d="m12 6.6 1 2 2.2.3-1.6 1.5.4 2.2-2-1-2 1 .4-2.2L8.8 9l2.2-.3z" />
      <path d="m8.4 14.3-1.6 6.2 5.2-2.6 5.2 2.6-1.6-6.2" />
    </>
  ),
  'thumbs-up': (
    <>
      <path d="M7 21V10l4.5-7a2 2 0 0 1 3 2.2L13.5 9H19a2 2 0 0 1 2 2.4l-1.5 7A2.5 2.5 0 0 1 17 21z" />
      <rect x="2.5" y="10" width="4.5" height="11" rx="1.2" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3 5 6v6c0 4.5 3 7.8 7 9 4-1.2 7-4.5 7-9V6z" />
      <path d="m9 12 2 2 4-4" />
    </>
  ),
  team: (
    <>
      <path d="M3 20h18" />
      <path d="M6 20v-6l6-5 6 5v6" />
      <path d="M9 20v-4h6v4" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.5 2" />
    </>
  ),
  'home-check': (
    <>
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 10v10h14V10" />
      <path d="m9.5 15 2 2 3.5-3.5" />
    </>
  ),
  package: (
    <>
      <path d="M12 3 3 7.5v9L12 21l9-4.5v-9z" />
      <path d="M3 7.5 12 12l9-4.5" />
      <path d="M12 12v9" />
    </>
  ),
  rupee: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M9 7h6M9 10.5h6M13.5 7c1.6 0 2.4 1.2 2.4 2.6 0 1.6-1.2 2.6-3 2.6H9l5 4.8" />
    </>
  ),

  /* ---------------------------------------------------------- process */
  chat: (
    <>
      <path d="M20 15a2 2 0 0 1-2 2H8l-4 4V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2z" />
      <path d="M8.5 10.5h.01M12 10.5h.01M15.5 10.5h.01" />
    </>
  ),
  blueprint: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="1.5" />
      <path d="M3 9h18M9 4v16" />
      <path d="M13 13h5M13 16h3" />
    </>
  ),
  helmet: (
    <>
      <path d="M3 17h18" />
      <path d="M5 17v-2a7 7 0 0 1 14 0v2" />
      <path d="M10 8V5h4v3" />
      <path d="M3 17v1a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-1" />
    </>
  ),
  handover: (
    <>
      <path d="M3 11 12 4l9 7" />
      <path d="M5 10.5V20h14v-9.5" />
      <path d="M9 20v-5h6v5" />
      <path d="m15.5 11.5 1.2 1.2 2.3-2.3" />
    </>
  ),

  /* ----------------------------------------------------------- arrows */
  'arrow-right': (
    <>
      <path d="M4 12h15" />
      <path d="m13 6 6 6-6 6" />
    </>
  ),
  'arrow-left': (
    <>
      <path d="M20 12H5" />
      <path d="m11 6-6 6 6 6" />
    </>
  ),
  'arrow-up': (
    <>
      <path d="M12 20V5" />
      <path d="m6 11 6-6 6 6" />
    </>
  ),
  'chevron-down': <path d="m6 9 6 6 6-6" />,
  'chevron-right': <path d="m9 6 6 6-6 6" />,

  /* ---------------------------------------------------------- contact */
  phone: (
    <>
      <path d="M6.5 3h3l1.5 4-2 1.5a12 12 0 0 0 5.5 5.5L16 12l4 1.5v3a1.8 1.8 0 0 1-2 1.8A15.5 15.5 0 0 1 4.7 5 1.8 1.8 0 0 1 6.5 3z" />
    </>
  ),
  mail: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3.5 7 8.5 6 8.5-6" />
    </>
  ),
  'map-pin': (
    <>
      <path d="M12 21s7-6 7-11a7 7 0 1 0-14 0c0 5 7 11 7 11z" />
      <circle cx="12" cy="10" r="2.6" />
    </>
  ),
  whatsapp: (
    <>
      <path d="M3.5 20.5 5 16.4A8.2 8.2 0 1 1 8 19.3z" />
      <path d="M9 9.2c0 3 2.4 5.4 5.3 5.4.5 0 1-.4 1-.9v-.9l-1.8-.8-.9 1a6 6 0 0 1-2.2-2.2l1-.9L10.6 8h-.8c-.5 0-.9.5-.9 1z" />
    </>
  ),

  /* -------------------------------------------------------------- ui */
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  close: <path d="m6 6 12 12M18 6 6 18" />,
  plus: <path d="M12 5v14M5 12h14" />,
  check: <path d="m5 12.5 5 5 9-11" />,
  'check-circle': (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m8.5 12.5 2.5 2.5 4.5-5.5" />
    </>
  ),
  upload: (
    <>
      <path d="M12 16V4" />
      <path d="m7 9 5-5 5 5" />
      <path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
    </>
  ),
  lock: (
    <>
      <rect x="4.5" y="10" width="15" height="10" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </>
  ),
  eye: (
    <>
      <path d="M2 12s3.6-6 10-6 10 6 10 6-3.6 6-10 6-10-6-10-6z" />
      <circle cx="12" cy="12" r="2.7" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5M12 7.8h.01" />
    </>
  ),
  droplet: (
    <>
      <path d="M12 3.5c3.2 3.4 5.5 6.2 5.5 8.9a5.5 5.5 0 0 1-11 0c0-2.7 2.3-5.5 5.5-8.9z" />
      <path d="M9.5 13.2a2.6 2.6 0 0 0 2.5 2.6" />
    </>
  ),
  /* -------------------------------------------------- wall condition (painting) */
  'wall-crack': (
    <>
      <rect x="3" y="3.5" width="18" height="17" rx="1.5" />
      <path d="M9 3.5 11 9l-2.5 2 3 3-1.5 5.5" />
    </>
  ),
  'wall-peel': (
    <>
      <rect x="3" y="3.5" width="18" height="17" rx="1.5" />
      <path d="M13 3.5v7.5l4.5-2.5" />
      <path d="M13 11 9 13.5" />
    </>
  ),
  'wall-stain': (
    <>
      <rect x="3" y="3.5" width="18" height="17" rx="1.5" />
      <path d="M14 8.5c1.8 0 3.2 1.3 3.2 3.1 0 1.3-.9 2.1-2.2 2.6 1 .5 1.6 1.2 1.6 2.2 0 1.6-1.5 2.6-3.2 2.6-2.2 0-3.6-1.3-3.8-3" />
    </>
  ),
  'wall-mould': (
    <>
      <rect x="3" y="3.5" width="18" height="17" rx="1.5" />
      <circle cx="9" cy="9" r="1.3" />
      <circle cx="13.2" cy="8" r="1" />
      <circle cx="11.2" cy="12.5" r="1.6" />
      <circle cx="15.5" cy="13" r="1" />
      <circle cx="9.5" cy="16" r="1.1" />
    </>
  ),
  'wall-faded': (
    <>
      <rect x="3" y="3.5" width="18" height="17" rx="1.5" strokeDasharray="3 2.5" />
    </>
  ),
  sparkle: (
    <>
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4" />
      <path d="m6.3 6.3 2 2M15.7 15.7l2 2M6.3 17.7l2-2M15.7 8.3l2-2" />
    </>
  ),
  palette: (
    <>
      <path d="M12 3a9 9 0 1 0 0 18c1.4 0 2-1 2-2 0-.6-.3-1-.6-1.4-.3-.4-.3-1.1.4-1.4.5-.2 1.2-.2 2 0 1.7.4 3.2-.5 3.2-2.4A8.9 8.9 0 0 0 12 3z" />
      <circle cx="7.5" cy="11" r="1.1" />
      <circle cx="9.5" cy="7.3" r="1.1" />
      <circle cx="14.5" cy="7.3" r="1.1" />
      <circle cx="16.5" cy="11" r="1.1" />
    </>
  ),
  ruler: (
    <>
      <rect x="2.5" y="8" width="19" height="8" rx="1.5" />
      <path d="M7 8v3M11 8v4M15 8v3M19 8v4" />
    </>
  ),
  layers: (
    <>
      <path d="m12 3 9 5-9 5-9-5z" />
      <path d="m3 13 9 5 9-5" />
    </>
  ),
  calendar: (
    <>
      <rect x="3.5" y="5" width="17" height="16" rx="2" />
      <path d="M3.5 10h17M8 3v4M16 3v4" />
    </>
  ),
  heart: (
    <path d="M12 20.5s-7.5-4.6-9.8-9.4C.8 7.6 2.4 4 6 4c2 0 3.5 1.1 4.3 2.7L12 8.9l1.7-2.2C14.5 5.1 16 4 18 4c3.6 0 5.2 3.6 3.8 7.1-2.3 4.8-9.8 9.4-9.8 9.4z" />
  ),
  fan: (
    <>
      <circle cx="12" cy="12" r="1.8" />
      <path d="M12 10.2C12 6 10 3 7 3s-3 3 0 5.5c1.3 1.1 3 1.6 5 1.7z" />
      <path d="M13.8 12c4.2 0 7.2 2 7.2 5s-3 3-5.5 0c-1.1-1.3-1.6-3-1.7-5z" />
      <path d="M12 13.8c0 4.2-2 7.2-5 7.2s-3-3 0-5.5c1.3-1.1 3-1.6 5-1.7z" />
    </>
  ),
  plug: (
    <>
      <path d="M9 3v5M15 3v5" />
      <path d="M6.5 8h11v3a5.5 5.5 0 0 1-5.5 5.5A5.5 5.5 0 0 1 6.5 11z" />
      <path d="M12 16.5V21" />
    </>
  ),
  wrench: (
    <path d="M14.7 6.3a4 4 0 0 0-5.4 4.9L3 17.5 6.5 21l6.3-6.3a4 4 0 0 0 4.9-5.4l-2.8 2.8-2.1-2.1z" />
  ),
  bell: (
    <>
      <path d="M18 16v-5a6 6 0 0 0-12 0v5l-2 3h16z" />
      <path d="M9.5 19a2.5 2.5 0 0 0 5 0" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3.2" />
      <path d="M12 3v2.2M12 18.8V21M4.9 4.9l1.55 1.55M17.55 17.55 19.1 19.1M3 12h2.2M18.8 12H21M4.9 19.1l1.55-1.55M17.55 6.45 19.1 4.9" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </>
  ),
  share: (
    <>
      <circle cx="18" cy="5" r="2.5" />
      <circle cx="6" cy="12" r="2.5" />
      <circle cx="18" cy="19" r="2.5" />
      <path d="m8.3 10.7 7.4-4.4M8.3 13.3l7.4 4.4" />
    </>
  ),

  /* ---------------------------------------------------------- social */
  facebook: <path d="M14.5 8.5H17V5h-2.5A4 4 0 0 0 10.5 9v2H8v3.5h2.5V22H14v-7.5h2.5L17 11h-3V9.3c0-.5.3-.8 1-.8z" />,
  instagram: (
    <>
      <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17" cy="7" r="1" />
    </>
  ),
  linkedin: (
    <>
      <rect x="3.5" y="3.5" width="17" height="17" rx="2" />
      <path d="M8 10.5V17M8 7.5v.01M12 17v-3.6c0-1.4 1-2.4 2.2-2.4S16.5 12 16.5 13.4V17" />
      <path d="M12 10.5V17" />
    </>
  ),
  youtube: (
    <>
      <rect x="2.5" y="6" width="19" height="12" rx="3.5" />
      <path d="m10.5 9.5 5 2.5-5 2.5z" />
    </>
  ),

  /* -------------------------------------------------------- pop ceiling */
  tv: (
    <>
      <rect x="2.5" y="4.5" width="19" height="13" rx="1.5" />
      <path d="M8 21h8M12 17.5V21" />
    </>
  ),
  cove: (
    <>
      <path d="M3 6h18" />
      <path d="M3 6c2 3 4 4 9 4s7-1 9-4" />
      <path d="M9 20h6M12 14v6" />
    </>
  ),
  tray: (
    <>
      <rect x="3" y="4" width="18" height="6" rx="1" />
      <rect x="6.5" y="10" width="11" height="5" rx="1" />
      <path d="M9 20h6M12 15v5" />
    </>
  ),
  border: (
    <>
      <rect x="3" y="4" width="18" height="5" rx="1" />
      <path d="M6 9v9M18 9v9" />
      <path d="M9 20h6M12 9v11" />
    </>
  ),
  cornice: (
    <>
      <path d="M3 4h18v4H10v13H3z" />
      <path d="M3 4v13h7" />
    </>
  ),
  moulding: (
    <>
      <path d="M3 6h18" />
      <path d="M3 6v3M8 6v3M13 6v3M18 6v3M21 6v3" />
      <path d="M9 20h6M12 9v11" />
    </>
  ),
  curtain: (
    <>
      <path d="M4 4h16" />
      <path d="M6 4c0 6-2 8-2 14M18 4c0 6 2 8 2 14" />
      <path d="M10 4c0 7-1.5 9-1.5 14M14 4c0 7 1.5 9 1.5 14" />
    </>
  ),
  panel: (
    <>
      <rect x="3" y="3.5" width="18" height="17" rx="1.5" />
      <path d="M9 3.5v17M15 3.5v17" />
    </>
  ),
};

export default function Icon({ name, size = 22, strokeWidth = 1.6, className = '', ...rest }) {
  const path = paths[name];
  if (!path) return null;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {path}
    </svg>
  );
}
