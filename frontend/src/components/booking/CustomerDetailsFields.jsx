import { useEffect, useState } from 'react';
import Icon from '../ui/Icon';
import GoogleLocationPicker, {
  getCurrentLocation,
  hasGoogleMaps,
} from '../layout/GoogleLocationPicker';
import {
  useLocationContext,
  usePickedLocation,
} from '../../context/LocationContext';

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
 * With a Google Maps key the customer can:
 * - Pin the project location on a map
 * - Use their current location
 *
 * Once a location is selected:
 * - Building name is requested
 * - Room number is optional
 * - Floor is optional
 *
 * Without Google Maps:
 * - Customer can enter the address manually.
 */
export function AddressFields({
  details,
  setDetail,
  errors,
  idPrefix = 'bk',
}) {
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

      setLocation({
        address: here.address,
        latitude: here.latitude,
        longitude: here.longitude,
      });

      // Only fill values that the customer has not already entered.
      const fill = (key, value) => {
        if (
          value &&
          !String(details[key] || '').trim()
        ) {
          setDetail(key)({
            target: {
              value,
            },
          });
        }
      };

      fill('city', here.city);
      fill('pincode', here.pincode);
    } catch (err) {
      setLocateError(
        err.message || 'Unable to get your current location.'
      );
    } finally {
      setLocating(false);
    }
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

          {/* Selected location */}
          {pickedLocation ? (
            <div className="booking-selected-location">
              <Icon name="map-pin" size={15} />

              <div className="booking-location-text">
                <span className="booking-location-label">
                  Selected location
                </span>

                <span className="booking-location-address">
                  {pickedLocation.address}
                </span>
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

          {/* Current location */}
          <button
            type="button"
            className="booking-current-location"
            onClick={locateMe}
            disabled={locating}
            aria-busy={locating}
          >
            <Icon
              name="locate"
              size={17}
              className={locating ? 'spin-slow' : ''}
            />

            {locating
              ? 'Finding your location…'
              : 'Use my current location'}
          </button>

          {/* Location error */}
          {locateError && (
            <span
              className="field-error booking-current-location-error"
              role="alert"
            >
              {locateError}
            </span>
          )}

          {/* Building / Room / Floor */}
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
                  <span className="field-error">
                    {errors.buildingName}
                  </span>
                )}
              </div>

              <div className="booking-small-fields">
                {/* Room */}
                <div className="field">
                  <label htmlFor={`${idPrefix}-room`}>
                    Room No.
                  </label>

                  <input
                    id={`${idPrefix}-room`}
                    type="text"
                    value={details.roomNo || ''}
                    onChange={setDetail('roomNo')}
                    placeholder="Room no."
                  />
                </div>

                {/* Floor */}
                <div className="field">
                  <label htmlFor={`${idPrefix}-floor`}>
                    Floor
                  </label>

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

      {/* =====================================================
          PROJECT ADDRESS
          ===================================================== */}

      <div
        className="field"
        style={{ marginTop: 16 }}
      >
        <label htmlFor={`${idPrefix}-address`}>
          {pickedLocation
            ? 'Address details (optional)'
            : 'Project Address'}

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

        {errors.address && (
          <span className="field-error">
            {errors.address}
          </span>
        )}
      </div>

      {/* Google location picker */}
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

/**
 * Customer details fields used by every booking flow.
 *
 * Includes:
 * - Full Name
 * - Mobile Number
 * - WhatsApp Number
 * - Email Address
 * - Project Location
 * - Project Address
 * - Upload Images
 * - City
 * - Pincode
 *
 * Image upload:
 * - Maximum 5 images
 * - Image files only
 * - Image previews
 * - Remove individual images
 *
 * The selected File[] is passed to the parent through
 * the optional onImagesChange callback.
 */
export default function CustomerDetailsFields({
  details,
  setDetail,
  errors,
  idPrefix = 'bk',
  onImagesChange,
}) {
  const value = (key) => details[key] || '';

  /* =========================================================
     IMAGE STATE
     ========================================================= */

  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);

  /* =========================================================
     CREATE IMAGE PREVIEWS
     ========================================================= */

  useEffect(() => {
    const previews = images.map((file) =>
      URL.createObjectURL(file)
    );

    setImagePreviews(previews);

    return () => {
      previews.forEach((url) => {
        URL.revokeObjectURL(url);
      });
    };
  }, [images]);

  /* =========================================================
     SEND SELECTED FILES TO PARENT
     ========================================================= */

  useEffect(() => {
    if (typeof onImagesChange === 'function') {
      onImagesChange(images);
    }
  }, [images, onImagesChange]);

  /* =========================================================
     IMAGE SELECT
     ========================================================= */

  const handleImageChange = (event) => {
    const selectedFiles = Array.from(
      event.target.files || []
    );

    if (!selectedFiles.length) {
      return;
    }

    // Only allow image files.
    const validImages = selectedFiles.filter((file) =>
      file.type.startsWith('image/')
    );

    // Maximum 5 images.
    const availableSlots = 5 - images.length;

    const filesToAdd = validImages.slice(
      0,
      availableSlots
    );

    if (filesToAdd.length > 0) {
      setImages((previousImages) => [
        ...previousImages,
        ...filesToAdd,
      ]);
    }

    // Reset the input.
    //
    // This allows the customer to select the same
    // image again if they remove it and want to re-add it.
    event.target.value = '';
  };

  /* =========================================================
     REMOVE IMAGE
     ========================================================= */

  const removeImage = (indexToRemove) => {
    setImages((previousImages) =>
      previousImages.filter(
        (_, index) => index !== indexToRemove
      )
    );
  };

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

        {/* WhatsApp */}
        <Field
          id={`${idPrefix}-whatsapp`}
          label="WhatsApp Number (Optional)"
          type="tel"
          inputMode="numeric"
          value={value('whatsapp')}
          onChange={setDetail('whatsapp')}
          error={errors.whatsapp}
          placeholder="Enter WhatsApp number"
          hint="Leave blank if it is the same as your mobile."
        />

        {/* Email */}
        <Field
          id={`${idPrefix}-email`}
          label="Email Address (Optional)"
          type="email"
          value={value('email')}
          onChange={setDetail('email')}
          error={errors.email}
          placeholder="Enter email address"
          autoComplete="email"
        />
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
          IMAGE UPLOAD
          ===================================================== */}

      <div className="booking-image-upload">
        <label className="booking-image-upload-label">
          Upload Images{' '}
          <span className="booking-image-upload-optional">
            (Optional)
          </span>
        </label>

        <p className="booking-image-upload-hint">
          Upload photos of your project or work area.
          Maximum 5 images.
        </p>

        <div className="booking-image-upload-container">

          {/* -------------------------------------------------
              SELECTED IMAGE PREVIEWS
              ------------------------------------------------- */}

          {images.map((file, index) => (
            <div
              className="booking-image-preview"
              key={`${file.name}-${file.lastModified}-${index}`}
            >
              <img
                src={imagePreviews[index]}
                alt={`Project image ${index + 1}`}
              />

              <button
                type="button"
                className="booking-image-remove"
                onClick={() => removeImage(index)}
                aria-label={`Remove ${file.name}`}
                title="Remove image"
              >
                ×
              </button>
            </div>
          ))}

          {/* -------------------------------------------------
              UPLOAD BUTTON
              ------------------------------------------------- */}

          {images.length < 5 && (
            <label
              htmlFor={`${idPrefix}-project-images`}
              className="booking-image-add"
            >
              <span className="booking-image-add-icon">
                +
              </span>

              <span className="booking-image-add-text">
                Upload Photos
              </span>
            </label>
          )}

          {/* Hidden file input */}
          <input
            id={`${idPrefix}-project-images`}
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageChange}
            style={{ display: 'none' }}
          />
        </div>

        {/* File information */}
        <span className="booking-image-upload-info">
          JPG, JPEG, PNG • Maximum 5 images
        </span>

        {/* Selected count */}
        {images.length > 0 && (
          <span className="booking-image-count">
            {images.length} / 5 images selected
          </span>
        )}
      </div>

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
