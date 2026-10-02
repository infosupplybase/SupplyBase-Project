import { useEffect, useRef, useState } from 'react';
import Icon from '../ui/Icon';

const GOOGLE_MAPS_API_KEY =
  import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

/**
 * Whether this build has a Google Maps key (VITE_GOOGLE_MAPS_API_KEY).
 * Without one the site keeps its plain city list and typed address instead
 * of showing customers a picker that can only report an error.
 */
export const hasGoogleMaps = Boolean(GOOGLE_MAPS_API_KEY);

const DEFAULT_CENTER = {
  lat: 19.076,
  lng: 72.8777,
};

let googleMapsPromise = null;

/*
 * Load Google Maps JavaScript API
 */
function loadGoogleMaps() {
  if (window.google?.maps) {
    return Promise.resolve(window.google.maps);
  }

  if (!GOOGLE_MAPS_API_KEY) {
    return Promise.reject(
      new Error(
        'VITE_GOOGLE_MAPS_API_KEY is missing from your frontend .env file.'
      )
    );
  }

  if (googleMapsPromise) {
    return googleMapsPromise;
  }

  googleMapsPromise = new Promise((resolve, reject) => {
    const existingScript = document.querySelector(
      'script[data-google-maps="true"]'
    );

    if (existingScript) {
      existingScript.addEventListener('load', () => {
        if (window.google?.maps) {
          resolve(window.google.maps);
        } else {
          reject(
            new Error(
              'Google Maps failed to initialize.'
            )
          );
        }
      });

      existingScript.addEventListener(
        'error',
        () => {
          reject(
            new Error(
              'Google Maps script failed to load.'
            )
          );
        }
      );

      return;
    }

    const script = document.createElement('script');

    script.src =
      `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(
        GOOGLE_MAPS_API_KEY
      )}&v=weekly`;

    script.async = true;
    script.defer = true;
    script.dataset.googleMaps = 'true';

    script.onload = () => {
      if (window.google?.maps) {
        resolve(window.google.maps);
      } else {
        reject(
          new Error(
            'Google Maps failed to initialize.'
          )
        );
      }
    };

    script.onerror = () => {
      reject(
        new Error(
          'Google Maps could not be loaded. Check your API key and API restrictions.'
        )
      );
    };

    document.head.appendChild(script);
  });

  return googleMapsPromise;
}

function geolocationMessage(geoError) {
  if (geoError?.code === 1) {
    return 'Location permission was denied. Please allow location access in your browser.';
  }
  if (geoError?.code === 2) {
    return 'Your current location is temporarily unavailable.';
  }
  if (geoError?.code === 3) {
    return 'Location request timed out. Please try again.';
  }
  return 'Unable to get your current location.';
}

/**
 * The street address, city and pincode at a point, from Google's Geocoder —
 * or null if it cannot say (the key may not have the Geocoding API enabled),
 * in which case callers fall back to the bare coordinates.
 */
async function reverseGeocode(latitude, longitude) {
  try {
    const googleMaps = await loadGoogleMaps();
    const { Geocoder } = await googleMaps.importLibrary('geocoding');
    const { results } = await new Geocoder().geocode({
      location: { lat: latitude, lng: longitude },
    });
    // A plus-code result ("4XQ7+2C Kalyan") is useless to a visiting team.
    const best = (results || []).find((r) => !r.types?.includes('plus_code')) || results?.[0];
    if (!best) return null;

    const part = (type) =>
      best.address_components?.find((c) => c.types.includes(type))?.long_name || '';

    return {
      address: best.formatted_address || '',
      city:
        part('locality') ||
        part('administrative_area_level_3') ||
        part('administrative_area_level_2'),
      pincode: part('postal_code'),
    };
  } catch (err) {
    console.warn('Reverse geocoding failed:', err);
    return null;
  }
}

/**
 * The customer's current location from the browser: { address, latitude,
 * longitude, city, pincode }. The address is a real street address when
 * Google can name the spot, otherwise "Current location (lat, lng)"; city and
 * pincode are '' when unknown. Throws an Error with a customer-facing message
 * when the browser cannot or may not share the location.
 */
export async function getCurrentLocation() {
  if (!navigator.geolocation) {
    throw new Error('Your browser does not support location services.');
  }

  const coords = await new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) => resolve(position.coords),
      (geoError) => reject(new Error(geolocationMessage(geoError))),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 }
    );
  });

  const { latitude, longitude } = coords;
  const place = await reverseGeocode(latitude, longitude);

  return {
    address:
      place?.address ||
      `Current location (${latitude.toFixed(5)}, ${longitude.toFixed(5)})`,
    latitude,
    longitude,
    city: place?.city || '',
    pincode: place?.pincode || '',
  };
}

export default function GoogleLocationPicker({
  open,
  onClose,
  onSelect,
}) {
  const mapRef = useRef(null);
  const searchContainerRef = useRef(null);

  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);

  const autocompleteRef = useRef(null);
  const autocompleteHandlerRef = useRef(null);

  const [mapLoading, setMapLoading] =
    useState(true);

  const [locationLoading, setLocationLoading] =
    useState(false);

  const [error, setError] = useState('');

  const [selectedLocation, setSelectedLocation] =
    useState(null);

  /*
   * Update selected location
   */
  const updateSelectedLocation = (
    latitude,
    longitude,
    address
  ) => {
    if (
      !mapInstanceRef.current ||
      !window.google?.maps
    ) {
      return;
    }

    const googleMaps = window.google.maps;

    const position = {
      lat: latitude,
      lng: longitude,
    };

    /*
     * Remove previous marker
     */
    if (markerRef.current) {
      markerRef.current.setMap(null);
      markerRef.current = null;
    }

    /*
     * Add new marker
     */
    markerRef.current =
      new googleMaps.Marker({
        map: mapInstanceRef.current,
        position,
        title: address,
      });

    /*
     * Move map
     */
    mapInstanceRef.current.panTo(position);
    mapInstanceRef.current.setZoom(16);

    /*
     * Save location
     */
    setSelectedLocation({
      address,
      latitude,
      longitude,
    });

    setError('');
  };

  /*
   * Initialize Google Maps
   */
  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    async function initializeMap() {
      try {
        setMapLoading(true);
        setError('');

        const googleMaps =
          await loadGoogleMaps();

        if (
          cancelled ||
          !mapRef.current
        ) {
          return;
        }

        /*
         * Load Maps library
         */
        const { Map } =
          await googleMaps.importLibrary(
            'maps'
          );

        if (
          cancelled ||
          !mapRef.current
        ) {
          return;
        }

        /*
         * Create map
         */
        if (!mapInstanceRef.current) {
          const map = new Map(
            mapRef.current,
            {
              center: DEFAULT_CENTER,
              zoom: 11,

              mapTypeControl: false,
              streetViewControl: false,
              fullscreenControl: false,

              clickableIcons: true,
              gestureHandling: 'greedy',

              zoomControl: true,
            }
          );

          mapInstanceRef.current = map;

          /*
           * Allow user to select
           * directly from map
           */
          map.addListener(
            'click',
            (event) => {
              if (!event.latLng) {
                return;
              }

              const latitude =
                event.latLng.lat();

              const longitude =
                event.latLng.lng();

              updateSelectedLocation(
                latitude,
                longitude,
                `Selected location (${latitude.toFixed(
                  5
                )}, ${longitude.toFixed(5)})`
              );
            }
          );
        }

        /*
         * Load Places API (New)
         */
        const {
          PlaceAutocompleteElement,
        } =
          await googleMaps.importLibrary(
            'places'
          );

        /*
         * Create autocomplete
         */
        if (
          searchContainerRef.current &&
          !autocompleteRef.current
        ) {
          const autocomplete =
            new PlaceAutocompleteElement();

          /*
           * Placeholder
           */
          autocomplete.placeholder =
            'Search for area, street, landmark...';

          /*
           * Restrict to India
           */
          autocomplete.includedRegionCodes =
            ['in'];

          /*
           * Hide Google's search icon
           */
          autocomplete.noInputIcon = true;

          /*
           * Full width
           */
          autocomplete.style.width =
            '100%';

          autocomplete.style.display =
            'block';

          /*
           * Clear old contents
           */
          searchContainerRef.current.innerHTML =
            '';

          /*
           * Add autocomplete
           */
          searchContainerRef.current.appendChild(
            autocomplete
          );

          autocompleteRef.current =
            autocomplete;

          /*
           * Handle place selection
           */
          const handlePlaceSelect =
            async (event) => {
              try {
                setError('');

                const placePrediction =
                  event.placePrediction;

                if (!placePrediction) {
                  return;
                }

                /*
                 * Convert prediction
                 * to Place object
                 */
                const place =
                  placePrediction.toPlace();

                /*
                 * Fetch required fields
                 */
                await place.fetchFields({
                  fields: [
                    'displayName',
                    'formattedAddress',
                    'location',
                  ],
                });

                if (!place.location) {
                  setError(
                    'The selected place does not have a location.'
                  );
                  return;
                }

                /*
                 * Latitude
                 */
                const latitude =
                  typeof place.location
                    .lat === 'function'
                    ? place.location.lat()
                    : place.location.lat;

                /*
                 * Longitude
                 */
                const longitude =
                  typeof place.location
                    .lng === 'function'
                    ? place.location.lng()
                    : place.location.lng;

                /*
                 * Address
                 */
                const address =
                  place.formattedAddress ||
                  place.displayName ||
                  `Selected location (${latitude.toFixed(
                    5
                  )}, ${longitude.toFixed(5)})`;

                /*
                 * Update map
                 */
                updateSelectedLocation(
                  latitude,
                  longitude,
                  address
                );
              } catch (err) {
                console.error(
                  'Google place selection error:',
                  err
                );

                setError(
                  'Could not select this location. Please try again.'
                );
              }
            };

          autocomplete.addEventListener(
            'gmp-select',
            handlePlaceSelect
          );

          autocompleteHandlerRef.current =
            handlePlaceSelect;
        }

        setMapLoading(false);
      } catch (err) {
        console.error(
          'Google Maps initialization error:',
          err
        );

        if (!cancelled) {
          setMapLoading(false);

          setError(
            err.message ||
              'Unable to load Google Maps.'
          );
        }
      }
    }

    initializeMap();

    return () => {
      cancelled = true;
    };
  }, [open]);

  /*
   * Escape key + body scroll
   */
  useEffect(() => {
    if (!open) return;

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener(
      'keydown',
      handleEscape
    );

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow =
      'hidden';

    return () => {
      document.removeEventListener(
        'keydown',
        handleEscape
      );

      document.body.style.overflow =
        previousOverflow;
    };
  }, [open, onClose]);

  /*
   * Use current browser location, named by Google's Geocoder when it can
   * (see getCurrentLocation).
   */
  const handleUseCurrentLocation = async () => {
    setLocationLoading(true);
    setError('');

    try {
      const here = await getCurrentLocation();

      updateSelectedLocation(
        here.latitude,
        here.longitude,
        here.address
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setLocationLoading(false);
    }
  };

  /*
   * Clear search
   */
  const handleClearSearch = () => {
    const autocomplete =
      autocompleteRef.current;

    if (!autocomplete) {
      return;
    }

    /*
     * Clear Google's autocomplete value
     */
    try {
      autocomplete.value = '';
    } catch {
      /* ignore */
    }

    /*
     * Also try to clear the internal input
     * if it is available.
     */
    const input =
      autocomplete.shadowRoot?.querySelector(
        'input'
      );

    if (input) {
      input.value = '';
      input.focus();
    }

    /*
     * Focus autocomplete
     */
    try {
      autocomplete.focus();
    } catch {
      /* ignore */
    }

    setError('');
  };

  /*
   * Confirm selected location
   */
  const handleConfirm = () => {
    if (!selectedLocation) {
      setError(
        'Please search for or select a location first.'
      );
      return;
    }

    onSelect({
      address:
        selectedLocation.address,

      latitude:
        selectedLocation.latitude,

      longitude:
        selectedLocation.longitude,
    });

    onClose();
  };

  /*
   * Reset when modal closes
   */
  useEffect(() => {
    if (!open) {
      setError('');
      setSelectedLocation(null);
      setLocationLoading(false);

      /*
       * Remove marker
       */
      if (markerRef.current) {
        markerRef.current.setMap(null);
        markerRef.current = null;
      }

      /*
       * Remove autocomplete
       */
      if (autocompleteRef.current) {
        if (
          autocompleteHandlerRef.current
        ) {
          autocompleteRef.current.removeEventListener(
            'gmp-select',
            autocompleteHandlerRef.current
          );
        }

        autocompleteRef.current.remove();

        autocompleteRef.current =
          null;

        autocompleteHandlerRef.current =
          null;
      }

      /*
       * Clear search container
       */
      if (searchContainerRef.current) {
        searchContainerRef.current.innerHTML =
          '';
      }

      /*
       * Allow map to be recreated
       */
      mapInstanceRef.current = null;
    }
  }, [open]);

  if (!open) {
    return null;
  }

  return (
    <div className="google-location-overlay">
      <div
        className="google-location-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="google-location-title"
      >
        {/* HEADER */}
        <div className="google-location-header">
          <div>
            <span className="google-location-brand">
              SUPPLYBASE
            </span>

            <h2 id="google-location-title">
              SELECT YOUR LOCATION
            </h2>

            <p>
              Search for your area or use
              your current location.
            </p>
          </div>

          <button
            type="button"
            className="google-location-close"
            onClick={onClose}
            aria-label="Close location picker"
          >
            <Icon
              name="x"
              size={22}
            />
          </button>
        </div>

        {/* SEARCH */}
        <div className="google-location-search">
          <Icon
            name="search"
            size={22}
          />

          <div className="google-location-autocomplete-wrapper">
            <div
              ref={searchContainerRef}
              className="google-location-autocomplete"
            />

            <button
              type="button"
              className="google-location-search-clear"
              onClick={
                handleClearSearch
              }
              aria-label="Clear search"
            >
              <Icon
                name="x"
                size={16}
              />
            </button>
          </div>
        </div>

        {/* CURRENT LOCATION */}
        <button
          type="button"
          className="google-current-location"
          onClick={
            handleUseCurrentLocation
          }
          disabled={locationLoading}
        >
          <Icon
            name="map-pin"
            size={18}
          />

          <span>
            {locationLoading
              ? 'Getting your location...'
              : 'Use my current location'}
          </span>
        </button>

        {/* MAP */}
        <div className="google-location-map-wrapper">
          <div
            ref={mapRef}
            className="google-location-map"
          />

          {mapLoading && (
            <div className="google-location-map-loading">
              Loading map...
            </div>
          )}
        </div>

        {/* ERROR */}
        {error && (
          <div className="google-location-error">
            {error}
          </div>
        )}

        {/* SELECTED LOCATION */}
        {selectedLocation && (
          <div className="google-selected-location">
            <div className="google-selected-icon">
              <Icon
                name="map-pin"
                size={18}
              />
            </div>

            <div>
              <strong>
                Selected location
              </strong>

              <p>
                {selectedLocation.address}
              </p>
            </div>
          </div>
        )}

        {/* FOOTER */}
        <div className="google-location-footer">
          <button
            type="button"
            className="google-location-cancel"
            onClick={onClose}
          >
            CANCEL
          </button>

          <button
            type="button"
            className="google-location-confirm"
            onClick={handleConfirm}
            disabled={!selectedLocation}
          >
            CONFIRM LOCATION
          </button>
        </div>
      </div>
    </div>
  );
}