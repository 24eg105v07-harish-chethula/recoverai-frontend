import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { Card, Button, Badge, Skeleton, Modal } from '../components/ui';

function formatMoney(value) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

const COMMON_FAILURE_REASONS = [
  'Insufficient funds in account',
  'Card declined by issuing bank',
  '3D Secure authentication failed or expired',
  'Card expired or invalid validity date',
  'Payment gateway timeout / Do Not Honor',
];

export default function PaymentsView({ user }) {
  const [payments, setPayments] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState('');
  const [creatingCaseId, setCreatingCaseId] = useState(null);
  const [notice, setNotice] = useState('');

  // Admin Ingest Payment Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [ingesting, setIngesting] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    customerName: '',
    customerEmail: '',
    amount: '',
    failureReason: COMMON_FAILURE_REASONS[0],
    assignedUserId: '',
  });

  const isAdmin = user?.role === 'ADMIN';

  const loadPayments = async (targetPage = 0, append = false) => {
    if (append) setLoadingMore(true);
    else setLoading(true);
    setError('');

    try {
      const endpoint = isAdmin ? '/api/admin/payments' : '/api/payments/owned-failed';
      const [paymentsRes, usersRes] = await Promise.all([
        api.get(endpoint, { params: { page: targetPage, size: 25 } }),
        isAdmin && targetPage === 0 ? api.get('/api/admin/users', { params: { page: 0, size: 50 } }) : Promise.resolve({ data: [] }),
      ]);

      const list = Array.isArray(paymentsRes.data) ? paymentsRes.data : [];
      if (append) {
        setPayments((prev) => [...prev, ...list]);
      } else {
        setPayments(list);
      }
      setPage(targetPage);
      setHasMore(list.length === 25);

      if (isAdmin && usersRes.data) {
        setUsersList(usersRes.data);
      }
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
      setNotice(`Recovery case initialized for Payment #${paymentId}! You can now inspect it under Recovery Cases.`);
      await loadPayments(0, false);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to initialize case.');
    } finally {
      setCreatingCaseId(null);
    }
  };

  const handleIngestPayment = async (e) => {
    e.preventDefault();
    setIngesting(true);
    setError('');
    setNotice('');

    try {
      // 1. Create Customer
      const customerRes = await api.post('/api/customers', {
        name: paymentForm.customerName.trim(),
        email: paymentForm.customerEmail.trim(),
      });
      const customerId = customerRes.data.id;

      // 2. Create Payment linked to customer
      const paymentRes = await api.post(`/api/payments?customerId=${customerId}`, {
        amount: Number(paymentForm.amount),
        status: 'FAILED',
        failureReason: paymentForm.failureReason,
        razorpayPaymentId: `sim_pay_${Date.now().toString().slice(-6)}`,
        razorpayOrderId: `sim_order_${Date.now().toString().slice(-6)}`,
      });
      const newPaymentId = paymentRes.data.id;

      // 3. Assign to user if chosen
      if (paymentForm.assignedUserId) {
        await api.patch(`/api/admin/payments/${newPaymentId}/owner/${paymentForm.assignedUserId}`);
      }

      setNotice(`Failed payment #${newPaymentId} successfully created for ${paymentForm.customerName}!`);
      setIsModalOpen(false);
      setPaymentForm({
        customerName: '',
        customerEmail: '',
        amount: '',
        failureReason: COMMON_FAILURE_REASONS[0],
        assignedUserId: '',
      });
      await loadPayments(0, false);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to record payment.');
    } finally {
      setIngesting(false);
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
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {isAdmin && (
            <Button variant="primary" size="sm" onClick={() => setIsModalOpen(true)}>
              + Ingest Failed Payment
            </Button>
          )}
          <Button variant="secondary" size="sm" onClick={() => loadPayments(0, false)} disabled={loading}>
            ↻ Refresh Payments
          </Button>
        </div>
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
            {isAdmin && (
              <div style={{ marginTop: '12px' }}>
                <Button variant="primary" size="sm" onClick={() => setIsModalOpen(true)}>
                  + Ingest Your First Failed Payment
                </Button>
              </div>
            )}
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
                  <th>ASSIGNMENT</th>
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
                      <td>
                        <div>{p.customerName || 'N/A'}</div>
                        <small style={{ color: 'var(--text-muted)' }}>{p.failureReason || ''}</small>
                      </td>
                      <td>
                        {p.ownerEmail ? (
                          <Badge variant="info">{p.ownerEmail}</Badge>
                        ) : (
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Unassigned</span>
                        )}
                      </td>
                      <td>
                        {p.status === 'FAILED' && (
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

      {/* Modal for Admin Ingesting a Failed Payment */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Ingest New Failed Payment"
      >
        <form onSubmit={handleIngestPayment} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            Record a failed customer transaction. You can optionally assign it directly to a team operator.
          </p>

          <div className="form-field">
            <label className="form-label">Customer Full Name</label>
            <input
              type="text"
              required
              className="form-input"
              placeholder="e.g. Ramesh Patel"
              value={paymentForm.customerName}
              onChange={(e) => setPaymentForm({ ...paymentForm, customerName: e.target.value })}
            />
          </div>

          <div className="form-field">
            <label className="form-label">Customer Email Address</label>
            <input
              type="email"
              required
              className="form-input"
              placeholder="e.g. ramesh@example.com"
              value={paymentForm.customerEmail}
              onChange={(e) => setPaymentForm({ ...paymentForm, customerEmail: e.target.value })}
            />
          </div>

          <div className="form-field">
            <label className="form-label">Amount (INR)</label>
            <input
              type="number"
              step="1"
              min="1"
              required
              className="form-input"
              placeholder="e.g. 7500"
              value={paymentForm.amount}
              onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
            />
          </div>

          <div className="form-field">
            <label className="form-label">Failure Reason</label>
            <select
              className="form-select"
              value={paymentForm.failureReason}
              onChange={(e) => setPaymentForm({ ...paymentForm, failureReason: e.target.value })}
            >
              {COMMON_FAILURE_REASONS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          {usersList.length > 0 && (
            <div className="form-field">
              <label className="form-label">Assign to Operator (Optional)</label>
              <select
                className="form-select"
                value={paymentForm.assignedUserId}
                onChange={(e) => setPaymentForm({ ...paymentForm, assignedUserId: e.target.value })}
              >
                <option value="">Leave Unassigned (Admin Queue)</option>
                {usersList.filter((u) => u.enabled).map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.fullName} ({u.role}) — {u.email}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
            <Button variant="ghost" size="md" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="md" loading={ingesting} disabled={ingesting}>
              Save & Ingest Payment
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
