import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Icon from '../components/ui/Icon';
import { useAuth } from '../context/AuthContext';
import api, { friendlyError } from '../lib/api';

export default function Earnings() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await api.earnings();
      setData(result);
      setError('');
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleSignOut = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const firstName = (user.fullName || '').split(' ')[0];

  return (
    <>
      {/* ================= HEADER ================= */}
      <section className="p-hero">
        <div className="p-container">
          <div className="p-hero-top">
            <div>
              <span className="p-hero-eyebrow">SUPPLYBASE PARTNER</span>
              <h1 className="p-hero-title">
                {firstName ? `Earnings, ${firstName}` : 'Earnings'}
              </h1>
              <p className="p-hero-sub">
                Your payouts, transactions, and pending amounts — all in one place.
              </p>
            </div>
            <div className="p-hero-actions">
              <Link to="/dashboard" className="p-btn-outline">
                <Icon name="arrow-right" size={15} style={{ transform: 'rotate(180deg)' }} />
                Back to dashboard
              </Link>
              <button
                type="button"
                className="p-btn-outline"
                onClick={handleSignOut}
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ================= BODY ================= */}
      <div className="p-body">
        <div className="p-container">
          {error && (
            <div role="alert" className="alert alert-error">
              <Icon name="info" size={18} />
              <span>{error}</span>
            </div>
          )}

          {loading && (
            <p className="question-hint">Loading your earnings…</p>
          )}

          {!loading && data && (
            <>
              {/* ---------- SUMMARY CARDS ---------- */}
              <div className="e-cards">
                <div className="e-card e-card-primary">
                  <span className="e-card-label">Total earned</span>
                  <span className="e-card-value">
                    ₹{formatRupees(data.totalEarned)}
                  </span>
                  <span className="e-card-note">
                    Lifetime, all completed jobs
                  </span>
                </div>

                <div className="e-card">
                  <span className="e-card-label">This month</span>
                  <span className="e-card-value">
                    ₹{formatRupees(data.thisMonth)}
                  </span>
                  <span className="e-card-note">
                    {data.thisMonthJobs} {data.thisMonthJobs === 1 ? 'job' : 'jobs'}
                  </span>
                </div>

                <div className="e-card e-card-pending">
                  <span className="e-card-label">Pending payout</span>
                  <span className="e-card-value">
                    ₹{formatRupees(data.pending)}
                  </span>
                  <span className="e-card-note">
                    {data.pendingJobs} {data.pendingJobs === 1 ? 'job' : 'jobs'} awaiting payment
                  </span>
                </div>
              </div>

              {/* ---------- TRANSACTIONS ---------- */}
              <section className="e-section">
                <div className="e-section-title">
                  <h2>Transaction history</h2>
                  <span className="e-section-count">
                    {data.transactions.length}
                  </span>
                </div>

                {data.transactions.length === 0 ? (
                  <div className="p-empty">
                    <span className="p-empty-icon">💰</span>
                    <h3>No transactions yet</h3>
                    <p>
                      Once you complete your first job, your payment will appear here.
                    </p>
                  </div>
                ) : (
                  <div className="e-tx-list">
                    {data.transactions.map((tx) => (
                      <TransactionRow key={tx.id} tx={tx} />
                    ))}
                  </div>
                )}
              </section>

              {/* ---------- HELP ---------- */}
              <div className="e-help">
                <div>
                  <strong>Missing a payment?</strong>
                  <p>
                    If you think a transaction is wrong or delayed, message our team.
                  </p>
                </div>
                <a
                  href={`https://wa.me/917770088855?text=${encodeURIComponent(
                    'Hi Supplybase, I have a question about my partner payout.'
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-btn-primary"
                >
                  <Icon name="whatsapp" size={16} />
                  Message us
                </a>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

/* ============================================================
   Transaction row
   ============================================================ */

function TransactionRow({ tx }) {
  const isCredit = tx.amount > 0;
  return (
    <div className="e-tx">
      <span className={`e-tx-icon ${isCredit ? 'credit' : 'debit'}`}>
        <Icon name={isCredit ? 'check-circle' : 'info'} size={16} />
      </span>

      <div className="e-tx-body">
        <strong className="e-tx-title">{tx.title}</strong>
        <span className="e-tx-meta">
          {formatDate(tx.date)}
          {tx.reference ? ` · ${tx.reference}` : ''}
        </span>
      </div>

      <div className="e-tx-right">
        <span className={`e-tx-amount ${isCredit ? 'credit' : 'debit'}`}>
          {isCredit ? '+' : '−'}₹{formatRupees(Math.abs(tx.amount))}
        </span>
        <span className={`e-tx-status e-tx-status-${tx.status}`}>
          {tx.status}
        </span>
      </div>
    </div>
  );
}

/* ============================================================
   Helpers
   ============================================================ */

function formatRupees(value) {
  const n = Number(value) || 0;
  return n.toLocaleString('en-IN', { maximumFractionDigits: 0 });
}

function formatDate(value) {
  if (!value) return '';
  return new Date(value).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}