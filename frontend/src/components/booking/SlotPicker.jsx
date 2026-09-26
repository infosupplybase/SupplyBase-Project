import { useEffect, useMemo, useState } from 'react';
import api, { friendlyError } from '../../lib/api';
import Icon from '../ui/Icon';

const DAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
               'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** How far ahead a customer may ask for their own date (matches the API). */
const CUSTOM_DAYS_AHEAD = 90;
/** Custom start times are on the quarter hour (matches the API). */
const CUSTOM_STEP_MINUTES = 15;
/** A visit needs arranging (matches the API's minimum notice). */
const MIN_NOTICE_HOURS = 12;

/** 2026-08-27 -> {day:'Thu', date:27, month:'Aug'} without a Date-parse timezone shift. */
const parts = (iso) => {
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return { day: DAY[date.getDay()], date: d, month: MONTH[m - 1] };
};

/** Local calendar date as yyyy-mm-dd (not toISOString, which is UTC). */
const isoDate = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

/** "14:45" or "14:45:00" -> minutes since midnight. */
const toMinutes = (time) => {
  const [h, m] = String(time).split(':').map(Number);
  return h * 60 + m;
};

/** 885 -> "14:45" */
const toHHMM = (minutes) =>
  `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;

/** "14:45" -> "2:45 PM" */
const toLabel = (time) => {
  const minutes = toMinutes(time);
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h % 12 === 0 ? 12 : h % 12}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
};

/** "2026-10-15" -> "Thu, 15 Oct" */
const longDate = (iso) => {
  const { day, date, month } = parts(iso);
  return `${day}, ${date} ${month}`;
};

/**
 * Date and time picker, driven by the backend (RULE 8).
 *
 * The listed days and times come from the API, so the office hours are an
 * admin setting, not a release. For a customer none of those suit, "Choose
 * your own date & time" lets them ask for any day up to 90 days ahead at any
 * quarter-hour start inside the working hours (read from the same list); the
 * API checks it again when the booking is made.
 */
export default function SlotPicker({ serviceSlug, date, time, onPick, error }) {
  const [days, setDays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [custom, setCustom] = useState(false);
  const [customDate, setCustomDate] = useState('');
  const [customTime, setCustomTime] = useState('');
  const [customError, setCustomError] = useState('');

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

  // Working hours, as the API lists them: the earliest and latest start
  // across the fortnight (e.g. 9:00 AM and 8:00 PM), and how long a visit is.
  const hours = useMemo(() => {
    const starts = days.flatMap((d) => d.slots.map((s) => toMinutes(s.time)));
    if (starts.length === 0) return null;
    const sorted = [...new Set(starts)].sort((a, b) => a - b);
    const step = sorted.length > 1 ? sorted[1] - sorted[0] : 60;
    return { first: sorted[0], last: sorted[sorted.length - 1], step };
  }, [days]);

  // Coming back to this step with a time that is not in the list (a custom
  // one): open the custom panel with it filled in.
  useEffect(() => {
    if (loading || !date || !time) return;
    const listed = days.some((d) => d.date === date && d.slots.some((s) => s.time === time));
    if (!listed) {
      setCustom(true);
      setCustomDate(date);
      setCustomTime(toHHMM(toMinutes(time)));
    }
  }, [loading]); // eslint-disable-line react-hooks/exhaustive-deps

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

  const today = new Date();
  const minDate = isoDate(today);
  const maxDate = isoDate(new Date(today.getFullYear(), today.getMonth(), today.getDate() + CUSTOM_DAYS_AHEAD));

  const hoursText = hours
    ? `We visit every day between ${toLabel(toHHMM(hours.first))} and ${toLabel(toHHMM(hours.last + hours.step))}.`
    : null;

  /** Checks the custom date and time the way the API will, and passes them up if they are fine. */
  const applyCustom = (nextDate, nextTime) => {
    setCustomDate(nextDate);
    setCustomTime(nextTime);
    setCustomError('');

    if (!nextDate || !nextTime) {
      onPick(nextDate || '', '');
      return;
    }
    if (nextDate < minDate || nextDate > maxDate) {
      setCustomError(`Please choose a date between today and ${longDate(maxDate)}.`);
      onPick(nextDate, '');
      return;
    }
    const minutes = toMinutes(nextTime);
    if (hours && (minutes < hours.first || minutes > hours.last)) {
      setCustomError(
        `Please choose a start time between ${toLabel(toHHMM(hours.first))} and ${toLabel(toHHMM(hours.last))}, so the visit finishes by ${toLabel(toHHMM(hours.last + hours.step))}.`
      );
      onPick(nextDate, '');
      return;
    }
    if (minutes % CUSTOM_STEP_MINUTES !== 0) {
      setCustomError('Please choose a time on the quarter hour, like 2:00, 2:15, 2:30 or 2:45.');
      onPick(nextDate, '');
      return;
    }
    const [y, m, d] = nextDate.split('-').map(Number);
    const visit = new Date(y, m - 1, d, Math.floor(minutes / 60), minutes % 60);
    if (visit.getTime() - Date.now() < MIN_NOTICE_HOURS * 3600 * 1000) {
      setCustomError(`Please choose a time at least ${MIN_NOTICE_HOURS} hours from now, so we can arrange the visit.`);
      onPick(nextDate, '');
      return;
    }
    onPick(nextDate, `${nextTime}:00`);
  };

  const openCustom = () => {
    setCustom(true);
    setCustomError('');
    const startDate = date || (openDays[0] && openDays[0].date) || '';
    setCustomDate(startDate);
    setCustomTime('');
    onPick(startDate, '');
  };

  const closeCustom = () => {
    setCustom(false);
    setCustomError('');
    onPick('', '');
  };

  if (custom) {
    return (
      <div className={`slot-picker slot-picker-custom ${error ? 'has-error' : ''}`}>
        <div className="slot-custom-head">
          <h3 className="question-text">
            Your own date &amp; time <span className="req">*</span>
          </h3>
          <button type="button" className="slot-mode-link" onClick={closeCustom}>
            <Icon name="arrow-left" size={15} /> Back to available times
          </button>
        </div>

        {hoursText && <p className="slot-hours">{hoursText}</p>}

        <div className="slot-custom-fields">
          <label className="field">
            <span className="form-label">Date</span>
            <input
              type="date"
              className="input"
              value={customDate}
              min={minDate}
              max={maxDate}
              onChange={(e) => applyCustom(e.target.value, customTime)}
            />
          </label>
          <label className="field">
            <span className="form-label">Start time</span>
            <input
              type="time"
              className="input"
              value={customTime}
              min={hours ? toHHMM(hours.first) : '09:00'}
              max={hours ? toHHMM(hours.last) : '20:00'}
              step={CUSTOM_STEP_MINUTES * 60}
              onChange={(e) => applyCustom(customDate, e.target.value)}
            />
          </label>
        </div>

        {customError ? (
          <p className="field-error" role="alert">
            {customError}
          </p>
        ) : (
          customDate &&
          customTime && (
            <p className="slot-custom-summary" role="status">
              <Icon name="check-circle" size={17} />
              {longDate(customDate)} at {toLabel(customTime)}. Our team will confirm the visit with you.
            </p>
          )
        )}

        {error && !customError && <span className="field-error">{error}</span>}
      </div>
    );
  }

  if (openDays.length === 0) {
    return (
      <div className="slot-picker">
        <div role="alert" className="alert alert-info">
          <Icon name="info" size={18} />
          <span>No listed visit times are open in the next two weeks.</span>
        </div>
        <button type="button" className="btn btn-outline slot-custom-btn" onClick={openCustom}>
          <Icon name="calendar" size={17} /> Choose your own date &amp; time
        </button>
      </div>
    );
  }

  return (
    <div className={`slot-picker ${error ? 'has-error' : ''}`}>
      <h3 className="question-text">
        Choose a date <span className="req">*</span>
      </h3>
      {hoursText && <p className="slot-hours">{hoursText}</p>}
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
            Greyed-out times are already full or too soon to arrange.
          </p>
        </>
      )}

      <button type="button" className="slot-custom-link" onClick={openCustom}>
        <Icon name="calendar" size={17} />
        <span>
          <strong>None of these suit you?</strong> Choose your own date &amp; time
        </span>
        <Icon name="chevron-right" size={16} />
      </button>

      {error && <span className="field-error">{error}</span>}
    </div>
  );
}
