import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import api from './services/api';
import { Card, Button, Badge, Skeleton, Modal } from './components/ui';

function formatMoney(value) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

export default function AdminUsers({ user }) {
  const { id: routeUserId } = useParams();
  const [users, setUsers] = useState([]);
  const [payments, setPayments] = useState([]);
  const [cases, setCases] = useState([]);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected detail modal/panel
  const [selectedUser, setSelectedUser] = useState(null);

  // Pagination states
  const [page, setPage] = useState({ users: 0, payments: 0, cases: 0 });
  const [hasMore, setHasMore] = useState({ users: false, payments: false, cases: false });
  const [loadingPage, setLoadingPage] = useState('');

  const showUserDetails = useCallback(async (userId) => {
    setError('');
    try {
      const { data } = await api.get(`/api/admin/users/${userId}`);
      setSelectedUser(data);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load user details.');
    }
  }, []);

  const loadData = useCallback(async (query = searchQuery) => {
    setLoading(true);
    setError('');
    try {
      const [uRes, pRes, cRes] = await Promise.all([
        api.get('/api/admin/users', { params: { page: 0, size: 25, search: query } }),
        api.get('/api/admin/payments', { params: { page: 0, size: 25 } }),
        api.get('/api/admin/cases', { params: { page: 0, size: 25 } }),
      ]);

      setUsers(uRes.data || []);
      setPayments(pRes.data || []);
      setCases(cRes.data || []);
      setPage({ users: 0, payments: 0, cases: 0 });
      setHasMore({
        users: (uRes.data || []).length === 25,
        payments: (pRes.data || []).length === 25,
        cases: (cRes.data || []).length === 25,
      });

      if (routeUserId) {
        showUserDetails(routeUserId);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Unable to load administrator data.');
    } finally {
      setLoading(false);
    }
  }, [routeUserId, searchQuery, showUserDetails]);

  useEffect(() => {
    loadData('');
  }, [loadData]);

  const handleSearch = (e) => {
    e.preventDefault();
    const q = searchInput.trim();
    setSearchQuery(q);
    loadData(q);
  };

  const toggleUserStatus = async (targetUser) => {
    setBusyId(targetUser.id);
    setError('');
    setNotice('');
    try {
      const { data } = await api.patch(`/api/admin/users/${targetUser.id}/status`, {
        enabled: !targetUser.enabled,
      });
      setUsers((prev) => prev.map((u) => (u.id === data.id ? data : u)));
      if (selectedUser?.id === data.id) setSelectedUser(data);
      setNotice(`User ${data.fullName} is now ${data.enabled ? 'Active' : 'Disabled'}.`);
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.detail || err.message || 'Status update failed.');
    } finally {
      setBusyId(null);
    }
  };

  const handleAssignPayment = async (paymentId, ownerUserId) => {
    setBusyId(`p-${paymentId}`);
    setError('');
    setNotice('');
    try {
      if (ownerUserId) {
        await api.patch(`/api/admin/payments/${paymentId}/owner/${ownerUserId}`);
        setNotice(`Payment #${paymentId} assigned to user #${ownerUserId}.`);
      } else {
        await api.delete(`/api/admin/payments/${paymentId}/owner`);
        setNotice(`Payment #${paymentId} unassigned.`);
      }
      setPayments((prev) =>
        prev.map((p) =>
          p.paymentId === paymentId ? { ...p, ownerUserId: ownerUserId ? Number(ownerUserId) : null } : p
        )
      );
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to assign payment.');
    } finally {
      setBusyId(null);
    }
  };

  const handleAssignCase = async (caseId, ownerUserId) => {
    setBusyId(`c-${caseId}`);
    setError('');
    setNotice('');
    try {
      if (ownerUserId) {
        await api.patch(`/api/admin/cases/${caseId}/owner/${ownerUserId}`);
        setNotice(`Case #${caseId} assigned to user #${ownerUserId}.`);
      } else {
        await api.delete(`/api/admin/cases/${caseId}/owner`);
        setNotice(`Case #${caseId} unassigned.`);
      }
      setCases((prev) =>
        prev.map((c) =>
          c.caseId === caseId ? { ...c, ownerUserId: ownerUserId ? Number(ownerUserId) : null } : c
        )
      );
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to assign case.');
    } finally {
      setBusyId(null);
    }
  };

  const loadMore = async (kind) => {
    setLoadingPage(kind);
    const nextPage = page[kind] + 1;
    const endpoint = {
      users: '/api/admin/users',
      payments: '/api/admin/payments',
      cases: '/api/admin/cases',
    }[kind];
    const params = { page: nextPage, size: 25 };
    if (kind === 'users' && searchQuery) params.search = searchQuery;

    try {
      const { data } = await api.get(endpoint, { params });
      const setter = { users: setUsers, payments: setPayments, cases: setCases }[kind];
      setter((prev) => [...prev, ...data]);
      setPage((prev) => ({ ...prev, [kind]: nextPage }));
      setHasMore((prev) => ({ ...prev, [kind]: (data || []).length === 25 }));
    } catch (err) {
      setError(err.response?.data?.message || err.message || `Failed to load more ${kind}.`);
    } finally {
      setLoadingPage('');
    }
  };

  return (
    <div className="dashboard-view-root">
      <div className="welcome-headline-card">
        <div className="welcome-text-wrap">
          <Badge variant="warning" size="sm">SECURITY & OPERATOR GOVERNANCE</Badge>
          <h2>User Directory & Assignment Management</h2>
          <p>
            Inspect registered accounts, activate or deactivate operators (with self-lockout prevention), 
            and assign failed payments or cases to active users.
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={() => loadData(searchQuery)} disabled={loading}>
          ↻ Refresh Directory
        </Button>
      </div>

      {error && (
        <div className="dashboard-alert error" role="alert">
          <span>⚠️</span> <div>{error}</div>
        </div>
      )}

      {notice && (
        <div className="dashboard-alert success" role="status">
          <span>✓</span> <div>{notice}</div>
          <button className="alert-close-btn" onClick={() => setNotice('')}>✕</button>
        </div>
      )}

      {/* User Search & Table */}
      <Card className="table-card">
        <div className="panel-header">
          <div>
            <h3>Registered Team Accounts</h3>
            <p>Authorization roles and assigned workloads</p>
          </div>
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: '8px' }}>
            <input
              type="search"
              placeholder="Search by name or email…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="form-input"
              style={{ width: '240px', height: '36px' }}
            />
            <Button type="submit" variant="secondary" size="sm" disabled={loading}>
              Search
            </Button>
          </form>
        </div>

        {loading ? (
          <div className="skeleton-table">
            <Skeleton height="40px" width="100%" />
            <Skeleton height="40px" width="100%" />
            <Skeleton height="40px" width="100%" />
          </div>
        ) : users.length === 0 ? (
          <p className="empty-panel-state">No users match your criteria.</p>
        ) : (
          <div className="responsive-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>OPERATOR</th>
                  <th>EMAIL</th>
                  <th>ROLE</th>
                  <th>STATUS</th>
                  <th>ASSIGNED PAYMENTS</th>
                  <th>ASSIGNED CASES</th>
                  <th>OPERATIONS</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td><strong>{u.fullName}</strong></td>
                    <td>{u.email}</td>
                    <td>
                      <Badge variant={u.role === 'ADMIN' ? 'warning' : 'neutral'}>
                        {u.role}
                      </Badge>
                    </td>
                    <td>
                      <span className={`status-pill ${u.enabled ? 'status-recovered' : 'status-stopped'}`}>
                        {u.enabled ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td>{u.assignedPaymentCount ?? 0}</td>
                    <td>{u.assignedCaseCount ?? 0}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => showUserDetails(u.id)}
                        >
                          Details
                        </Button>
                        <Button
                          variant={u.enabled ? 'danger' : 'secondary'}
                          size="sm"
                          disabled={busyId === u.id || (u.id === user?.id && u.enabled)}
                          onClick={() => toggleUserStatus(u)}
                        >
                          {busyId === u.id ? 'Saving…' : u.enabled ? 'Deactivate' : 'Activate'}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {hasMore.users && (
          <div style={{ marginTop: '16px', textAlign: 'center' }}>
            <Button
              variant="secondary"
              size="sm"
              loading={loadingPage === 'users'}
              disabled={loadingPage === 'users'}
              onClick={() => loadMore('users')}
            >
              Load More Users
            </Button>
          </div>
        )}
      </Card>

      {/* User Details Modal */}
      <Modal
        isOpen={Boolean(selectedUser)}
        onClose={() => setSelectedUser(null)}
        title={`User Details: ${selectedUser?.fullName}`}
      >
        {selectedUser && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
              <div>
                <span className="stat-label">USER ID</span>
                <div>#{selectedUser.id}</div>
              </div>
              <div>
                <span className="stat-label">EMAIL ADDRESS</span>
                <div>{selectedUser.email}</div>
              </div>
              <div>
                <span className="stat-label">PHONE NUMBER</span>
                <div>{selectedUser.phoneNumber || 'Not provided'}</div>
              </div>
              <div>
                <span className="stat-label">ROLE</span>
                <div><Badge variant={selectedUser.role === 'ADMIN' ? 'warning' : 'info'}>{selectedUser.role}</Badge></div>
              </div>
              <div>
                <span className="stat-label">STATUS</span>
                <div>{selectedUser.enabled ? 'Active' : 'Disabled'}</div>
              </div>
              <div>
                <span className="stat-label">REGISTERED DATE</span>
                <div>{selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleString() : 'N/A'}</div>
              </div>
              <div>
                <span className="stat-label">ASSIGNED PAYMENTS</span>
                <div>{selectedUser.assignedPaymentCount} payments</div>
              </div>
              <div>
                <span className="stat-label">ASSIGNED CASES</span>
                <div>{selectedUser.assignedCaseCount} cases</div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
              <Button variant="ghost" size="md" onClick={() => setSelectedUser(null)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Assignment Grid: Payments & Cases */}
      <div className="dashboard-tables-grid">
        {/* Assign Failed Payments */}
        <Card className="table-card">
          <div className="panel-header">
            <div>
              <h3>Assign Failed Payments</h3>
              <p>Allocate failed payments to active operators</p>
            </div>
          </div>

          <div className="responsive-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>PAYMENT</th>
                  <th>AMOUNT</th>
                  <th>ASSIGNED OPERATOR</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.paymentId}>
                    <td>
                      <strong>#{p.paymentId}</strong>
                      <small>{p.customerName || 'Customer'}</small>
                    </td>
                    <td>{formatMoney(p.amount)}</td>
                    <td>
                      <select
                        className="form-select"
                        style={{ height: '34px', fontSize: '12px' }}
                        value={p.ownerUserId || ''}
                        disabled={busyId === `p-${p.paymentId}` || p.status !== 'FAILED'}
                        onChange={(e) => handleAssignPayment(p.paymentId, e.target.value)}
                      >
                        <option value="">Unassigned</option>
                        {users.filter((u) => u.enabled).map((u) => (
                          <option key={u.id} value={u.id}>{u.fullName} ({u.role})</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {hasMore.payments && (
            <div style={{ marginTop: '16px', textAlign: 'center' }}>
              <Button
                variant="secondary"
                size="sm"
                loading={loadingPage === 'payments'}
                disabled={loadingPage === 'payments'}
                onClick={() => loadMore('payments')}
              >
                Load More Payments
              </Button>
            </div>
          )}
        </Card>

        {/* Assign Recovery Cases */}
        <Card className="table-card">
          <div className="panel-header">
            <div>
              <h3>Assign Recovery Cases</h3>
              <p>Assign historical or open cases to active operators</p>
            </div>
          </div>

          <div className="responsive-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>CASE</th>
                  <th>STATUS</th>
                  <th>ASSIGNED OPERATOR</th>
                </tr>
              </thead>
              <tbody>
                {cases.map((c) => (
                  <tr key={c.caseId}>
                    <td>
                      <strong>Case #{c.caseId}</strong>
                      <small>Payment #{c.paymentId}</small>
                    </td>
                    <td>
                      <span className={`status-pill status-${(c.status || '').toLowerCase()}`}>
                        {c.status}
                      </span>
                    </td>
                    <td>
                      <select
                        className="form-select"
                        style={{ height: '34px', fontSize: '12px' }}
                        value={c.ownerUserId || ''}
                        disabled={busyId === `c-${c.caseId}`}
                        onChange={(e) => handleAssignCase(c.caseId, e.target.value)}
                      >
                        <option value="">Unassigned</option>
                        {users.filter((u) => u.enabled).map((u) => (
                          <option key={u.id} value={u.id}>{u.fullName} ({u.role})</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {hasMore.cases && (
            <div style={{ marginTop: '16px', textAlign: 'center' }}>
              <Button
                variant="secondary"
                size="sm"
                loading={loadingPage === 'cases'}
                disabled={loadingPage === 'cases'}
                onClick={() => loadMore('cases')}
              >
                Load More Cases
              </Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
