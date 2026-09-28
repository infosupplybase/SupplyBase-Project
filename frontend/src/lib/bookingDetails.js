import { hasGoogleMaps } from '../components/layout/GoogleLocationPicker';

/** Shared customer-details shape + validation for every booking flow (they
    all render components/booking/CustomerDetailsFields) — kept in one place
    so the validation rules can't drift between them. */
export const emptyDetails = {
  name: '',
  phone: '',
  whatsapp: '',
  email: '',
  address: '',
  buildingName: '',
  roomNo: '',
  floorNo: '',
  city: '',
  pincode: '',
};

// A form restored from history (see useHistoryState) may predate the
// building / room / floor fields.
const text = (v) => String(v || '').trim();

/**
 * Only strips a country-code prefix when the digit count actually implies
 * one is there (12 digits = 91 + a 10-digit number, 11 = a leading 0) — a
 * blind `.replace(/^91/, '')` mangles a real 10-digit number that happens
 * to start with 91 (e.g. 9123456780) and rejects it.
 */
export const isValidPhone = (v) => {
  let digits = String(v || '').replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) digits = digits.slice(2);
  else if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1);
  return /^[6-9]\d{9}$/.test(digits);
};

/**
 * `pickedLocation` is the customer's map pin (usePickedLocation), or null.
 * With a pin the building name is required and the typed address is an
 * optional extra; without one the typed address is required, as before.
 */
export function validateDetails(details, pickedLocation = null, { typedAddressOnly = false } = {}) {
  const next = {};
  if (!text(details.name)) next.name = 'Please enter your name';
  if (!text(details.phone)) next.phone = 'Please enter your mobile number';
  else if (!isValidPhone(details.phone)) next.phone = 'Enter a 10-digit mobile number';
  if (text(details.whatsapp) && !isValidPhone(details.whatsapp)) {
    next.whatsapp = 'Enter a 10-digit number, or leave it blank';
  }
  if (text(details.email) && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text(details.email))) {
    next.email = 'That email address does not look right';
  }
  if (pickedLocation) {
    if (!text(details.buildingName)) next.buildingName = 'Please enter the building name';
  } else if (!text(details.address)) {
    next.address = hasGoogleMaps && !typedAddressOnly
      ? 'Select your location on the map, or type your address'
      : 'Please enter your address';
  }
  if (!text(details.city)) next.city = 'Please enter your city';
  if (!text(details.pincode)) next.pincode = 'Please enter your pincode';
  else if (!/^[1-9][0-9]{5}$/.test(text(details.pincode))) {
    next.pincode = 'Enter a 6-digit pincode';
  }
  return next;
}

/** The address a booking is sent with: building, room, floor, the map pin,
    then anything typed. Without a pin it is just the typed address. */
export function composeAddress(details, pickedLocation = null) {
  return [
    text(details.buildingName),
    text(details.roomNo) ? `Room ${text(details.roomNo)}` : '',
    text(details.floorNo) ? `Floor ${text(details.floorNo)}` : '',
    pickedLocation?.address || '',
    text(details.address),
  ]
    .filter(Boolean)
    .join(', ');
}
