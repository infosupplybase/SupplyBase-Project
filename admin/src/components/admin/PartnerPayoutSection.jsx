import { useEffect, useState } from 'react';
import Icon from '../ui/Icon';
import StatusBadge from './StatusBadge';
import api, { friendlyError } from '../../lib/api';
import { formatRupees, inputToPaise, paiseToInput } from '../../lib/money';

const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : null;

/**
 * What the assigned partner earns for one job, and whether it has been paid
 * out. The partner sees this figure on their dashboard, so it is the number
 * that matters — the customer never sees it.
 *
 * Rules the server enforces (and this mirrors so the buttons make sense): the
 * amount can be agreed any time after assignment; "paid" needs the work to be
 * completed and a real amount; a paid amount is locked until it is marked
 * unpaid again.
 */
export default function PartnerPayoutSection({ booking }) {
  const [payout, setPayout] = useState(null);
  const [amount, setAmount] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setPayout(null);
    setLoadError('');
    api.admin.bookings
      .payout(booking.id)
      .then((result) => {
        if (cancelled) return;
        setPayout(result);
        setAmount(paiseToInput(result.amountPaise));
      })
      .catch((err) => {
        if (!cancelled) setLoadError(friendlyError(err));
      });
    return () => {
      cancelled = true;
    };
  }, [booking.id]);

  if (loadError) {
    return (
      <div role="alert" className="alert alert-error">
        <Icon name="info" size={18} />
        <span>{loadError}</span>
      </div>
    );
  }
  if (!payout) return <p className="admin-table-sub">Loading payout…</p>;

  const isPaid = Boolean(payout.paidAt);
  const completed = payout.status === 'WORK_COMPLETED';
  const typed = inputToPaise(amount);
  const typedInvalid = Number.isNaN(typed);
  const changed = !typedInvalid && typed !== payout.amountPaise;

  const save = async (nextAmountPaise, paid) => {
    setBusy(true);
    setError('');
    try {
      const updated = await api.admin.bookings.setPayout(booking.id, nextAmountPaise, paid);
      setPayout(updated);
      setAmount(paiseToInput(updated.amountPaise));
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="admin-modal-top" style={{ marginBottom: 12 }}>
        {payout.amountPaise == null ? (
          <StatusBadge tone="warning">Amount not set</StatusBadge>
        ) : isPaid ? (
          <StatusBadge tone="success">Paid {formatDate(payout.paidAt)}</StatusBadge>
        ) : (
          <StatusBadge tone="accent">{completed ? 'Payment pending' : 'Agreed — pays on completion'}</StatusBadge>
        )}
        <span className="admin-table-sub">To {payout.partnerName}</span>
      </div>

      <div className="field" style={{ marginBottom: 10 }}>
        <label htmlFor="bk-payout">Partner payout for this job (₹)</label>
        <input
          id="bk-payout"
          type="text"
          inputMode="decimal"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="e.g. 1500"
          disabled={isPaid || busy}
        />
        {isPaid && (
          <span className="admin-table-sub">Mark it unpaid to change the amount.</span>
        )}
        {typedInvalid && (
          <span className="field-error">Enter an amount in rupees, like 1500 or 1500.50.</span>
        )}
      </div>

      {error && (
        <div role="alert" className="alert alert-error" style={{ marginBottom: 10 }}>
          <Icon name="info" size={18} />
          <span>{error}</span>
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {!isPaid && (
          <button
            type="button"
            className="btn btn-outline"
            disabled={busy || typedInvalid || !changed}
            onClick={() => save(typed, false)}
          >
            {busy ? 'SAVING…' : 'SAVE AMOUNT'}
          </button>
        )}

        {!isPaid && (
          <button
            type="button"
            className="btn btn-dark"
            disabled={busy || typedInvalid || !completed || !typed || changed}
            title={
              !completed
                ? 'Available once the work is completed'
                : changed
                  ? 'Save the amount first'
                  : undefined
            }
            onClick={() => {
              if (window.confirm(`Mark ${formatRupees(payout.amountPaise)} as paid to ${payout.partnerName}?`)) {
                save(payout.amountPaise, true);
              }
            }}
          >
            MARK AS PAID
          </button>
        )}

        {isPaid && (
          <button
            type="button"
            className="btn btn-outline"
            disabled={busy}
            onClick={() => {
              if (window.confirm('Mark this payout as unpaid? Use this only to correct a mistake.')) {
                save(payout.amountPaise, false);
              }
            }}
          >
            MARK AS UNPAID
          </button>
        )}
      </div>
    </>
  );
}
