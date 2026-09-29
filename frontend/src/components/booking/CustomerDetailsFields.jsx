import { useState } from 'react';
import Icon from '../ui/Icon';
import GoogleLocationPicker, { getCurrentLocation, hasGoogleMaps } from '../layout/GoogleLocationPicker';
import { useLocationContext, usePickedLocation } from '../../context/LocationContext';

export function Field({ id, label, required, hint, error, ...rest }) {
  return (
    <div className={`field ${error ? 'error' : ''}`}>
      <label htmlFor={id}>
        {label} {required && <span className="req">*</span>}
      </label>

      <input id={id} {...rest} />

      {error ? (
        <span className="field-error">{error}</span>
      ) : (
        hint && <span className="field-hint">{hint}</span>
      )}
    </div>
  );
}

/**
 * The visit address. With a Google Maps key the customer can pin the
 * location on a map, or tap "Use my current location" below it (which also
 * fills an empty City and Pincode when Google can name the spot); once
 * pinned we ask the building, room and floor, and the typed box becomes
 * optional directions. Without a key — or if the map cannot be used — the
 * typed address is the address, as before. Validation and the address sent
 * with the booking come from validateDetails / composeAddress
 * (lib/bookingDetails).
 */
export function AddressFields({ details, setDetail, errors, idPrefix = 'bk' }) {
  const { setLocation } = useLocationContext();
  const pickedLocation = usePickedLocation();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locateError, setLocateError] = useState('');

  const locateMe = async () => {
    setLocating(true);
    setLocateError('');
    try {
      const here = await getCurrentLocation();
      setLocation({ address: here.address, latitude: here.latitude, longitude: here.longitude });
      // Only fill what the customer has not typed themselves.
      const fill = (key, value) => {
        if (value && !String(details[key] || '').trim()) setDetail(key)({ target: { value } });
      };
      fill('city', here.city);
      fill('pincode', here.pincode);
    } catch (err) {
      setLocateError(err.message || 'Unable to get your current location.');
    } finally {
      setLocating(false);
    }
  };

  return (
    <>
      {hasGoogleMaps && (
        <div className="field booking-address-field" style={{ marginTop: 16 }}>
          <div className="booking-address-label-row">
            <label>
              Project Location <span className="req">*</span>
            </label>

            {pickedLocation && (
              <button
                type="button"
                className="booking-use-location"
                onClick={() => setPickerOpen(true)}
              >
                <Icon name="map-pin" size={14} />
                Change on map
              </button>
            )}
          </div>

          {pickedLocation ? (
            <div className="booking-selected-location">
              <Icon name="map-pin" size={15} />
              <div className="booking-location-text">
                <span className="booking-location-label">Selected location</span>
                <span className="booking-location-address">{pickedLocation.address}</span>
              </div>
            </div>
          ) : (
            <button
              type="button"
              className="booking-location-empty"
              onClick={() => setPickerOpen(true)}
            >
              <Icon name="map-pin" size={15} />
              Select your location on the map
            </button>
          )}

          <button
            type="button"
            className="booking-current-location"
            onClick={locateMe}
            disabled={locating}
            aria-busy={locating}
          >
            <Icon name="locate" size={17} className={locating ? 'spin-slow' : ''} />
            {locating ? 'Finding your location…' : 'Use my current location'}
          </button>
          {locateError && (
            <span className="field-error booking-current-location-error" role="alert">
              {locateError}
            </span>
          )}

          {pickedLocation && (
            <div className="booking-address-inputs">
              <div className="field booking-building-field">
                <label htmlFor={`${idPrefix}-building`}>
                  Building Name <span className="req">*</span>
                </label>
                <input
                  id={`${idPrefix}-building`}
                  type="text"
                  value={details.buildingName || ''}
                  onChange={setDetail('buildingName')}
                  placeholder="Enter building name"
                />
                {errors.buildingName && (
                  <span className="field-error">{errors.buildingName}</span>
                )}
              </div>

              <div className="booking-small-fields">
                <div className="field">
                  <label htmlFor={`${idPrefix}-room`}>Room No.</label>
                  <input
                    id={`${idPrefix}-room`}
                    type="text"
                    value={details.roomNo || ''}
                    onChange={setDetail('roomNo')}
                    placeholder="Room no."
                  />
                </div>

                <div className="field">
                  <label htmlFor={`${idPrefix}-floor`}>Floor</label>
                  <input
                    id={`${idPrefix}-floor`}
                    type="text"
                    value={details.floorNo || ''}
                    onChange={setDetail('floorNo')}
                    placeholder="Floor"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="field" style={{ marginTop: 16 }}>
        <label htmlFor={`${idPrefix}-address`}>
          {pickedLocation ? 'Address details (optional)' : 'Project Address'}
          {!pickedLocation && (
            <>
              {' '}
              <span className="req">*</span>
            </>
          )}
        </label>
        <textarea
          id={`${idPrefix}-address`}
          rows={3}
          value={details.address || ''}
          onChange={setDetail('address')}
          placeholder={
            pickedLocation
              ? 'Landmark or directions for our team'
              : hasGoogleMaps
                ? 'Or type your complete address'
                : 'Enter complete address'
          }
        />
        {errors.address && <span className="field-error">{errors.address}</span>}
      </div>

      {hasGoogleMaps && (
        <GoogleLocationPicker
          open={pickerOpen}
          onClose={() => setPickerOpen(false)}
          onSelect={(selectedLocation) => {
            setLocation(selectedLocation);
            setPickerOpen(false);
          }}
        />
      )}
    </>
  );
}

/** The name/phone/whatsapp/email/address/city/pincode fields every booking
    flow asks — one copy of the markup, so every service shows the same
    form. Values default to '' because a form restored from history (see
    useHistoryState) may predate a field. */
export default function CustomerDetailsFields({ details, setDetail, errors, idPrefix = 'bk' }) {
  const value = (key) => details[key] || '';

  return (
    <>
      <div className="form-grid">
        <Field id={`${idPrefix}-name`} label="Full Name" required value={value('name')}
               onChange={setDetail('name')} error={errors.name}
               placeholder="Enter your name" autoComplete="name" />
        <Field id={`${idPrefix}-phone`} label="Mobile Number" required type="tel"
               inputMode="numeric" value={value('phone')}
               onChange={setDetail('phone')} error={errors.phone}
               placeholder="Enter mobile number" autoComplete="tel" />
        <Field id={`${idPrefix}-whatsapp`} label="WhatsApp Number (Optional)" type="tel"
               inputMode="numeric" value={value('whatsapp')}
               onChange={setDetail('whatsapp')} error={errors.whatsapp}
               placeholder="Enter WhatsApp number"
               hint="Leave blank if it is the same as your mobile." />
        <Field id={`${idPrefix}-email`} label="Email Address (Optional)" type="email"
               value={value('email')} onChange={setDetail('email')}
               error={errors.email} placeholder="Enter email address" autoComplete="email" />
      </div>

      <AddressFields details={details} setDetail={setDetail} errors={errors} idPrefix={idPrefix} />

      {/* CITY + PINCODE */}
      <div className="form-grid" style={{ marginTop: 16 }}>
        <Field id={`${idPrefix}-city`} label="City" required value={value('city')}
               onChange={setDetail('city')} error={errors.city}
               placeholder="Mumbai" autoComplete="address-level2" />
        <Field id={`${idPrefix}-pincode`} label="Pincode" required value={value('pincode')}
               inputMode="numeric" onChange={setDetail('pincode')} error={errors.pincode}
               placeholder="400001" autoComplete="postal-code" />
      </div>

      <GoogleLocationPicker
        open={locationPickerOpen}
        onClose={() => setLocationPickerOpen(false)}
        onSelect={handleLocationSelect}
      />
    </>
  );
}