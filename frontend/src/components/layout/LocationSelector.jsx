import { useEffect, useRef, useState } from 'react';
import Icon from '../ui/Icon';
import { useLocationContext } from '../../context/LocationContext';
import GoogleLocationPicker, { hasGoogleMaps } from './GoogleLocationPicker';

/** Header control showing the customer's selected location — real state
    (LocationContext), not a hard-coded city. With a Google Maps key it opens
    the map picker (search, tap the map, or use the current location);
    without one it offers the published service areas. */
export default function LocationSelector() {
  return hasGoogleMaps ? <GoogleLocationButton /> : <ServiceAreaMenu />;
}

/** The pill itself: a pin and a small caption over the short place name.
    Until the customer picks a location the caption asks them to, and the
    pin pulses gently so the control is noticed. */
function LocationButton({ open, ...props }) {
  const { location, shortLocation, locationChosen } = useLocationContext();

  return (
    <button
      type="button"
      className={`location-btn ${locationChosen ? '' : 'unset'} ${open ? 'open' : ''}`}
      title={locationChosen ? `${location} (tap to change)` : 'Choose where you need the service'}
      aria-label={
        locationChosen
          ? `Service location: ${location}. Change location`
          : 'Set your service location'
      }
      {...props}
    >
      <span className="location-btn-pin" aria-hidden="true">
        <Icon name="map-pin" size={16} />
      </span>
      <span className="location-btn-body">
        <span className="location-btn-caption">
          {locationChosen ? 'Your location' : 'Set location'}
        </span>
        <span className="location-btn-text">{shortLocation}</span>
      </span>
    </button>
  );
}

function GoogleLocationButton() {
  const { setLocation } = useLocationContext();
  const [pickerOpen, setPickerOpen] = useState(false);

  return (
    <>
      <div className="location-select">
        <LocationButton
          open={pickerOpen}
          onClick={() => setPickerOpen(true)}
          aria-haspopup="dialog"
        />
      </div>

      <GoogleLocationPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={(selectedLocation) => {
          setLocation(selectedLocation);
          setPickerOpen(false);
        }}
      />
    </>
  );
}

function ServiceAreaMenu() {
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
      <LocationButton
        open={open}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
      />

      {open && (
        <ul className="location-menu" role="listbox" aria-label="Choose your service area">
          <li className="location-menu-title" role="presentation">
            Where do you need the service?
          </li>
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
