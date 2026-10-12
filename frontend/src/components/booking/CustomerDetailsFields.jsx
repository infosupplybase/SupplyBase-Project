import { hasGoogleMaps } from '../layout/GoogleLocationPicker';
import SavedAddressPicker from './SavedAddressPicker';
import {
  useLocationContext,
  usePickedLocation,
} from '../../context/LocationContext';
import { MAX_LENGTH } from '../../lib/bookingDetails';

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
 * The visit address.
 *
 * With a Google Maps key the customer picks the location (search, current
 * location or a tap on the map), checks what it resolved to, labels it and
 * adds it to their saved addresses (SavedAddressPicker), then gives the
 * building name, room and floor. There is no typed address box then.
 *
 * Without Google Maps the customer types the address.
 */
export function AddressFields({
  details,
  setDetail,
  errors,
  idPrefix = 'bk',
}) {
  const { setLocation } = useLocationContext();
  const pickedLocation = usePickedLocation();

  const useAddress = (place) => {
    setLocation({
      address: place.address,
      latitude: place.latitude,
      longitude: place.longitude,
      label: place.label,
    });

    // City and pincode follow the chosen address. When it has none, the old
    // value is cleared rather than kept, so a Kharghar address never goes out
    // with the pincode of the Bandra one picked before it.
    const fill = (key, value) => {
      const next = value || '';
      if (next !== (details[key] || '')) {
        setDetail(key)({ target: { value: next } });
      }
    };

    fill('city', place.city);
    fill('pincode', place.pincode);
  };

  return (
    <>
      {/* =====================================================
          GOOGLE MAP LOCATION
          ===================================================== */}

      {hasGoogleMaps && (
        <div
          className="field booking-address-field"
          style={{ marginTop: 16 }}
        >
          <div className="booking-address-label-row">
            <label>
              Project Location <span className="req">*</span>
            </label>
          </div>

          <SavedAddressPicker
            selected={pickedLocation}
            onUse={useAddress}
            idPrefix={idPrefix}
          />

          {errors.address && (
            <span className="field-error">
              {errors.address}
            </span>
          )}

          {/* Building / Room / Floor */}
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
                maxLength={MAX_LENGTH.buildingName}
                placeholder="Enter building name"
              />

              {errors.buildingName && (
                <span className="field-error">
                  {errors.buildingName}
                </span>
              )}
            </div>

            <div className="booking-small-fields">
              {/* Room */}
              <div className="field">
                <label htmlFor={`${idPrefix}-room`}>
                  Room No. <span className="req">*</span>
                </label>

                <input
                  id={`${idPrefix}-room`}
                  type="text"
                  value={details.roomNo || ''}
                  onChange={setDetail('roomNo')}
                  maxLength={MAX_LENGTH.roomNo}
                  placeholder="Enter room no."
                />

                {errors.roomNo && (
                  <span className="field-error">
                    {errors.roomNo}
                  </span>
                )}
              </div>

              {/* Floor */}
              <div className="field">
                <label htmlFor={`${idPrefix}-floor`}>
                  Floor <span className="req">*</span>
                </label>

                <input
                  id={`${idPrefix}-floor`}
                  type="text"
                  value={details.floorNo || ''}
                  onChange={setDetail('floorNo')}
                  maxLength={MAX_LENGTH.floorNo}
                  placeholder="Enter floor"
                />

                {errors.floorNo && (
                  <span className="field-error">
                    {errors.floorNo}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Without Google Maps the address is typed. */}
      {!hasGoogleMaps && (
        <div
          className="field"
          style={{ marginTop: 16 }}
        >
          <label htmlFor={`${idPrefix}-address`}>
            Project Address <span className="req">*</span>
          </label>

          <textarea
            id={`${idPrefix}-address`}
            rows={3}
            value={details.address || ''}
            onChange={setDetail('address')}
            maxLength={MAX_LENGTH.address}
            placeholder="Enter complete address"
          />

          {errors.address && (
            <span className="field-error">
              {errors.address}
            </span>
          )}
        </div>
      )}
    </>
  );
}

/**
 * Customer details fields used by every booking flow: full name, mobile,
 * email, the visit address (AddressFields), city and pincode.
 */
export default function CustomerDetailsFields({
  details,
  setDetail,
  errors,
  idPrefix = 'bk',
}) {
  const value = (key) => details[key] || '';

  return (
    <>
      {/* =====================================================
          CUSTOMER DETAILS
          ===================================================== */}

      <div className="form-grid">
        {/* Full Name */}
        <Field
          id={`${idPrefix}-name`}
          label="Full Name"
          required
          value={value('name')}
          onChange={setDetail('name')}
          maxLength={MAX_LENGTH.name}
          error={errors.name}
          placeholder="Enter your name"
          autoComplete="name"
        />

        {/* Mobile */}
        <Field
          id={`${idPrefix}-phone`}
          label="Mobile Number"
          required
          type="tel"
          inputMode="numeric"
          value={value('phone')}
          onChange={setDetail('phone')}
          error={errors.phone}
          placeholder="Enter mobile number"
          autoComplete="tel"
        />

        {/* Email, full width */}
        <div className={`field full-width ${errors.email ? 'error' : ''}`}>
          <label htmlFor={`${idPrefix}-email`}>Email Address (Optional)</label>
          <input
            id={`${idPrefix}-email`}
            type="email"
            value={value('email')}
            onChange={setDetail('email')}
            maxLength={MAX_LENGTH.email}
            placeholder="Enter email address"
            autoComplete="email"
          />
          {errors.email && <span className="field-error">{errors.email}</span>}
        </div>
      </div>

      {/* =====================================================
          ADDRESS
          ===================================================== */}

      <AddressFields
        details={details}
        setDetail={setDetail}
        errors={errors}
        idPrefix={idPrefix}
      />

      {/* =====================================================
          CITY / PINCODE
          ===================================================== */}

      <div
        className="form-grid"
        style={{ marginTop: 16 }}
      >
        {/* City */}
        <Field
          id={`${idPrefix}-city`}
          label="City"
          required
          value={value('city')}
          onChange={setDetail('city')}
          maxLength={MAX_LENGTH.city}
          error={errors.city}
          placeholder="Mumbai"
          autoComplete="address-level2"
        />

        {/* Pincode */}
        <Field
          id={`${idPrefix}-pincode`}
          label="Pincode"
          required
          value={value('pincode')}
          inputMode="numeric"
          onChange={setDetail('pincode')}
          error={errors.pincode}
          placeholder="400001"
          autoComplete="postal-code"
        />
      </div>
    </>
  );
}
