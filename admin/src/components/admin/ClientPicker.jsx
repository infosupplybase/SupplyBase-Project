import { useEffect, useId, useState } from 'react';
import Icon from '../ui/Icon';
import api, { friendlyError } from '../../lib/api';

/**
 * Find a client by name, phone or email and pick them — instead of typing an
 * account ID that staff had no way to look up. `value` is the chosen account
 * ({ id, fullName, email, phone }) or null; `onChange` receives the same.
 */
export default function ClientPicker({ label = 'Client', value, onChange, required = false, hint }) {
  const inputId = useId();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const q = query.trim();
    if (value || q.length < 2) {
      setResults(null);
      setError('');
      return undefined;
    }
    let cancelled = false;
    setSearching(true);
    const timer = setTimeout(() => {
      api.admin.users
        .list({ q, size: 8 })
        .then((page) => !cancelled && setResults(page.content))
        .catch((err) => !cancelled && setError(friendlyError(err)))
        .finally(() => !cancelled && setSearching(false));
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, value]);

  if (value) {
    return (
      <div className="field">
        <span className="admin-field-label">
          {label} {required && <span className="req">*</span>}
        </span>
        <div className="admin-picked">
          <span className="admin-picked-avatar" aria-hidden="true">
            {(value.fullName || value.email || '?').charAt(0).toUpperCase()}
          </span>
          <span className="admin-picked-text">
            <strong>{value.fullName || 'No name'}</strong>
            <span>{[value.phone, value.email].filter(Boolean).join(' · ') || `Account #${value.id}`}</span>
          </span>
          <button type="button" className="admin-link-button" onClick={() => { onChange(null); setQuery(''); }}>
            Change
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="field admin-picker">
      <label htmlFor={inputId}>
        {label} {required && <span className="req">*</span>}
      </label>
      <div className="admin-search-input">
        <Icon name="search" size={17} />
        <input
          id={inputId}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, phone or email"
          autoComplete="off"
        />
      </div>
      {hint && <span className="field-hint">{hint}</span>}

      {(searching || error || results) && (
        <div className="admin-picker-results" role="listbox" aria-label={`${label} results`}>
          {searching && <p className="admin-picker-status">Searching…</p>}
          {!searching && error && <p className="admin-picker-status error">{error}</p>}
          {!searching && !error && results && results.length === 0 && (
            <p className="admin-picker-status">
              No account matches “{query.trim()}”. The client has to sign up on the website first.
            </p>
          )}
          {!searching &&
            !error &&
            results &&
            results.map((user) => (
              <button
                key={user.id}
                type="button"
                role="option"
                aria-selected="false"
                className="admin-picker-option"
                onClick={() => onChange(user)}
              >
                <span className="admin-picked-avatar" aria-hidden="true">
                  {(user.fullName || user.email || '?').charAt(0).toUpperCase()}
                </span>
                <span className="admin-picked-text">
                  <strong>{user.fullName || 'No name'}</strong>
                  <span>{[user.phone, user.email].filter(Boolean).join(' · ')}</span>
                </span>
                <span className="admin-picker-role">{String(user.role || '').toLowerCase()}</span>
              </button>
            ))}
        </div>
      )}
    </div>
  );
}
