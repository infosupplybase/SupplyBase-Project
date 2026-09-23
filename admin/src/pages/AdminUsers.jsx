import { useCallback, useEffect, useState } from 'react';
import Icon from '../components/ui/Icon';
import StatusBadge from '../components/admin/StatusBadge';
import Pagination from '../components/admin/Pagination';
import Drawer from '../components/admin/Drawer';
import api, { friendlyError } from '../lib/api';
import { useAuth } from '../context/AuthContext';

const ROLES = ['CUSTOMER', 'PROFESSIONAL', 'ADMIN'];

const label = (value) =>
  String(value || '')
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

const toneForRole = (role) => {
  if (role === 'ADMIN') return 'accent';
  if (role === 'PROFESSIONAL') return 'success';
  return 'neutral';
};

/**
 * Every account on the platform — customers, professionals and admins.
 * Staff can search/filter the list and, from the drawer, change a user's
 * role or enable/disable their account. The signed-in admin's own row is
 * locked here so nobody demotes or disables themselves by accident.
 */
export default function AdminUsers() {
  const { user: currentUser } = useAuth();

  const [roleFilter, setRoleFilter] = useState('');
  const [qInput, setQInput] = useState('');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(0);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [selected, setSelected] = useState(null);
  const [roleForm, setRoleForm] = useState('');
  const [roleSaving, setRoleSaving] = useState(false);
  const [roleSaveError, setRoleSaveError] = useState('');
  const [statusSaving, setStatusSaving] = useState(false);
  const [statusError, setStatusError] = useState('');

  // Debounce the free-text box before it becomes a `q` query param.
  useEffect(() => {
    const timer = setTimeout(() => {
      setQ(qInput.trim());
      setPage(0);
    }, 300);
    return () => clearTimeout(timer);
  }, [qInput]);

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

  const closeDrawer = () => setSelected(null);

  const isSelf = Boolean(selected && currentUser && selected.id === currentUser.id);

  const handleRoleSave = async (e) => {
    e.preventDefault();
    if (isSelf) return;
    setRoleSaving(true);
    setRoleSaveError('');
    try {
      const updated = await api.admin.users.updateRole(selected.id, roleForm);
      setSelected(updated);
      load();
    } catch (err) {
      setRoleSaveError(friendlyError(err));
    } finally {
      setRoleSaving(false);
    }
  };

  const handleToggleStatus = async () => {
    if (isSelf) return;
    setStatusSaving(true);
    setStatusError('');
    try {
      const updated = await api.admin.users.updateStatus(selected.id, !selected.enabled);
      setSelected(updated);
      load();
    } catch (err) {
      setStatusError(friendlyError(err));
    } finally {
      setStatusSaving(false);
    }
  };

  return (
    <div>
      <div className="admin-header">
        <div>
          <h1>STAFF</h1>
          <p>Customers, professionals and admins — one account list.</p>
        </div>
      </div>

      <div className="admin-toolbar">
        <input
          type="text"
          className="admin-filter"
          value={qInput}
          onChange={(e) => setQInput(e.target.value)}
          placeholder="Search name, email or phone…"
          style={{ minWidth: 260 }}
        />
        <select
          className="admin-filter"
          value={roleFilter}
          onChange={(e) => {
            setRoleFilter(e.target.value);
            setPage(0);
          }}
        >
          <option value="">All roles</option>
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {label(r)}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div role="alert" className="alert alert-error">
          <Icon name="info" size={18} />
          <span>{error}</span>
        </div>
      )}

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Contact</th>
              <th>Role</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="admin-table-empty">
                  Loading…
                </td>
              </tr>
            ) : data && data.content.length ? (
              data.content.map((row) => (
                <tr key={row.id} className="admin-table-row" onClick={() => openRow(row)}>
                  <td>{row.fullName || '—'}</td>
                  <td>
                    {row.email || '—'}
                    <br />
                    <span className="admin-table-sub">{row.phone || '—'}</span>
                  </td>
                  <td>
                    <StatusBadge tone={toneForRole(row.role)}>{label(row.role)}</StatusBadge>
                  </td>
                  <td>
                    <StatusBadge tone={row.enabled ? 'success' : 'danger'}>
                      {row.enabled ? 'Enabled' : 'Disabled'}
                    </StatusBadge>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="admin-table-empty">
                  No accounts match.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {data && <Pagination page={data.number} totalPages={data.totalPages} onChange={setPage} />}

      <Drawer
        open={Boolean(selected)}
        onClose={closeDrawer}
        title={selected ? selected.fullName || selected.email : ''}
      >
        {selected && (
          <>
            <dl className="admin-detail-list">
              <div>
                <dt>Name</dt>
                <dd>{selected.fullName || '—'}</dd>
              </div>
              <div>
                <dt>Email</dt>
                <dd>{selected.email || '—'}</dd>
              </div>
              <div>
                <dt>Phone</dt>
                <dd>{selected.phone || '—'}</dd>
              </div>
            </dl>

            {isSelf && (
              <div role="alert" className="alert alert-info">
                <Icon name="info" size={18} />
                <span>
                  This is your own account — role and status can&rsquo;t be changed here, so you
                  can&rsquo;t lock yourself out.
                </span>
              </div>
            )}

            <form onSubmit={handleRoleSave} style={{ marginBottom: 20 }}>
              <div className="field" style={{ marginBottom: 12 }}>
                <label htmlFor="usr-role">Role</label>
                <select
                  id="usr-role"
                  value={roleForm}
                  onChange={(e) => setRoleForm(e.target.value)}
                  disabled={isSelf}
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {label(r)}
                    </option>
                  ))}
                </select>
              </div>

              {roleSaveError && (
                <div role="alert" className="alert alert-error" style={{ marginBottom: 12 }}>
                  <Icon name="info" size={18} />
                  <span>{roleSaveError}</span>
                </div>
              )}

              <button type="submit" className="btn btn-dark btn-block" disabled={roleSaving || isSelf}>
                {roleSaving ? 'SAVING…' : 'SAVE ROLE'}
              </button>
            </form>

            {statusError && (
              <div role="alert" className="alert alert-error" style={{ marginBottom: 12 }}>
                <Icon name="info" size={18} />
                <span>{statusError}</span>
              </div>
            )}

            <button
              type="button"
              className="btn btn-outline btn-block"
              onClick={handleToggleStatus}
              disabled={statusSaving || isSelf}
            >
              {statusSaving ? 'SAVING…' : selected.enabled ? 'DISABLE ACCOUNT' : 'ENABLE ACCOUNT'}
            </button>
          </>
        )}
      </Drawer>
    </div>
  );
}
