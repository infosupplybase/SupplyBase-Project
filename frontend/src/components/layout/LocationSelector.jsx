import { useEffect, useRef, useState } from 'react';
import Icon from '../ui/Icon';
import { useLocationContext, usePickedLocation } from '../../context/LocationContext';
import { hasGoogleMaps } from './GoogleLocationPicker';
import SavedAddressPicker from '../booking/SavedAddressPicker';

/** Header control showing the customer's selected location — real state
    (LocationContext), not a hard-coded city. With a Google Maps key it opens
    the address popup (type an address, label it, pick from saved ones);
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

      {pickerOpen && <LocationPopup onClose={() => setPickerOpen(false)} />}
    </>
  );
}

/** "Your location": add a typed address with a label, or tap a saved one. */
function LocationPopup({ onClose }) {
  const { setLocation } = useLocationContext();
  const pickedLocation = usePickedLocation();

  useEffect(() => {
    const onKey = (e) => {
      // The map picker opened from inside handles its own Escape.
      if (e.key === 'Escape' && document.querySelectorAll('.google-location-modal').length < 2) {
        onClose();
      }
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  return (
    <div
      className="google-location-overlay"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="google-location-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="location-popup-title"
      >
        <div className="google-location-header">
          <div>
            <span className="google-location-brand">SUPPLYBASE</span>
            <h2 id="location-popup-title">YOUR LOCATION</h2>
            <p>Type your address and save it, or pick one of your saved places.</p>
          </div>
          <button
            type="button"
            className="google-location-close"
            onClick={onClose}
            aria-label="Close"
          >
            <Icon name="close" size={20} />
          </button>
        </div>

        <div className="loc-book-modal-body">
          <SavedAddressPicker
            selected={pickedLocation}
            idPrefix="hdr"
            onUse={(place) => {
              setLocation({
                address: place.address,
                latitude: place.latitude,
                longitude: place.longitude,
                label: place.label,
              });
              onClose();
            }}
          />
        </div>
      </div>
    </div>
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
