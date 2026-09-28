/** Shared customer-details shape + validation for every booking flow that
    collects name/phone/address (ServiceBooking's own flow, plus the new
    plumbing checkout and consultation booking flows) — kept in one place so
    the validation rules can't drift between them. */
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
export function validateDetails(details, pickedLocation = null) {
  const next = {};
  if (!details.name.trim()) next.name = 'Please enter your name';
  if (!details.phone.trim()) next.phone = 'Please enter your mobile number';
  else if (!isValidPhone(details.phone)) next.phone = 'Enter a 10-digit mobile number';
  if (details.whatsapp.trim() && !isValidPhone(details.whatsapp)) {
    next.whatsapp = 'Enter a 10-digit number, or leave it blank';
  }
  if (details.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(details.email.trim())) {
    next.email = 'That email address does not look right';
  }
  if (pickedLocation) {
    if (!text(details.buildingName)) next.buildingName = 'Please enter the building name';
  } else if (!text(details.address)) {
    next.address = 'Please enter your address';
  }
  if (!details.city.trim()) next.city = 'Please enter your city';
  if (!details.pincode.trim()) next.pincode = 'Please enter your pincode';
  else if (!/^[1-9][0-9]{5}$/.test(details.pincode.trim())) {
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
