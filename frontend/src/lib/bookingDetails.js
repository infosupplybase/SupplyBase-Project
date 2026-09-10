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
  city: '',
  pincode: '',
};

export const isValidPhone = (v) =>
  /^[6-9]\d{9}$/.test(String(v || '').replace(/\D/g, '').replace(/^91/, '').replace(/^0/, ''));

export function validateDetails(details) {
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
  if (!details.address.trim()) next.address = 'Please enter your address';
  if (!details.city.trim()) next.city = 'Please enter your city';
  if (details.pincode.trim() && !/^[1-9][0-9]{5}$/.test(details.pincode.trim())) {
    next.pincode = 'Enter a 6-digit pincode';
  }
  return next;
}
