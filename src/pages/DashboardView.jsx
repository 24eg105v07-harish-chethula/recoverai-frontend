import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { Card, Button, Badge, Skeleton } from '../components/ui';
import './DashboardView.css';

function formatMoney(value) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

export default function DashboardView({ user }) {
  const [stats, setStats] = useState(null);
  const [cases, setCases] = useState([]);
  const [actions, setActions] = useState([]);
  const [ownedFailedPayments, setOwnedFailedPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [creatingCase, setCreatingCase] = useState(false);
  const [selectedPaymentId, setSelectedPaymentId] = useState('');
  const [actionNotice, setActionNotice] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [statsRes, casesRes, actionsRes, paymentsRes] = await Promise.all([
        api.get('/api/dashboard/summary'),
        api.get('/api/recovery-cases', { params: { page: 0, size: 5 } }),
        api.get('/api/recovery-actions', { params: { page: 0, size: 5 } }),
        user?.role === 'USER' ? api.get('/api/payments/owned-failed', { params: { page: 0, size: 10 } }) : Promise.resolve({ data: [] }),
      ]);

      setStats(statsRes.data);
      setCases(casesRes.data || []);
      setActions(actionsRes.data || []);
      if (paymentsRes.data && paymentsRes.data.length > 0) {
        setOwnedFailedPayments(paymentsRes.data);
        setSelectedPaymentId(String(paymentsRes.data[0].id));
      } else {
        setOwnedFailedPayments([]);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Unable to connect to RecoverAI API.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleCreateCase = async (e) => {
    e.preventDefault();
    if (!selectedPaymentId) return;
    setCreatingCase(true);
    setActionNotice('');
    setError('');
    try {
      await api.post(`/api/recovery-cases/from-payment/${selectedPaymentId}`);
      setActionNotice('Recovery case successfully created and linked to your account.');
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to create recovery case.');
    } finally {
      setCreatingCase(false);
    }
  };

  return (
    <div className="dashboard-view-root">
      {/* Personalized Welcome Banner */}
      <div className="welcome-headline-card">
        <div className="welcome-text-wrap">
          <Badge variant="info" size="sm">LIVE RECOVERY WORKSPACE</Badge>
          <h2>Welcome back, {user?.fullName || 'Colleague'}</h2>
          <p>
            Here is your live recovery intelligence summary. Your workspace displays data authorized 
            for your account, with server-guarded limits and auditable status progression.
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={loadData} disabled={loading}>
          {loading ? 'Refreshing…' : '↻ Refresh Data'}
        </Button>
      </div>

      {error && (
        <div className="dashboard-alert error" role="alert">
          <span>⚠️</span> <div><strong>Error:</strong> {error}</div>
          <Button variant="ghost" size="sm" onClick={loadData}>Retry</Button>
        </div>
      )}

      {actionNotice && (
        <div className="dashboard-alert success" role="status">
          <span>✓</span> <div>{actionNotice}</div>
          <button className="alert-close-btn" onClick={() => setActionNotice('')}>✕</button>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="kpi-cards-grid">
        <Card glow className="kpi-card">
          <div className="kpi-top">
            <span className="kpi-label">TOTAL REVENUE AT RISK</span>
            <span className="kpi-icon icon-rose">₹</span>
          </div>
          {loading ? (
            <Skeleton height="36px" width="140px" />
          ) : (
            <div className="kpi-value text-rose">{formatMoney(stats?.totalRevenueAtRisk)}</div>
          )}
          <span className="kpi-subnote">Authorized cases requiring recovery</span>
        </Card>

        <Card glow className="kpi-card">
          <div className="kpi-top">
            <span className="kpi-label">CONFIRMED RECOVERED</span>
            <span className="kpi-icon icon-emerald">↗</span>
          </div>
          {loading ? (
            <Skeleton height="36px" width="140px" />
          ) : (
            <div className="kpi-value text-emerald">{formatMoney(stats?.totalRecoveredAmount)}</div>
          )}
          <span className="kpi-subnote">Authoritative recorded collections</span>
        </Card>

        <Card glow className="kpi-card">
          <div className="kpi-top">
            <span className="kpi-label">ACTIVE CASES</span>
            <span className="kpi-icon icon-blue">▤</span>
          </div>
          {loading ? (
            <Skeleton height="36px" width="80px" />
          ) : (
            <div className="kpi-value">{stats?.totalCases ?? 0}</div>
          )}
          <span className="kpi-subnote">{stats?.openCases ?? 0} open · {stats?.inProgressCases ?? 0} in progress</span>
        </Card>

        <Card glow className="kpi-card">
          <div className="kpi-top">
            <span className="kpi-label">OVERALL RECOVERY RATE</span>
            <span className="kpi-icon icon-cyan">%</span>
          </div>
          {loading ? (
            <Skeleton height="36px" width="80px" />
          ) : (
            <div className="kpi-value text-cyan">{stats?.recoveryRate ?? 0}%</div>
          )}
          <div className="mini-progress-track">
            <div 
              className="mini-progress-fill" 
              style={{ width: `${Math.min(100, Math.max(0, stats?.recoveryRate || 0))}%` }} 
            />
          </div>
        </Card>
      </div>

      {/* User Action Panel: Create Case from Assigned Payment */}
      {user?.role === 'USER' && (
        <Card className="action-launch-panel">
          <div className="panel-header">
            <div>
              <h3>Open New Recovery Case</h3>
              <p>Initialize a recovery case from failed payments assigned to your user account.</p>
            </div>
            <Link to="/payments">
              <Button variant="ghost" size="sm">View all assigned payments →</Button>
            </Link>
          </div>

          {ownedFailedPayments.length > 0 ? (
            <form onSubmit={handleCreateCase} className="case-launch-form">
              <div className="form-select-group">
                <label htmlFor="failed-payment-select">Assigned Failed Payment</label>
                <select
                  id="failed-payment-select"
                  value={selectedPaymentId}
                  onChange={(e) => setSelectedPaymentId(e.target.value)}
                  disabled={creatingCase}
                  className="form-select"
                >
                  {ownedFailedPayments.map((p) => (
                    <option key={p.id} value={p.id}>
                      Payment #{p.id} — {formatMoney(p.amount)} — Customer: {p.customerName || 'N/A'}
                    </option>
                  ))}
                </select>
              </div>
              <Button type="submit" variant="primary" loading={creatingCase} disabled={creatingCase}>
                {creatingCase ? 'Creating Case…' : '+ Initialize Recovery Case'}
              </Button>
            </form>
          ) : (
            <div className="empty-inline-state">
              <span>ℹ️</span> No unlinked failed payments currently assigned to your account.
            </div>
          )}
        </Card>
      )}

      {/* Detailed Tables Section */}
      <div className="dashboard-tables-grid">
        {/* Recent Cases */}
        <Card className="table-card">
          <div className="panel-header">
            <div>
              <h3>Recent Recovery Cases</h3>
              <p>Top active cases requiring monitored execution</p>
            </div>
            <Link to="/recovery-cases">
              <Button variant="ghost" size="sm">All Cases →</Button>
            </Link>
          </div>

          {loading ? (
            <div className="skeleton-table">
              <Skeleton height="40px" width="100%" />
              <Skeleton height="40px" width="100%" />
              <Skeleton height="40px" width="100%" />
            </div>
          ) : cases.length === 0 ? (
            <div className="empty-panel-state">
              <p>No recovery cases assigned yet.</p>
            </div>
          ) : (
            <div className="responsive-table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>CASE</th>
                    <th>AMOUNT AT RISK</th>
                    <th>RISK LEVEL</th>
                    <th>STATUS</th>
                    <th>ATTEMPTS</th>
                    <th>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {cases.map((c) => (
                    <tr key={c.id}>
                      <td>
                        <strong>Case #{c.id}</strong>
                        {c.paymentId && <small>Payment #{c.paymentId}</small>}
                      </td>
                      <td>{formatMoney(c.revenueAtRisk)}</td>
                      <td>
                        <Badge 
                          variant={
                            c.riskLevel === 'CRITICAL' ? 'danger' :
                            c.riskLevel === 'HIGH' ? 'warning' :
                            c.riskLevel === 'MEDIUM' ? 'info' : 'neutral'
                          }
                        >
                          {c.riskLevel || 'LOW'}
                        </Badge>
                      </td>
                      <td>
                        <span className={`status-pill status-${(c.status || '').toLowerCase()}`}>
                          {c.status}
                        </span>
                      </td>
                      <td>{c.recoveryAttempts ?? 0} / 3</td>
                      <td>
                        <Link to={`/recovery-cases/${c.id}`}>
                          <Button variant="ghost" size="sm">Inspect →</Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Recent Actions */}
        <Card className="table-card">
          <div className="panel-header">
            <div>
              <h3>Recent Actions</h3>
              <p>Execution log of reminders, links, and retries</p>
            </div>
            <Link to="/recovery-actions">
              <Button variant="ghost" size="sm">All Actions →</Button>
            </Link>
          </div>

          {loading ? (
            <div className="skeleton-table">
              <Skeleton height="40px" width="100%" />
              <Skeleton height="40px" width="100%" />
              <Skeleton height="40px" width="100%" />
            </div>
          ) : actions.length === 0 ? (
            <div className="empty-panel-state">
              <p>No recovery actions recorded yet.</p>
            </div>
          ) : (
            <div className="responsive-table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ACTION</th>
                    <th>CASE</th>
                    <th>TYPE</th>
                    <th>STATUS</th>
                    <th>ATTEMPT</th>
                  </tr>
                </thead>
                <tbody>
                  {actions.map((a) => (
                    <tr key={a.id}>
                      <td><strong>#{a.id}</strong></td>
                      <td>Case #{a.recoveryCaseId}</td>
                      <td>{(a.actionType || '').replaceAll('_', ' ')}</td>
                      <td>
                        <Badge 
                          variant={
                            a.status === 'SUCCESS' ? 'success' :
                            a.status === 'FAILED' ? 'danger' :
                            a.status === 'APPROVED' ? 'info' : 'warning'
                          }
                        >
                          {a.status}
                        </Badge>
                      </td>
                      <td>Attempt #{a.attemptNumber ?? 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
