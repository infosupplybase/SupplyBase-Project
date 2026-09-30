import api from './api';

/**
 * Photos a customer picks in the booking details form ("Upload Images",
 * CustomerDetailsFields), waiting for the booking to be created.
 *
 * Files cannot live in the form's history state (see useHistoryState), and
 * the details step unmounts when the customer moves on to pick a time — so
 * they are kept here, one list per form (its idPrefix), and the form shows
 * them again if the customer comes back. Once the booking exists, the flow
 * calls uploadBookingPhotos(), which sends each one to the booking
 * (POST /api/bookings/by-number/{n}/files, the same upload the electrician
 * journeys use) and clears the list.
 */
const pending = new Map(); // idPrefix -> File[]

export const MAX_BOOKING_PHOTOS = 5;

export function getBookingPhotos(idPrefix) {
  return pending.get(idPrefix) || [];
}

export function setBookingPhotos(idPrefix, files) {
  if (files.length) pending.set(idPrefix, files);
  else pending.delete(idPrefix);
}

/**
 * Uploads this form's photos to the booking just made. Runs in the
 * background after the confirmation shows; a photo that fails is left out
 * rather than failing the booking (the customer can still send it on
 * WhatsApp). Resolves to { uploaded, failed }.
 */
export async function uploadBookingPhotos(idPrefix, bookingNumber, phone) {
  const files = getBookingPhotos(idPrefix);
  pending.delete(idPrefix);
  let uploaded = 0;
  let failed = 0;
  for (const file of files) {
    try {
      // eslint-disable-next-line no-await-in-loop
      await api.uploadBookingFile(bookingNumber, phone, file);
      uploaded += 1;
    } catch {
      failed += 1;
    }
  }
  return { uploaded, failed };
}
