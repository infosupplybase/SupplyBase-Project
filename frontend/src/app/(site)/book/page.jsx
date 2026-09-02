'use client';

import { Suspense } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import PageHero from '../../../components/ui/PageHero';
import BookingWizard from '../../../components/booking/BookingWizard';
import { bookingLanes } from '../../../data/booking';

/**
 * /book — the site-visit request.
 *
 * The lane lives in the URL (?type=service | ?type=project) so the two hero
 * buttons are real, linkable destinations and the back button behaves. An
 * unknown value falls back to the service lane rather than rendering nothing.
 *
 * Next's useSearchParams() is read-only, so switching lanes goes through
 * useRouter() + usePathname() and rebuilds the query string by hand.
 */
function Book() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const requested = params.get('type');
  const lane = requested && bookingLanes[requested] ? requested : 'service';
  const config = bookingLanes[lane];

  const setLane = (next) => {
    const nextParams = new URLSearchParams(params.toString());
    nextParams.set('type', next);
    router.replace(`${pathname}?${nextParams.toString()}`);
  };

  return (
    <>
      <PageHero
        eyebrow="BOOK A SITE VISIT"
        title={lane === 'project' ? 'START YOUR PROJECT' : 'BOOK A SERVICE'}
        text={config.tagline}
        image="/assets/hero-house.svg"
        breadcrumbs={[{ label: 'Book' }]}
      />

      <section className="section">
        <div className="container container-narrow">
          <BookingWizard lane={lane} onLaneChange={setLane} />
        </div>
      </section>
    </>
  );
}

/**
 * useSearchParams() opts the page out of static rendering unless it's inside
 * a Suspense boundary — without one, `next build` fails to prerender this
 * route at all. The fallback is invisible in practice: this page needs a
 * client fetch either way, so there's nothing meaningful to show first.
 */
export default function BookPage() {
  return (
    <Suspense fallback={null}>
      <Book />
    </Suspense>
  );
}
