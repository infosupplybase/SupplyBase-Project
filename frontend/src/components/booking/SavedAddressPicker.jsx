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

/** The typed text with the part Google matched in bold. */
function Highlighted({ text }) {
  if (!text) return null;
  const value = text.text || '';
  const matches = text.matches || [];
  if (!matches.length) return value;

  const pieces = [];
  let at = 0;
  matches.forEach(({ startOffset, endOffset }, index) => {
    if (startOffset > at) pieces.push(value.slice(at, startOffset));
    pieces.push(<strong key={index}>{value.slice(startOffset, endOffset)}</strong>);
    at = endOffset;
  });
  if (at < value.length) pieces.push(value.slice(at));
  return pieces;
}

/**
 * A typed search box backed by Google Places: suggestions open under the box
 * while the customer types, and picking one calls onPick with a draft.
 */
function PlaceSearch({ onPick, onError }) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [highlight, setHighlight] = useState(-1);
  const [open, setOpen] = useState(false);
  const placesRef = useRef(null);
  const sessionRef = useRef(null);
  const requestRef = useRef(0);
  const onPickRef = useRef(onPick);
  const onErrorRef = useRef(onError);
  onPickRef.current = onPick;
  onErrorRef.current = onError;

  useEffect(() => {
    let cancelled = false;
    const fail = () => onErrorRef.current(SEARCH_UNAVAILABLE);
    if (mapsKeyRejected()) fail();
    window.addEventListener(MAPS_AUTH_FAILED, fail);

    loadGoogleMaps()
      .then((maps) => maps.importLibrary('places'))
      .then((places) => {
        if (!cancelled) placesRef.current = places;
      })
      .catch((err) => {
        console.error('Address search failed to load:', err);
        if (!cancelled) fail();
      });

    return () => {
      cancelled = true;
      window.removeEventListener(MAPS_AUTH_FAILED, fail);
    };
  }, []);

  // Ask Google for suggestions a moment after the customer stops typing.
  useEffect(() => {
    const text = query.trim();
    if (text.length < 2) {
      setSuggestions([]);
      return undefined;
    }

    const request = ++requestRef.current;
    const timer = window.setTimeout(async () => {
      const places = placesRef.current;
      if (!places) return;
      try {
        if (!sessionRef.current) sessionRef.current = new places.AutocompleteSessionToken();
        const { suggestions: found } =
          await places.AutocompleteSuggestion.fetchAutocompleteSuggestions({
            input: text,
            includedRegionCodes: ['in'],
            sessionToken: sessionRef.current,
          });
        if (request !== requestRef.current) return;
        setSuggestions((found || []).map((s) => s.placePrediction).filter(Boolean));
        setHighlight(-1);
        setOpen(true);
      } catch (err) {
        console.error('Address suggestions failed:', err);
        if (request === requestRef.current) {
          setSuggestions([]);
          onErrorRef.current(SEARCH_UNAVAILABLE);
        }
      }
    }, 250);

    return () => window.clearTimeout(timer);
  }, [query]);

  const choose = async (prediction) => {
    setOpen(false);
    setSuggestions([]);
    setQuery(prediction.text?.text || '');
    try {
      const place = prediction.toPlace();
      await place.fetchFields({
        fields: ['displayName', 'formattedAddress', 'location', 'addressComponents'],
      });
      // The session ends with the details lookup; the next search starts a new one.
      sessionRef.current = null;
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

  const showList = open && suggestions.length > 0;

  return (
    <div
      className="loc-book-search"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
    >
      <div className="loc-book-search__field">
        <Icon name="search" size={18} />
        <input
          type="text"
          value={query}
          placeholder="Type your address, building or landmark"
          aria-label="Search for your address"
          role="combobox"
          aria-expanded={showList}
          aria-autocomplete="list"
          autoComplete="off"
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
            onErrorRef.current('');
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(event) => {
            if (!showList) return;
            if (event.key === 'ArrowDown') {
              event.preventDefault();
              setHighlight((i) => (i + 1) % suggestions.length);
            } else if (event.key === 'ArrowUp') {
              event.preventDefault();
              setHighlight((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
            } else if (event.key === 'Enter' && highlight >= 0) {
              event.preventDefault();
              choose(suggestions[highlight]);
            } else if (event.key === 'Escape') {
              setOpen(false);
            }
          }}
        />
        {query && (
          <button
            type="button"
            className="loc-book-search__clear"
            aria-label="Clear search"
            onClick={() => {
              setQuery('');
              setSuggestions([]);
            }}
          >
            <Icon name="close" size={16} />
          </button>
        )}
      </div>

      {showList && (
        <ul className="loc-book-suggestions" role="listbox" aria-label="Address suggestions">
          {suggestions.map((prediction, index) => (
            <li key={prediction.placeId || index} role="presentation">
              <button
                type="button"
                role="option"
                aria-selected={index === highlight}
                className={index === highlight ? 'is-active' : ''}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => choose(prediction)}
              >
                <span className="loc-book-suggestions__pin" aria-hidden="true">
                  <Icon name="map-pin" size={16} />
                </span>
                <span className="loc-book-suggestions__text">
                  <span className="loc-book-suggestions__main">
                    <Highlighted text={prediction.mainText || prediction.text} />
                  </span>
                  {prediction.secondaryText?.text && (
                    <span className="loc-book-suggestions__sub">{prediction.secondaryText.text}</span>
                  )}
                </span>
              </button>
            </li>
          ))}
          <li className="loc-book-suggestions__credit" role="presentation">powered by Google</li>
        </ul>
      )}
    </div>
  );
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
  const [formOpen, setFormOpen] = useState(false);
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
    const location = {
      address: place.address,
      latitude: place.latitude,
      longitude: place.longitude,
      city: place.city || '',
      pincode: place.pincode || '',
    };
    setDraft(location);
    // Use the picked spot for this booking straight away, saved or not
    // (editing another saved address still leaves the booking alone).
    if (!editingId) onUse(location);
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
    let entry;
    try {
      entry = save({
        ...draft,
        id: editingId || undefined,
        label: label.trim() || draft.address.split(',')[0].trim(),
      });
    } catch (err) {
      setError(err.message);
      return;
    }
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