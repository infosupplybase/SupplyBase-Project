import { Fragment } from 'react';
import Icon from '../ui/Icon';
import { bookingSteps } from '../../data/homeServices';
import './HowBookingWorks.css';

/**
 * The five booking steps, on the dark panel under the service cards.
 *
 * Arrows are rendered between steps rather than as a pseudo-element on each
 * one, so they occupy their own grid track and cannot spill outside the panel.
 * They are dropped entirely once the grid wraps — a horizontal connector
 * between two stacked rows points at nothing.
 */
export default function HowBookingWorks() {
  return (
    <section className="hbw" aria-labelledby="hbw-title">
      <h2 id="hbw-title" className="hbw-title">
        How Booking Works
      </h2>

      <ol className="hbw-steps">
        {bookingSteps.map((step, i) => (
          <Fragment key={step.title}>
            <li className="hbw-step">
              <span className="hbw-icon" aria-hidden="true">
                <Icon name={step.icon} size={22} strokeWidth={1.6} />
              </span>
              <div className="hbw-body">
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </div>
            </li>

            {i < bookingSteps.length - 1 && (
              <li className="hbw-arrow" aria-hidden="true">
                <Icon name="arrow-right" size={13} strokeWidth={2.4} />
              </li>
            )}
          </Fragment>
        ))}
      </ol>
    </section>
  );
}
