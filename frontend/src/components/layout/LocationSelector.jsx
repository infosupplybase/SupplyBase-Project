import { useEffect, useRef, useState } from 'react';
import Icon from '../ui/Icon';
import { useLocationContext } from '../../context/LocationContext';

/** Header control showing the customer's selected service area — real state
    (LocationContext), not a hard-coded city. */
export default function LocationSelector() {
  const { location, setLocation, serviceAreas } = useLocationContext();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onDocClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="location-select" ref={ref}>
      <button
        type="button"
        className="location-btn"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <Icon name="map-pin" size={16} />
        <span>{location}</span>
        <Icon name="chevron-down" size={13} />
      </button>

      {open && (
        <ul className="location-menu" role="listbox" aria-label="Choose your service area">
          {serviceAreas.map((area) => (
            <li key={area}>
              <button
                type="button"
                role="option"
                aria-selected={area === location}
                className={area === location ? 'active' : ''}
                onClick={() => {
                  setLocation(area);
                  setOpen(false);
                }}
              >
                {area}
                {area === location && <Icon name="check" size={14} strokeWidth={3} />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
