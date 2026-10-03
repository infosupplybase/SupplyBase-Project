import { Suspense, useEffect } from 'react';
import lazyPage from '../../lib/lazyPage';

/*
 * The booking modal pulls in every booking flow (painting, plumbing,
 * electrical, interior ... ), which is most of the website's code. Pages that
 * only show service tiles load it on demand instead of with the page.
 */
const loadModal = () => import('./ServiceBookingModal');
const ServiceBookingModal = lazyPage(loadModal);

/** Fetch the modal's code shortly after the tiles are on screen, so it is
    usually there by the time someone taps a tile. */
export function useWarmBookingModal() {
  useEffect(() => {
    const id = setTimeout(loadModal, 1500);
    return () => clearTimeout(id);
  }, []);
}

export default function LazyServiceBookingModal(props) {
  return (
    <Suspense
      fallback={
        <div
          className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/65 text-sm font-semibold text-white"
          role="status"
        >
          Loading…
        </div>
      }
    >
      <ServiceBookingModal {...props} />
    </Suspense>
  );
}
