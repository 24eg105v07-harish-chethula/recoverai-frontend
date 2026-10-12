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

export default function AdminOverview({ user }) {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [cases, setCases] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [statsRes, usersRes, casesRes, paymentsRes] = await Promise.all([
        api.get('/api/dashboard/summary'),
        api.get('/api/admin/users', { params: { page: 0, size: 5 } }),
        api.get('/api/admin/cases', { params: { page: 0, size: 5 } }),
        api.get('/api/admin/payments', { params: { page: 0, size: 5 } }),
      ]);

      setStats(statsRes.data);
      setUsers(usersRes.data || []);
      setCases(casesRes.data || []);
      setPayments(paymentsRes.data || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Unable to load admin overview.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="dashboard-view-root">
      <div className="welcome-headline-card">
        <div className="welcome-text-wrap">
          <Badge variant="warning" size="sm">ADMINISTRATOR CONTROL CENTRE</Badge>
          <h2>Platform System Administration</h2>
          <p>
            Portfolio-wide overview across all customer accounts, payments, recovery assignments, 
            and registered team members.
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={loadData} disabled={loading}>
          ↻ Refresh System Metrics
        </Button>
      </div>

      {error && (
        <div className="dashboard-alert error" role="alert">
          <span>⚠️</span> <div>{error}</div>
        </div>
      )}

      {/* Portfolio Metrics */}
      <div className="kpi-cards-grid">
        <Card glow className="kpi-card">
          <span className="kpi-label">TOTAL REVENUE AT RISK</span>
          <div className="kpi-value text-rose">{formatMoney(stats?.totalRevenueAtRisk)}</div>
          <span className="kpi-subnote">All unrecovered failed transactions</span>
        </Card>

        <Card glow className="kpi-card">
          <span className="kpi-label">CONFIRMED RECOVERED AMOUNT</span>
          <div className="kpi-value text-emerald">{formatMoney(stats?.totalRecoveredAmount)}</div>
          <span className="kpi-subnote">Authoritatively settled collection records</span>
        </Card>

        <Card glow className="kpi-card">
          <span className="kpi-label">OVERALL PORTFOLIO RECOVERY RATE</span>
          <div className="kpi-value text-cyan">{stats?.recoveryRate ?? 0}%</div>
          <div className="mini-progress-track">
            <div 
              className="mini-progress-fill" 
              style={{ width: `${Math.min(100, Math.max(0, stats?.recoveryRate || 0))}%` }} 
            />
          </div>
        </Card>

        <Card glow className="kpi-card">
          <span className="kpi-label">TOTAL RECOVERY CASES</span>
          <div className="kpi-value">{stats?.totalCases ?? 0}</div>
          <span className="kpi-subnote">{stats?.openCases ?? 0} open · {stats?.inProgressCases ?? 0} in progress</span>
        </Card>
      </div>

      {/* Quick Navigation Panels */}
      <div className="dashboard-tables-grid">
        <Card className="table-card">
          <div className="panel-header">
            <div>
              <h3>Recent User Accounts</h3>
              <p>Registered operators and account statuses</p>
            </div>
            <Link to="/admin/users">
              <Button variant="ghost" size="sm">Manage Users →</Button>
            </Link>
          </div>

          {loading ? (
            <div className="skeleton-table">
              <Skeleton height="36px" width="100%" />
              <Skeleton height="36px" width="100%" />
            </div>
          ) : users.length === 0 ? (
            <p className="empty-panel-state">No users registered.</p>
          ) : (
            <div className="responsive-table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>NAME</th>
                    <th>EMAIL</th>
                    <th>ROLE</th>
                    <th>STATUS</th>
                    <th>ASSIGNED CASES</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td><strong>{u.fullName}</strong></td>
                      <td>{u.email}</td>
                      <td><Badge variant={u.role === 'ADMIN' ? 'warning' : 'neutral'}>{u.role}</Badge></td>
                      <td>
                        <span className={`status-pill ${u.enabled ? 'status-recovered' : 'status-stopped'}`}>
                          {u.enabled ? 'Active' : 'Disabled'}
                        </span>
                      </td>
                      <td>{u.assignedCaseCount ?? 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card className="table-card">
          <div className="panel-header">
            <div>
              <h3>Recent System Payments</h3>
              <p>All recorded payments & assignment state</p>
            </div>
            <Link to="/admin/payments">
              <Button variant="ghost" size="sm">Manage Payments →</Button>
            </Link>
          </div>

          {loading ? (
            <div className="skeleton-table">
              <Skeleton height="36px" width="100%" />
              <Skeleton height="36px" width="100%" />
            </div>
          ) : payments.length === 0 ? (
            <p className="empty-panel-state">No payments found.</p>
          ) : (
            <div className="responsive-table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>PAYMENT</th>
                    <th>AMOUNT</th>
                    <th>STATUS</th>
                    <th>ASSIGNED OPERATOR</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => (
                    <tr key={p.paymentId}>
                      <td><strong>#{p.paymentId}</strong></td>
                      <td>{formatMoney(p.amount)}</td>
                      <td>
                        <span className={`status-pill status-${(p.status || '').toLowerCase()}`}>
                          {p.status}
                        </span>
                      </td>
                      <td>{p.ownerEmail || <span style={{ color: 'var(--text-muted)' }}>Unassigned</span>}</td>
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
