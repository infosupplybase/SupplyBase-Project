import { createContext, useContext, useEffect, useState } from 'react';
import { contact } from '../data/siteConfig';
import { hasGoogleMaps } from '../components/layout/GoogleLocationPicker';

const STORAGE_KEY = 'sb.location';

const LocationContext = createContext(null);

const DEFAULT_LOCATION = {
  address: contact.serviceAreas[0] || 'Mumbai',
  latitude: null,
  longitude: null,
  // false until the customer picks a location themselves, so the header can
  // invite them to set one instead of presenting the default as theirs.
  chosen: false,
};

/** Locations saved before `chosen` existed: anything but the default counts. */
function wasChosen(address, latitude) {
  return latitude != null || Boolean(address && address !== DEFAULT_LOCATION.address);
}

/**
 * A short label for the header: the first part of an address ("Lodha Palava
 * City, Dombivli, ..." -> "Lodha Palava City"), with friendlier words for the
 * picker's GPS / map-pin fallbacks, which read "Current location (19.2, 73.1)".
 */
function shortNameFor(address) {
  const text = String(address || '').trim();
  if (/^current location\b/i.test(text)) return 'Current location';
  if (/^selected location\b/i.test(text)) return 'Pinned location';
  return text.split(',')[0].trim() || DEFAULT_LOCATION.address;
}

function readStoredLocation() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (!saved) {
      return DEFAULT_LOCATION;
    }

    // New location format
    if (saved.startsWith('{')) {
      const parsed = JSON.parse(saved);
      const address = parsed.address || DEFAULT_LOCATION.address;
      const latitude = parsed.latitude ?? null;

      return {
        address,
        latitude,
        longitude: parsed.longitude ?? null,
        label: parsed.label || '',
        chosen: parsed.chosen ?? wasChosen(address, latitude),
      };
    }

    // Backward compatibility with your old localStorage string
    return {
      address: saved,
      latitude: null,
      longitude: null,
      chosen: wasChosen(saved, null),
    };
  } catch {
    return DEFAULT_LOCATION;
  }
}

/**
 * The service area for a location: the one named in it (longest name first,
 * so "Navi Mumbai" wins over "Mumbai"), else the first published area. A map
 * pick can be a full address or bare coordinates, but bookings need a short
 * city (the API allows 80 characters).
 */
function cityFor(address) {
  const text = String(address || '').toLowerCase();
  const byLength = [...contact.serviceAreas].sort((a, b) => b.length - a.length);
  return byLength.find((area) => text.includes(area.toLowerCase())) || contact.serviceAreas[0];
}

export function LocationProvider({ children }) {
  const [locationData, setLocationData] = useState(readStoredLocation);

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(locationData)
      );
    } catch {
      // Storage disabled/private browsing.
    }
  }, [locationData]);

  const setLocation = (next) => {
    // Google location object
    if (typeof next === 'object' && next !== null) {
      setLocationData({
        address: next.address || DEFAULT_LOCATION.address,
        latitude: next.latitude ?? null,
        longitude: next.longitude ?? null,
        // A saved address's own name ("Home"), shown in the header.
        label: next.label || '',
        chosen: true,
      });

      return;
    }

    // Keep compatibility with your old service-area dropdown
    if (typeof next === 'string') {
      setLocationData({
        address: next,
        latitude: null,
        longitude: null,
        chosen: true,
      });
    }
  };

  return (
    <LocationContext.Provider
      value={{
        location: locationData.address,

        // A short service-area name for forms that need a city.
        city: cityFor(locationData.address),

        // For the header: a short place name, and whether the customer set
        // it themselves (until then it is only the default service area).
        shortLocation: locationData.label || shortNameFor(locationData.address),
        locationChosen: Boolean(locationData.chosen),

        latitude: locationData.latitude,
        longitude: locationData.longitude,

        locationData,

        setLocation,

        serviceAreas: contact.serviceAreas,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
}

export function useLocationContext() {
  const ctx = useContext(LocationContext);

  if (!ctx) {
    throw new Error(
      'useLocationContext must be used inside <LocationProvider>'
    );
  }

  return ctx;
}

/**
 * The visit location the customer pinned on the map, or null. Only a real
 * pin counts (it has coordinates) — the header's plain city name is not an
 * address — and only when this build has a Google Maps key.
 */
export function usePickedLocation() {
  const { locationData } = useLocationContext();

  return hasGoogleMaps &&
    locationData?.latitude != null &&
    locationData?.longitude != null
    ? locationData
    : null;
}
