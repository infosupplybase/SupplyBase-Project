import { createContext, useContext, useEffect, useState } from 'react';
import { contact } from '../data/siteConfig';

const STORAGE_KEY = 'sb.location';

const LocationContext = createContext(null);

/**
 * The customer's selected service area — real state, not a hard-coded
 * "Bangalore". There is no backend service-area API yet, so the choices
 * offered are the company's own published service areas
 * (siteConfig.contact.serviceAreas); the pick persists to localStorage so it
 * survives a reload.
 */
export function LocationProvider({ children }) {
  const [location, setLocationState] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) || contact.serviceAreas[0];
    } catch {
      return contact.serviceAreas[0];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, location);
    } catch {
      /* private browsing or storage disabled — the pick still works for this session */
    }
  }, [location]);

  const setLocation = (next) => {
    if (contact.serviceAreas.includes(next)) setLocationState(next);
  };

  return (
    <LocationContext.Provider value={{ location, setLocation, serviceAreas: contact.serviceAreas }}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocationContext() {
  const ctx = useContext(LocationContext);
  if (!ctx) throw new Error('useLocationContext must be used inside <LocationProvider>');
  return ctx;
}
