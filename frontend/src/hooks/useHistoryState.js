import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

/**
 * FORM STATE THAT LIVES IN THE BROWSER'S HISTORY
 *
 * Booking forms used to keep their step and answers in React state only, so
 * a refresh threw everything away, and the browser's Back button left the
 * whole form instead of going back one step.
 *
 * These hooks keep that state in the current history entry instead
 * (react-router's `location.state`, i.e. `history.state.usr`):
 *
 *  - The browser keeps history state across a refresh, so the form comes
 *    back on the same step with the same answers.
 *  - A step change is a new history entry (`push`), so Back returns to the
 *    previous step and Forward to the next one.
 *  - Typing and choosing replace the current entry, so filling in a form
 *    does not add hundreds of history entries.
 *  - Only the step follows Back and Forward. Answers, details and the
 *    booking receipt stay as they are and are copied into whichever entry
 *    the form lands on: each entry only holds a snapshot of the answers
 *    from when it was pushed, so following history would roll the details
 *    back to what they were on that step (often empty). Keeping the receipt
 *    also means Back after booking shows the confirmation, not a filled-in
 *    form that can be sent again.
 *
 * Several setters called in the same tick (a click that sets the step and an
 * answer together) are merged into ONE navigation, so one click is one
 * history entry.
 *
 * Keys are namespaced by the caller (e.g. `f:painting:full-home:stage`) so
 * two forms never read each other's answers. Values must be plain data
 * (history state is structured-cloned) — never File objects.
 */

/** Marks an entry that one of these hooks pushed (so "back" can pop it). */
const PUSHED = '__formPush';

let pending = null;

const currentUserState = () => (window.history.state && window.history.state.usr) || {};

const has = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);

// History state is structured-cloned, so a restored value is never the same
// object; compare the data instead. Values are plain data (see above).
const sameData = (a, b) => Object.is(a, b) || JSON.stringify(a) === JSON.stringify(b);

function schedule(navigate, patch, push) {
  if (!pending) {
    pending = { patch: {}, push: false, navigate };
    queueMicrotask(() => {
      const { patch: p, push: isPush, navigate: nav } = pending;
      pending = null;
      const base = currentUserState();
      const next = { ...base, ...p };
      // A replaced entry keeps its own "was pushed" mark; a new one gets it.
      if (isPush) next[PUSHED] = true;
      else if (base[PUSHED]) next[PUSHED] = true;
      else delete next[PUSHED];
      const { pathname, search, hash } = window.location;
      nav({ pathname, search, hash }, { replace: !isPush, state: next });
    });
  }
  Object.assign(pending.patch, patch);
  pending.push = pending.push || push;
}

/**
 * Like useState, but kept in the history entry.
 *
 * `push: true` makes every change a new history entry (use it for the step
 * or view — what Back should undo), and the value follows Back and Forward.
 * Otherwise changes replace the entry, and the value is kept as it is when
 * the form moves to another entry (see "Only the step follows" above).
 */
export function useHistoryState(key, initial, { push = false } = {}) {
  const location = useLocation();
  const navigate = useNavigate();

  const usr = location.state || {};
  const fromHistory = has(usr, key) ? usr[key] : initial;

  // A local copy that changes on the same keystroke. A controlled input
  // needs that: if its value only changed a moment later (when the history
  // write lands), React would put the old text back and the cursor would
  // jump to the end. For a step the copy follows history whenever the entry
  // changes (Back, Forward); an answer keeps its value and is written into
  // the new entry below. A refresh starts from the entry either way.
  const [local, setLocal] = useState({ entry: location.key, value: fromHistory });
  let value = local.value;
  if (local.entry !== location.key) {
    if (push) value = fromHistory;
    setLocal({ entry: location.key, value });
  }

  const valueRef = useRef(value);
  valueRef.current = value;
  const entryRef = useRef(location.key);
  entryRef.current = location.key;
  const initialRef = useRef(initial);
  initialRef.current = initial;

  // After Back or Forward, copy the answer into the entry the form is now on,
  // so a refresh there keeps it too.
  useEffect(() => {
    if (push) return;
    const state = currentUserState();
    const stored = has(state, key) ? state[key] : initialRef.current;
    if (!sameData(stored, valueRef.current)) schedule(navigate, { [key]: valueRef.current }, false);
  }, [location.key, key, navigate, push]);

  // `options.push` overrides the hook's default for one call.
  const setValue = useCallback(
    (next, options) => {
      const prev = valueRef.current;
      const resolved = typeof next === 'function' ? next(prev) : next;
      if (Object.is(resolved, prev)) return;
      valueRef.current = resolved;
      setLocal({ entry: entryRef.current, value: resolved });
      schedule(navigate, { [key]: resolved }, options && 'push' in options ? options.push : push);
    },
    [key, navigate, push]
  );

  return [value, setValue];
}

/**
 * The in-app BACK buttons. If the current entry is one a form step pushed,
 * go back through history (exactly what the browser's Back does, so the two
 * always agree and Forward still works). Otherwise — the page was opened
 * directly on this step — run `fallback`.
 */
export function useFormBack() {
  const navigate = useNavigate();
  return useCallback(
    (fallback) => {
      if (currentUserState()[PUSHED] && !pending) {
        navigate(-1);
      } else if (fallback) {
        fallback();
      }
    },
    [navigate]
  );
}

/** Whether a key is present in the current entry (e.g. "was this restored?"). */
export function hasHistoryState(key) {
  return has(currentUserState(), key);
}
