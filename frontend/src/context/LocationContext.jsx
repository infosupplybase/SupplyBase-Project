import { createContext, useContext, useEffect, useState } from 'react';
import { contact } from '../data/siteConfig';

const STORAGE_KEY = 'sb.location';

const LocationContext = createContext(null);

const DEFAULT_LOCATION = {
  address: contact.serviceAreas[0] || 'Mumbai',
  latitude: null,
  longitude: null,
};

function readStoredLocation() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (!saved) {
      return DEFAULT_LOCATION;
    }

    // New location format
    if (saved.startsWith('{')) {
      const parsed = JSON.parse(saved);

      return {
        address: parsed.address || DEFAULT_LOCATION.address,
        latitude: parsed.latitude ?? null,
        longitude: parsed.longitude ?? null,
      };
    }

    // Backward compatibility with your old localStorage string
    return {
      address: saved,
      latitude: null,
      longitude: null,
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
      });

      return;
    }

    // Keep compatibility with your old service-area dropdown
    if (typeof next === 'string') {
      setLocationData({
        address: next,
        latitude: null,
        longitude: null,
      });
    }
  };

  return (
    <LocationContext.Provider
      value={{
        location: locationData.address,

        // A short service-area name for forms that need a city.
        city: cityFor(locationData.address),

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