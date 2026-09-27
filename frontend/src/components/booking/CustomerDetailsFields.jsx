import { useEffect, useState } from 'react';
import Icon from '../ui/Icon';
import { useLocationContext } from '../../context/LocationContext';
import GoogleLocationPicker from '../layout/GoogleLocationPicker';

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

export default function CustomerDetailsFields({
  details,
  setDetail,
  errors,
  idPrefix = 'bk',
}) {
  const { locationData } = useLocationContext();

  const [locationPickerOpen, setLocationPickerOpen] = useState(false);

  const [buildingName, setBuildingName] = useState(
    details.buildingName || ''
  );

  const [roomNo, setRoomNo] = useState(details.roomNo || '');

  const [floor, setFloor] = useState(details.floor || '');

  /*
   * Keep the individual address fields inside the parent's booking state.
   */
  useEffect(() => {
    setDetail('buildingName')({
      target: { value: buildingName },
    });

    setDetail('roomNo')({
      target: { value: roomNo },
    });

    setDetail('floor')({
      target: { value: floor },
    });
  }, [buildingName, roomNo, floor]);

  /*
   * Build the final address that the existing API already expects.
   *
   * Example:
   * ABC Heights, Room 402, Floor 4, Kalyan, Maharashtra, India
   */
  useEffect(() => {
    const locationAddress = locationData?.address || '';

    const addressParts = [
      buildingName.trim(),
      roomNo.trim() ? `Room ${roomNo.trim()}` : '',
      floor.trim() ? `Floor ${floor.trim()}` : '',
      locationAddress,
    ].filter(Boolean);

    const finalAddress = addressParts.join(', ');

    setDetail('address')({
      target: { value: finalAddress },
    });
  }, [buildingName, roomNo, floor, locationData?.address]);

  const handleLocationSelect = (selectedLocation) => {
    setLocationPickerOpen(false);

    /*
     * The location itself is stored globally by LocationContext.
     * The effect above then rebuilds details.address automatically.
     */
  };

  return (
    <>
      <div className="form-grid">
        <Field
          id={`${idPrefix}-name`}
          label="Full Name"
          required
          value={details.name}
          onChange={setDetail('name')}
          error={errors.name}
          placeholder="Enter your name"
        />

        <Field
          id={`${idPrefix}-phone`}
          label="Mobile Number"
          required
          type="tel"
          inputMode="numeric"
          value={details.phone}
          onChange={setDetail('phone')}
          error={errors.phone}
          placeholder="Enter mobile number"
        />

        <Field
          id={`${idPrefix}-whatsapp`}
          label="WhatsApp Number (Optional)"
          type="tel"
          inputMode="numeric"
          value={details.whatsapp}
          onChange={setDetail('whatsapp')}
          error={errors.whatsapp}
          placeholder="Enter WhatsApp number"
          hint="Leave blank if it is the same as your mobile."
        />

        <Field
          id={`${idPrefix}-email`}
          label="Email Address (Optional)"
          type="email"
          value={details.email}
          onChange={setDetail('email')}
          error={errors.email}
          placeholder="Enter email address"
        />
      </div>

      {/* PROJECT ADDRESS */}
      <div
        className="field booking-address-field"
        style={{ marginTop: 16 }}
      >
        <div className="booking-address-label-row">
          <label>
            Project Address <span className="req">*</span>
          </label>

          <button
            type="button"
            className="booking-use-location"
            onClick={() => setLocationPickerOpen(true)}
          >
            <Icon name="map-pin" size={14} />

            {locationData?.address
              ? 'Change location'
              : 'Use current location'}
          </button>
        </div>

        {locationData?.address && (
          <div className="booking-selected-location">
            <Icon name="map-pin" size={15} />

            <div>
              <span className="booking-location-label">
                Selected location
              </span>

              <span className="booking-location-address">
                {locationData.address}
              </span>
            </div>
          </div>
        )}

        {/* BUILDING NAME */}
        <div className="booking-address-inputs">
          <div className="booking-building-field">
            <label htmlFor={`${idPrefix}-building`}>
              Building Name <span className="req">*</span>
            </label>

            <input
              id={`${idPrefix}-building`}
              type="text"
              value={buildingName}
              onChange={(e) => setBuildingName(e.target.value)}
              placeholder="Enter building name"
            />
          </div>

          {/* ROOM + FLOOR */}
          <div className="booking-small-fields">
            <div>
              <label htmlFor={`${idPrefix}-room`}>
                Room No.
              </label>

              <input
                id={`${idPrefix}-room`}
                type="text"
                value={roomNo}
                onChange={(e) => setRoomNo(e.target.value)}
                placeholder="Room no."
              />
            </div>

            <div>
              <label htmlFor={`${idPrefix}-floor`}>
                Floor
              </label>

              <input
                id={`${idPrefix}-floor`}
                type="text"
                value={floor}
                onChange={(e) => setFloor(e.target.value)}
                placeholder="Floor"
              />
            </div>
          </div>
        </div>

        {errors.address && (
          <span className="field-error">
            {errors.address}
          </span>
        )}
      </div>

      {/* CITY + PINCODE */}
      <div className="form-grid" style={{ marginTop: 16 }}>
        <Field
          id={`${idPrefix}-city`}
          label="City"
          required
          value={details.city}
          onChange={setDetail('city')}
          error={errors.city}
          placeholder="Mumbai"
        />

        <Field
          id={`${idPrefix}-pincode`}
          label="Pincode"
          value={details.pincode}
          onChange={setDetail('pincode')}
          error={errors.pincode}
          placeholder="400001"
        />
      </div>

      <GoogleLocationPicker
        open={locationPickerOpen}
        onClose={() => setLocationPickerOpen(false)}
        onSelect={handleLocationSelect}
      />
    </>
  );
}