import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../components/ui/Icon';
import PageHeader from '../components/admin/PageHeader';
import DataTable from '../components/admin/DataTable';
import StatusBadge from '../components/admin/StatusBadge';
import Pagination from '../components/admin/Pagination';
import Drawer from '../components/admin/Drawer';
import { ErrorBanner, TableEmpty, TableLoading } from '../components/admin/TableStates';
import rowProps from '../components/admin/rowProps';
import { useToast } from '../components/admin/Toast';
import { useAuth } from '../context/AuthContext';
import useQueryParam, { usePageParam } from '../hooks/useQueryParam';
import api, { friendlyError } from '../lib/api';
import { label } from '../lib/format';

const ROLES = [
  { value: 'CUSTOMER', text: 'Customers', help: 'Books services and follows their own bookings.' },
  { value: 'PROFESSIONAL', text: 'Partners', help: 'Works assigned jobs on the partner portal.' },
  { value: 'ADMIN', text: 'Admins', help: 'Full access to this console.' },
];

const toneForRole = (role) => {
  if (role === 'ADMIN') return 'warning';
  if (role === 'PROFESSIONAL') return 'accent';
  return 'neutral';
};

/**
 * Every account on the platform — customers, partners and admins. Staff can
 * search, change a role, or disable an account. The signed-in admin's own
 * account is locked here so nobody demotes or disables themselves by accident.
 */
export default function AdminUsers() {
  const { user: currentUser } = useAuth();
  const { notify } = useToast();

  const [roleFilter, setRoleFilter] = useQueryParam('role');
  const [q, setQ] = useQueryParam('q');
  const [page, setPage] = usePageParam();
  const [qInput, setQInput] = useState(q);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [selected, setSelected] = useState(null);
  const [roleForm, setRoleForm] = useState('');
  const [roleSaving, setRoleSaving] = useState(false);
  const [roleSaveError, setRoleSaveError] = useState('');
  const [statusSaving, setStatusSaving] = useState(false);
  const [statusError, setStatusError] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      if (qInput.trim() !== q) setQ(qInput.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [qInput, q, setQ]);

  const load = useCallback(() => {
    setLoading(true);
    setError('');
    api.admin.users
      .list({ role: roleFilter, q, page })
      .then(setData)
      .catch((err) => setError(friendlyError(err)))
      .finally(() => setLoading(false));
  }, [roleFilter, q, page]);

  useEffect(() => {
    load();
  }, [load]);

  const openRow = (row) => {
    setSelected(row);
    setRoleForm(row.role);
    setRoleSaveError('');
    setStatusError('');
  };

  const isSelf = Boolean(selected && currentUser && selected.id === currentUser.id);

  const handleRoleSave = async (e) => {
    e.preventDefault();
    if (isSelf || roleForm === selected.role) return;
    if (roleForm === 'ADMIN' && !window.confirm(`Give ${selected.fullName || selected.email} full admin access to this console?`)) {
      return;
    }
    setRoleSaving(true);
    setRoleSaveError('');
    try {
      const updated = await api.admin.users.updateRole(selected.id, roleForm);
      setSelected(updated);
      notify(`${updated.fullName || updated.email} is now ${label(updated.role).toLowerCase()}`);
      load();
    } catch (err) {
      setRoleSaveError(friendlyError(err));
    } finally {
      setRoleSaving(false);
    }
  };

  const handleToggleStatus = async () => {
    if (isSelf) return;
    const disabling = selected.enabled;
    if (disabling && !window.confirm(`Disable ${selected.fullName || selected.email}? They will not be able to sign in until you enable the account again.`)) {
      return;
    }
    setStatusSaving(true);
    setStatusError('');
    try {
      const updated = await api.admin.users.updateStatus(selected.id, !selected.enabled);
      setSelected(updated);
      notify(`Account ${updated.enabled ? 'enabled' : 'disabled'}`);
      load();
    } catch (err) {
      setStatusError(friendlyError(err));
    } finally {
      setStatusSaving(false);
    }
  };

  const tabs = [{ value: '', text: 'Everyone' }, ...ROLES];

  return (
    <div>
      <PageHeader
        icon="users"
        title="Users"
        subtitle="Every account on Supplybase — customers, partners and admins. Search for someone, change what they can do, or disable an account."
      />

      <div className="admin-toolbar">
        <div className="admin-tabs" role="tablist" aria-label="Role">
          {tabs.map((t) => (
            <button
              key={t.value || 'all'}
              type="button"
              role="tab"
              aria-selected={roleFilter === t.value}
              className={`admin-tab ${roleFilter === t.value ? 'active' : ''}`}
              onClick={() => setRoleFilter(t.value)}
            >
              {t.text}
            </button>
          ))}
        </div>
        <span className="admin-toolbar-spacer" />
        <div className="admin-search-input">
          <Icon name="search" size={17} />
          <input
            type="search"
            value={qInput}
            onChange={(e) => setQInput(e.target.value)}
            placeholder="Search name, email or phone"
            aria-label="Search accounts"
          />
        </div>
      </div>

      <ErrorBanner onRetry={load}>{error}</ErrorBanner>

      <DataTable label="Accounts">
          <thead>
            <tr>
              <th>Name</th>
              <th>Contact</th>
              <th>City</th>
              <th>Role</th>
              <th>Account</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <TableLoading columns={5} />
            ) : data && data.content.length ? (
              data.content.map((row) => (
                <tr key={row.id} {...rowProps(() => openRow(row), `Open account ${row.fullName || row.email}`)}>
                  <td>
                    <span className="admin-cell-main">{row.fullName || '—'}</span>
                    <span className="admin-table-sub">
                      <span className="admin-id">#{row.id}</span>
                      {currentUser && row.id === currentUser.id ? ' · you' : ''}
                    </span>
                  </td>
                  <td>
                    {row.email || '—'}
                    <span className="admin-table-sub">{row.phone || 'No phone'}</span>
                  </td>
                  <td>{row.city || '—'}</td>
                  <td>
                    <StatusBadge tone={toneForRole(row.role)}>{row.role === 'PROFESSIONAL' ? 'Partner' : label(row.role)}</StatusBadge>
                  </td>
                  <td>
                    <StatusBadge tone={row.enabled ? 'success' : 'danger'}>{row.enabled ? 'Active' : 'Disabled'}</StatusBadge>
                  </td>
                </tr>
              ))
            ) : (
              <TableEmpty columns={5} icon="users" title="No accounts match">
                {q || roleFilter ? 'Try a different search or role.' : 'Accounts appear here as people sign up.'}
              </TableEmpty>
            )}
          </tbody>
      </DataTable>

      <Pagination data={data} onChange={setPage} />

      <Drawer open={Boolean(selected)} onClose={() => setSelected(null)} title={selected ? selected.fullName || selected.email : ''}>
        {selected && (
          <>
            <div className="admin-modal-top">
              <StatusBadge tone={toneForRole(selected.role)}>
                {selected.role === 'PROFESSIONAL' ? 'Partner' : label(selected.role)}
              </StatusBadge>
              <StatusBadge tone={selected.enabled ? 'success' : 'danger'}>{selected.enabled ? 'Active' : 'Disabled'}</StatusBadge>
              <span className="admin-id">Account #{selected.id}</span>
            </div>

            <dl className="admin-detail-list">
              <div>
                <dt>Email</dt>
                <dd>
                  {selected.email || '—'}
                  {selected.email && !selected.emailVerified && <span className="admin-table-sub">Not verified yet</span>}
                </dd>
              </div>
              <div>
                <dt>Phone</dt>
                <dd>{selected.phone || '—'}</dd>
              </div>
              <div>
                <dt>Address</dt>
                <dd>
                  {[selected.addressLine1, selected.addressLine2, selected.landmark, selected.city, selected.pinCode]
                    .filter(Boolean)
                    .join(', ') || '—'}
                </dd>
              </div>
              <div>
                <dt>Sign-in</dt>
                <dd>{selected.hasPassword ? 'Password' : 'Google / phone only'}</dd>
              </div>
            </dl>

            {isSelf && (
              <div role="alert" className="alert alert-info">
                <Icon name="info" size={18} />
                <span>This is your own account — its role and status are locked here so you cannot lock yourself out.</span>
              </div>
            )}

            <section className="admin-form-section">
              <h3 className="admin-form-section-title">
                <Icon name="shield" size={16} />
                What they can do
              </h3>
              <form onSubmit={handleRoleSave}>
                <div className="field" style={{ marginBottom: 12 }}>
                  <label htmlFor="usr-role">Role</label>
                  <select id="usr-role" value={roleForm} onChange={(e) => setRoleForm(e.target.value)} disabled={isSelf}>
                    {ROLES.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.value === 'PROFESSIONAL' ? 'Partner' : label(r.value)} — {r.help}
                      </option>
                    ))}
                  </select>
                  {roleForm === 'PROFESSIONAL' && selected.role !== 'PROFESSIONAL' && (
                    <span className="field-hint">
                      To add a partner properly, have them apply on the partner portal and approve them on the{' '}
                      <Link to="/partners">Partners page</Link> — that also records their trade and areas.
                    </span>
                  )}
                </div>

                {roleSaveError && (
                  <div role="alert" className="alert alert-error">
                    <Icon name="alert" size={18} />
                    <span>{roleSaveError}</span>
                  </div>
                )}

                <button type="submit" className="btn btn-dark btn-block" disabled={roleSaving || isSelf || roleForm === selected.role}>
                  {roleSaving ? 'SAVING…' : 'SAVE ROLE'}
                </button>
              </form>
            </section>

            <section className="admin-form-section">
              <h3 className="admin-form-section-title">
                <Icon name="lock" size={16} />
                Account access
              </h3>
              <p className="admin-form-hint">
                {selected.enabled
                  ? 'Disabling stops this person signing in. Nothing is deleted, and you can enable them again.'
                  : 'This account cannot sign in. Enable it to give access back.'}
              </p>

              {statusError && (
                <div role="alert" className="alert alert-error">
                  <Icon name="alert" size={18} />
                  <span>{statusError}</span>
                </div>
              )}

              <button
                type="button"
                className={`btn btn-block ${selected.enabled ? 'btn-danger' : 'btn-primary'}`}
                onClick={handleToggleStatus}
                disabled={statusSaving || isSelf}
              >
                <Icon name={selected.enabled ? 'lock' : 'check-circle'} size={16} />
                {statusSaving ? 'SAVING…' : selected.enabled ? 'DISABLE ACCOUNT' : 'ENABLE ACCOUNT'}
              </button>
            </section>
          </>
        )}
      </Drawer>
    </div>
  );
}
