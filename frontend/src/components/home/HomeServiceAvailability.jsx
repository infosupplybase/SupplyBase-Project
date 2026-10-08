import { useEffect, useId, useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../ui/Icon';
import GoogleLocationPicker from '../layout/GoogleLocationPicker';
import {
  hasGoogleMaps,
  loadGoogleMaps,
  mapsKeyRejected,
} from '../layout/GoogleLocationPicker';
import { useLocationContext } from '../../context/LocationContext';

const cities = ['Kalyan', 'Thane', 'Badlapur', 'Ambernath'];
const resultCache = new Map();

function normalize(text) {
  return String(text || '')
    .trim()
    .toLowerCase()
    .replace(/[.,]/g, '')
    .replace(/\s+/g, ' ')
    .replace(/\s+(east|west|city)$/g, '');
}

function supportedCity(text) {
  const name = normalize(text);
  if (name === 'ambarnath') return 'Ambernath';
  return cities.find((city) => normalize(city) === name) || null;
}

function cityFromResults(results) {
  for (const result of results || []) {
    const parts = result.address_components || [];
    const country = parts.find((part) => part.types.includes('country'));

    if (country && country.short_name !== 'IN') {
      const foreignCity = parts.find((part) =>
        part.types.includes('locality')
      );
      return foreignCity?.long_name || country.long_name;
    }

    const locality = parts.find((part) =>
      part.types.includes('locality')
    );

    if (locality) {
      // Some addresses use the combined municipal name.
      // Check the specific sublocality instead of allowing all Dombivli.
      if (/^kalyan[\s-]*dombivli$/i.test(locality.long_name)) {
        const neighbourhoods = parts.filter((part) =>
          part.types.some((type) => type.startsWith('sublocality'))
        );
        const match = neighbourhoods
          .map((part) => supportedCity(part.long_name))
          .find(Boolean);
        return match || locality.long_name;
      }
      return locality.long_name;
    }
  }

  // Never use administrative_area_level_2: it may be Thane district.
  for (const result of results || []) {
    const part = (result.address_components || []).find((component) =>
      component.types.includes('postal_town')
    );
    if (part) return part.long_name;
  }

  return null;
}

export default function HomeServiceAvailability() {
  const {
    location,
    locationChosen: storedLocationChosen,
    latitude,
    longitude,
    setLocation,
  } = useLocationContext();

  const [availabilityRequested, setAvailabilityRequested] = useState(false);
  const locationChosen = storedLocationChosen && availabilityRequested;

  const inputId = useId();
  const [manualCity, setManualCity] = useState('');
  const [locationPickerOpen, setLocationPickerOpen] = useState(false);
  const [check, setCheck] = useState({
    key: '',
    status: 'idle',
    city: '',
  });

  const locationKey = JSON.stringify([
    locationChosen,
    location,
    latitude,
    longitude,
  ]);

  useEffect(() => {
    let cancelled = false;

    const save = (status, city = '') => {
      if (!cancelled) {
        setCheck({ key: locationKey, status, city });
      }
    };

    if (!locationChosen) {
      save('idle');
      return () => { cancelled = true; };
    }

    const hasCoordinates =
      latitude != null && longitude != null &&
      Number.isFinite(Number(latitude)) &&
      Number.isFinite(Number(longitude));

    // A plain city selected from a dropdown needs no Google request.
    if (!hasCoordinates && supportedCity(location)) {
      save('available', supportedCity(location));
      return () => { cancelled = true; };
    }

    if (!hasGoogleMaps) {
      const name = String(location || '').trim();
      // Manual city selection is used when Google is not configured.
      if (!hasCoordinates && name && !name.includes(',')) {
        save(supportedCity(name) ? 'available' : 'soon', name);
      } else {
        save('unknown');
      }
      return () => { cancelled = true; };
    }

    const cached = resultCache.get(locationKey);
    if (cached) {
      save(cached.status, cached.city);
      return () => { cancelled = true; };
    }

    save('checking');

    async function checkCity() {
      try {
        const maps = await loadGoogleMaps();
        if (cancelled) return;
        if (mapsKeyRejected()) throw new Error('Maps unavailable');

        const { Geocoder } = await maps.importLibrary('geocoding');
        if (cancelled) return;

        const request = hasCoordinates
          ? {
              location: {
                lat: Number(latitude),
                lng: Number(longitude),
              },
            }
          : { address: location, region: 'IN' };

        const { results } = await new Geocoder().geocode(request);
        const detectedCity = cityFromResults(results);

        if (!detectedCity) {
          save('unknown');
          return;
        }

        const matchedCity = supportedCity(detectedCity);
        const result = {
          status: matchedCity ? 'available' : 'soon',
          city: matchedCity || detectedCity,
        };

        resultCache.set(locationKey, result);
        save(result.status, result.city);
      } catch {
        save('unknown');
      }
    }

    checkCity();
    return () => { cancelled = true; };
  }, [locationKey, locationChosen, location, latitude, longitude]);

  const current = check.key === locationKey
    ? check
    : { status: locationChosen ? 'checking' : 'idle', city: '' };

  const headings = {
    idle: 'Check services in your area',
    checking: 'Checking your location...',
    available: 'Service available in your area',
    soon: 'Service not available in your area',
    unknown: 'Please confirm your location',
  };

  const descriptions = {
    idle: 'Select your city or use your current location to check availability.',
    checking: 'Please wait while we identify your city.',
    available: 'Explore our services and plan your home visit.',
    soon: `We are starting soon in ${current.city}.`,
    unknown: 'We could not confirm your city. Choose your location again or enter your city below.',
  };

  return (
    <section className="sbx-section sbx-section--compact">
      <div className="sbx-wrap">
        <div className={`sbx-area sbx-availability sbx-availability--${current.status}`}>
          <span className="sbx-icon">
            <Icon
              name={current.status === 'available' ? 'check-circle' : 'map-pin'}
              size={28}
            />
          </span>

          <div className="sbx-availability-copy">
            <span className="sbx-eyebrow">SERVICE AVAILABILITY</span>
            <div role="status" aria-live="polite" aria-atomic="true">
              <h2>{headings[current.status]}</h2>
              <p>{descriptions[current.status]}</p>
            </div>
          </div>

          <div className="sbx-availability-actions">
            {locationChosen && current.status === 'available' && (
              <Link className="sbx-button" to="/services">
                Explore Services
                <Icon name="arrow-right" size={17} />
              </Link>
            )}
            {hasGoogleMaps && (
              <div className="sbx-location-control">
                <button
                  type="button"
                  className="sbx-button sbx-button--outline"
                  onClick={() => setLocationPickerOpen(true)}
                  aria-haspopup="dialog"
                >
                  <Icon name="search" size={17} />
                  {locationChosen ? 'Select different location' : 'Select location'}
                </button>

                {locationPickerOpen && (
                  <GoogleLocationPicker
                    open={locationPickerOpen}
                    onClose={() => setLocationPickerOpen(false)}
                    onSelect={(place) => {
                      setAvailabilityRequested(true);
                      setLocation({
                        address: place.address,
                        latitude: place.latitude,
                        longitude: place.longitude,
                      });
                      setLocationPickerOpen(false);
                    }}
                  />
                )}
              </div>
            )}
          </div>

          {(!hasGoogleMaps || current.status === 'unknown') && (
            <form
              className="sbx-city-form"
              onSubmit={(event) => {
                event.preventDefault();
                const name = manualCity.trim();
                if (name) {
                  setAvailabilityRequested(true);
                  setLocation(name);
                }
              }}
            >
              <label htmlFor={inputId}>Your city</label>
              <div>
                <input
                  id={inputId}
                  list={`${inputId}-cities`}
                  value={manualCity}
                  onChange={(event) => setManualCity(event.target.value)}
                  placeholder="Enter your city"
                  required
                  maxLength={80}
                />
                <datalist id={`${inputId}-cities`}>
                  {cities.map((city) => <option key={city} value={city} />)}
                </datalist>
                <button className="sbx-button" type="submit">
                  Check availability
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
