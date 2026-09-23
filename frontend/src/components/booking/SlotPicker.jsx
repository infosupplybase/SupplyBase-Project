import { useEffect, useState } from 'react';
import api, { friendlyError } from '../../lib/api';
import Icon from '../ui/Icon';

const DAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
               'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** 2026-08-27 -> {day:'Thu', date:27, month:'Aug'} without a Date-parse timezone shift. */
const parts = (iso) => {
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return { day: DAY[date.getDay()], date: d, month: MONTH[m - 1] };
};

/**
 * Date and time picker, driven entirely by the backend (RULE 8).
 *
 * Nothing here knows the office hours. It asks which days are open and which
 * times are left, and renders exactly that — so changing Saturday's hours is
 * an admin edit, not a release.
 */
export default function SlotPicker({ serviceSlug, date, time, onPick, error }) {
  const [days, setDays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api
      .availableSlots(serviceSlug, null, 14)
      .then((result) => {
        if (!cancelled) setDays(result);
      })
      .catch((err) => {
        if (!cancelled) setLoadError(friendlyError(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [serviceSlug]);

  if (loading) {
    return <p className="question-hint">Checking available times…</p>;
  }

  if (loadError) {
    return (
      <div role="alert" className="alert alert-error">
        <Icon name="info" size={18} />
        <span>{loadError}</span>
      </div>
    );
  }

  const openDays = days.filter((d) => d.open);
  const chosenDay = days.find((d) => d.date === date);

  if (openDays.length === 0) {
    return (
      <div role="alert" className="alert alert-info">
        <Icon name="info" size={18} />
        <span>No visit times are open in the next two weeks. Please call us.</span>
      </div>
    );
  }

  return (
    <div className={`slot-picker ${error ? 'has-error' : ''}`}>
      <h3 className="question-text">
        Choose a date <span className="req">*</span>
      </h3>
      <div className="day-strip" role="radiogroup" aria-label="Visit date">
        {days.map((d) => {
          const { day, date: dayNum, month } = parts(d.date);
          const chosen = d.date === date;
          return (
            <button
              key={d.date}
              type="button"
              role="radio"
              aria-checked={chosen}
              disabled={!d.open}
              title={d.open ? undefined : d.closedReason}
              className={`day-chip ${chosen ? 'chosen' : ''}`}
              // Changing the date clears the time: the slot chosen yesterday
              // may not exist tomorrow, and silently keeping it would submit
              // a time the customer never actually picked.
              onClick={() => onPick(d.date, '')}
            >
              <span className="day-name">{day}</span>
              <span className="day-num">{dayNum}</span>
              <span className="day-month">{month}</span>
            </button>
          );
        })}
      </div>

      {chosenDay && (
        <>
          <h3 className="question-text" style={{ marginTop: 24 }}>
            Choose a time <span className="req">*</span>
          </h3>
          <div className="slot-grid" role="radiogroup" aria-label="Visit time">
            {chosenDay.slots.map((slot) => (
              <button
                key={slot.time}
                type="button"
                role="radio"
                aria-checked={slot.time === time}
                disabled={!slot.available}
                className={`slot-chip ${slot.time === time ? 'chosen' : ''}`}
                onClick={() => onPick(date, slot.time)}
              >
                {slot.label}
              </button>
            ))}
          </div>
          <p className="question-hint" style={{ marginTop: 12 }}>
            Greyed-out times are already full.
          </p>
        </>
      )}

      {error && <span className="field-error">{error}</span>}
    </div>
  );
}
