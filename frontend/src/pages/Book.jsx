import { useSearchParams } from 'react-router-dom';
import PageHero from '../components/ui/PageHero';
import BookingWizard from '../components/booking/BookingWizard';
import { bookingLanes } from '../data/booking';

/**
 * /book — the site-visit request.
 *
 * The lane lives in the URL (?type=service | ?type=project) so the two hero
 * buttons are real, linkable destinations and the back button behaves. An
 * unknown value falls back to the service lane rather than rendering nothing.
 */
export default function Book() {
  const [params, setParams] = useSearchParams();
  const requested = params.get('type');
  const lane = requested && bookingLanes[requested] ? requested : 'service';
  const config = bookingLanes[lane];

  const setLane = (next) => setParams({ type: next }, { replace: true });

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
