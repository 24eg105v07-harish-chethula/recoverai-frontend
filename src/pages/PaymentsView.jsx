import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { Card, Button, Badge, Skeleton } from '../components/ui';

function formatMoney(value) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

export default function PaymentsView({ user }) {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState('');
  const [creatingCaseId, setCreatingCaseId] = useState(null);
  const [notice, setNotice] = useState('');

  const isAdmin = user?.role === 'ADMIN';

  const loadPayments = async (targetPage = 0, append = false) => {
    if (append) setLoadingMore(true);
    else setLoading(true);
    setError('');

    try {
      const endpoint = isAdmin ? '/api/admin/payments' : '/api/payments/owned-failed';
      const { data } = await api.get(endpoint, {
        params: { page: targetPage, size: 25 },
      });
      const list = Array.isArray(data) ? data : [];
      if (append) {
        setPayments((prev) => [...prev, ...list]);
      } else {
        setPayments(list);
      }
      setPage(targetPage);
      setHasMore(list.length === 25);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Unable to load payments.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    loadPayments(0, false);
  }, [user]);

  const handleCreateCase = async (paymentId) => {
    setCreatingCaseId(paymentId);
    setError('');
    setNotice('');
    try {
      await api.post(`/api/recovery-cases/from-payment/${paymentId}`);
      setNotice(`Recovery case initialized for Payment #${paymentId}!`);
      await loadPayments(0, false);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to initialize case.');
    } finally {
      setCreatingCaseId(null);
    }
  };

  return (
    <div className="dashboard-view-root">
      <div className="welcome-headline-card">
        <div className="welcome-text-wrap">
          <Badge variant="neutral" size="sm">TRANSACTION STREAM</Badge>
          <h2>{isAdmin ? 'All Managed Payments' : 'Assigned Failed Payments'}</h2>
          <p>
            {isAdmin 
              ? 'Administrator directory of customer payment transactions and recovery assignments.'
              : 'Failed payment transactions assigned to your account. Open a recovery case to begin guided resolution.'}
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={() => loadPayments(0, false)} disabled={loading}>
          ↻ Refresh Payments
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

      <Card className="table-card">
        <div className="panel-header">
          <div>
            <h3>Payment Records</h3>
            <p>Authoritative financial records stored in PostgreSQL</p>
          </div>
        </div>

        {loading ? (
          <div className="skeleton-table">
            <Skeleton height="44px" width="100%" />
            <Skeleton height="44px" width="100%" />
            <Skeleton height="44px" width="100%" />
          </div>
        ) : payments.length === 0 ? (
          <div className="empty-panel-state">
            <p>No payment records found.</p>
          </div>
        ) : (
          <div className="responsive-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>PAYMENT ID</th>
                  <th>AMOUNT</th>
                  <th>STATUS</th>
                  <th>CUSTOMER</th>
                  <th>CREATED AT</th>
                  <th>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => {
                  const pid = p.paymentId || p.id;
                  return (
                    <tr key={pid}>
                      <td><strong>#{pid}</strong></td>
                      <td><strong>{formatMoney(p.amount)}</strong></td>
                      <td>
                        <span className={`status-pill status-${(p.status || '').toLowerCase()}`}>
                          {p.status}
                        </span>
                      </td>
                      <td>{p.customerName || 'N/A'}</td>
                      <td>{p.createdAt ? new Date(p.createdAt).toLocaleDateString() : '—'}</td>
                      <td>
                        {user?.role === 'USER' && p.status === 'FAILED' && (
                          <Button
                            variant="primary"
                            size="sm"
                            loading={creatingCaseId === pid}
                            disabled={creatingCaseId === pid}
                            onClick={() => handleCreateCase(pid)}
                          >
                            + Open Case
                          </Button>
                        )}
                        {isAdmin && (
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                            {p.ownerEmail ? `Assigned: ${p.ownerEmail}` : 'Unassigned'}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {hasMore && (
          <div style={{ marginTop: '20px', textAlign: 'center' }}>
            <Button
              variant="secondary"
              size="sm"
              loading={loadingMore}
              disabled={loadingMore}
              onClick={() => loadPayments(page + 1, true)}
            >
              Load More Payments
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
