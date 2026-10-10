import { useEffect, useState } from 'react';
import { hasGoogleMaps } from '../layout/GoogleLocationPicker';
import SavedAddressPicker from './SavedAddressPicker';
import {
  useLocationContext,
  usePickedLocation,
} from '../../context/LocationContext';
import {
  getBookingPhotos,
  setBookingPhotos,
  MAX_BOOKING_PHOTOS,
  BOOKING_PHOTO_TYPES,
} from '../../lib/bookingPhotos';
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
 * With a Google Maps key the customer types an address (or uses their current
 * location, or taps the map), checks what it resolved to, labels it and adds
 * it to their saved addresses (SavedAddressPicker). Once a location is
 * selected the building name is requested; room and floor are optional.
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
                  Room No.
                </label>

                <input
                  id={`${idPrefix}-room`}
                  type="text"
                  value={details.roomNo || ''}
                  onChange={setDetail('roomNo')}
                  maxLength={MAX_LENGTH.roomNo}
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
                  maxLength={MAX_LENGTH.floorNo}
                  placeholder="Floor"
                />
              </div>
            </div>
          </div>
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
          maxLength={MAX_LENGTH.address}
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
 * The selected files are kept in lib/bookingPhotos (per idPrefix), so they
 * survive the customer moving on to the next step and back; the booking
 * flow uploads them with uploadBookingPhotos() once the booking exists.
 * The optional onImagesChange callback also receives them.
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

  // Starts with any photos already picked in this form (coming Back to it).
  const [images, setImages] = useState(() => getBookingPhotos(idPrefix));
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
    // Kept for the booking flow to upload once the booking is made.
    setBookingPhotos(idPrefix, images);
    if (typeof onImagesChange === 'function') {
      onImagesChange(images);
    }
  }, [images, idPrefix, onImagesChange]);

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

    // Only the photo types the server accepts (JPG, PNG, WebP).
    const validImages = selectedFiles.filter((file) =>
      BOOKING_PHOTO_TYPES.includes(file.type)
    );

    // Maximum 5 images.
    const availableSlots = MAX_BOOKING_PHOTOS - images.length;

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
          maxLength={MAX_LENGTH.email}
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

          {images.length < MAX_BOOKING_PHOTOS && (
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
            accept={BOOKING_PHOTO_TYPES.join(',')}
            multiple
            onChange={handleImageChange}
            style={{ display: 'none' }}
          />
        </div>

        {/* File information */}
        <span className="booking-image-upload-info">
          JPG, PNG or WebP • Maximum 5 images
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