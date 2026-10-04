import { useEffect, useRef, useState } from 'react';
import Icon from '../ui/Icon';
import GoogleLocationPicker, {
  getCurrentLocation,
  loadGoogleMaps,
  mapsKeyRejected,
  MAPS_AUTH_FAILED,
  reverseGeocode,
} from '../layout/GoogleLocationPicker';
import { samePlace, useSavedAddresses } from '../../lib/savedAddresses';

const SEARCH_UNAVAILABLE =
  'Address search is not available right now. Use your current location, or type your address below.';

const coords = (place) =>
  `${Number(place.latitude).toFixed(6)}, ${Number(place.longitude).toFixed(6)}`;

/** A typed search box backed by Google Places; calls onPick with a draft. */
function PlaceSearch({ onPick, onError }) {
  const containerRef = useRef(null);
  const onPickRef = useRef(onPick);
  const onErrorRef = useRef(onError);
  onPickRef.current = onPick;
  onErrorRef.current = onError;

  useEffect(() => {
    let cancelled = false;
    let element = null;

    const fail = () => onErrorRef.current(SEARCH_UNAVAILABLE);
    if (mapsKeyRejected()) fail();
    window.addEventListener(MAPS_AUTH_FAILED, fail);

    const handleSelect = async (event) => {
      try {
        const place = event.placePrediction?.toPlace();
        if (!place) return;
        await place.fetchFields({
          fields: ['displayName', 'formattedAddress', 'location', 'addressComponents'],
        });
        if (!place.location) {
          onErrorRef.current('That place has no map position. Please try a nearby landmark.');
          return;
        }
        const part = (type) =>
          place.addressComponents?.find((c) => c.types?.includes(type))?.longText || '';
        const latitude = place.location.lat();
        const longitude = place.location.lng();
        onPickRef.current({
          address: place.formattedAddress || place.displayName || coords({ latitude, longitude }),
          latitude,
          longitude,
          city:
            part('locality') ||
            part('administrative_area_level_3') ||
            part('administrative_area_level_2'),
          pincode: part('postal_code'),
          suggestedLabel: place.displayName || '',
        });
      } catch (err) {
        console.error('Place lookup failed:', err);
        onErrorRef.current('Could not look up that address. Please try again.');
      }
    };

    (async () => {
      try {
        const maps = await loadGoogleMaps();
        const { PlaceAutocompleteElement } = await maps.importLibrary('places');
        if (cancelled || !containerRef.current) return;
        element = new PlaceAutocompleteElement();
        element.placeholder = 'Type your address, building or landmark';
        element.includedRegionCodes = ['in'];
        element.addEventListener('gmp-select', handleSelect);
        containerRef.current.replaceChildren(element);
      } catch (err) {
        console.error('Address search failed to load:', err);
        if (!cancelled) fail();
      }
    })();

    return () => {
      cancelled = true;
      window.removeEventListener(MAPS_AUTH_FAILED, fail);
      if (element) {
        element.removeEventListener('gmp-select', handleSelect);
        element.remove();
      }
    };
  }, []);

  return <div ref={containerRef} className="loc-book-search" />;
}

/**
 * The booking's location section: type an address (or use the current
 * location, or tap the map), check the full address and coordinates it
 * resolved to, give it a label, and add it. Saved addresses are listed
 * underneath with Edit and Delete; tapping one uses it for this booking.
 *
 * `selected` is the current map pin (usePickedLocation); `onUse(place)` is
 * called with { address, latitude, longitude, city, pincode }.
 */
export default function SavedAddressPicker({ selected, onUse, idPrefix = 'bk' }) {
  const { addresses, save, remove } = useSavedAddresses();
  const [formOpen, setFormOpen] = useState(() => addresses.length === 0 && !selected);
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState(null);
  const [label, setLabel] = useState('');
  // Once the customer types a label, a new search no longer replaces it.
  const labelTyped = useRef(false);
  const [error, setError] = useState('');
  const [locating, setLocating] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);
  // Remounts the search box so it starts empty after an add or cancel.
  const [searchKey, setSearchKey] = useState(0);

  const unsavedPin = selected && !addresses.some((a) => samePlace(a, selected)) ? selected : null;

  const takeDraft = (place, suggestedLabel = '') => {
    setDraft({
      address: place.address,
      latitude: place.latitude,
      longitude: place.longitude,
      city: place.city || '',
      pincode: place.pincode || '',
    });
    if (!labelTyped.current) setLabel((current) => suggestedLabel || current);
    setError('');
  };

  const openForm = (entry = null) => {
    setEditingId(entry?.id || null);
    setDraft(entry ? { ...entry } : null);
    setLabel(entry?.label || '');
    labelTyped.current = Boolean(entry);
    setError('');
    setSearchKey((k) => k + 1);
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditingId(null);
    setDraft(null);
    setLabel('');
    setError('');
    setSearchKey((k) => k + 1);
  };

  const useCurrentLocation = async () => {
    setLocating(true);
    setError('');
    try {
      takeDraft(await getCurrentLocation());
    } catch (err) {
      setError(err.message || 'Unable to get your current location.');
    } finally {
      setLocating(false);
    }
  };

  const pickedOnMap = async (place) => {
    setMapOpen(false);
    // A tap on the map comes back as bare coordinates; name the spot if Google can.
    const named = /^selected location\b/i.test(place.address)
      ? await reverseGeocode(place.latitude, place.longitude)
      : null;
    takeDraft({ ...place, ...(named || {}), address: named?.address || place.address });
  };

  const submit = () => {
    if (!draft) {
      setError('Search for your address first.');
      return;
    }
    const entry = save({
      ...draft,
      id: editingId || undefined,
      label: label.trim() || draft.address.split(',')[0].trim(),
    });
    // Editing an address that isn't this booking's leaves the booking alone.
    if (!editingId || samePlace(addresses.find((a) => a.id === editingId), selected)) {
      onUse(entry);
    }
    closeForm();
  };

  return (
    <div className="loc-book">
      {formOpen ? (
        <div className="loc-book-card">
          <h4 className="loc-book-title">{editingId ? 'Edit address' : 'Add an address'}</h4>

          <PlaceSearch
            key={searchKey}
            onPick={(place) => takeDraft(place, place.suggestedLabel)}
            onError={setError}
          />

          <div className="loc-book-alt">
            <button type="button" onClick={useCurrentLocation} disabled={locating} aria-busy={locating}>
              <Icon name="locate" size={15} className={locating ? 'spin-slow' : ''} />
              {locating ? 'Finding you…' : 'Use my current location'}
            </button>
            <button type="button" onClick={() => setMapOpen(true)}>
              <Icon name="map-pin" size={15} />
              Pick on the map
            </button>
          </div>

          {error && (
            <p className="loc-book-error" role="alert">
              {error}
            </p>
          )}

          {draft && (
            <div className="loc-book-resolved">
              <div className="loc-book-place">
                <Icon name="map-pin" size={18} />
                <div>
                  <p className="loc-book-address">{draft.address}</p>
                  <p className="loc-book-coords">{coords(draft)}</p>
                </div>
              </div>

              <label htmlFor={`${idPrefix}-loc-label`} className="loc-book-label">
                Label
              </label>
              <input
                id={`${idPrefix}-loc-label`}
                type="text"
                value={label}
                maxLength={40}
                onChange={(e) => {
                  labelTyped.current = true;
                  setLabel(e.target.value);
                }}
                placeholder="Home"
              />
              <p className="loc-book-hint">A name you'll recognise next time, e.g. "Home" or "Site - Palava".</p>

              <div className="loc-book-actions">
                <button type="button" className="loc-book-primary" onClick={submit}>
                  {editingId ? 'Save changes' : 'Add address'}
                </button>
                <button type="button" className="loc-book-cancel" onClick={closeForm}>
                  Cancel
                </button>
              </div>
            </div>
          )}

          {!draft && (addresses.length > 0 || selected || editingId) && (
            <div className="loc-book-actions">
              <button type="button" className="loc-book-cancel" onClick={closeForm}>
                Cancel
              </button>
            </div>
          )}
        </div>
      ) : (
        <button type="button" className="loc-book-add" onClick={() => openForm()}>
          <Icon name="plus" size={16} strokeWidth={2.2} />
          Add a new address
        </button>
      )}

      {(unsavedPin || addresses.length > 0) && (
        <ul className="loc-book-list" aria-label="Your addresses">
          {unsavedPin && (
            <li className="loc-book-item active">
              <div className="loc-book-item-main">
                <span className="loc-book-radio" aria-hidden="true" />
                <span className="loc-book-item-text">
                  <strong>Pinned location</strong>
                  <span>{unsavedPin.address}</span>
                </span>
              </div>
              <button
                type="button"
                className="loc-book-item-btn"
                onClick={() => {
                  openForm();
                  takeDraft(unsavedPin);
                }}
              >
                <Icon name="plus" size={15} />
                Save
              </button>
            </li>
          )}

          {addresses.map((entry) => {
            const active = samePlace(entry, selected);
            return (
              <li key={entry.id} className={`loc-book-item ${active ? 'active' : ''}`}>
                <button
                  type="button"
                  className="loc-book-item-main"
                  onClick={() => onUse(entry)}
                  aria-pressed={active}
                  title={entry.address}
                >
                  <span className="loc-book-radio" aria-hidden="true" />
                  <span className="loc-book-item-text">
                    <strong>{entry.label}</strong>
                    <span>{entry.address}</span>
                  </span>
                </button>
                <button
                  type="button"
                  className="loc-book-item-btn"
                  onClick={() => openForm(entry)}
                  aria-label={`Edit ${entry.label}`}
                >
                  <Icon name="edit" size={15} />
                  Edit
                </button>
                <button
                  type="button"
                  className="loc-book-item-btn loc-book-delete"
                  onClick={() => {
                    if (editingId === entry.id) closeForm();
                    remove(entry.id);
                  }}
                  aria-label={`Delete ${entry.label}`}
                  title="Delete"
                >
                  <Icon name="trash" size={17} />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <GoogleLocationPicker open={mapOpen} onClose={() => setMapOpen(false)} onSelect={pickedOnMap} />
    </div>
  );
}
