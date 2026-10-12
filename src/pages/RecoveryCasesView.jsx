import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Card, Button, Badge, Skeleton, Input } from '../components/ui';

function formatMoney(value) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

export default function RecoveryCasesView() {
  const navigate = useNavigate();
  const [cases, setCases] = useState([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchId, setSearchId] = useState('');

  const loadCases = async (targetPage = 0, append = false) => {
    if (append) setLoadingMore(true);
    else setLoading(true);
    setError('');

    try {
      const { data } = await api.get('/api/recovery-cases', {
        params: { page: targetPage, size: 25 },
      });
      const list = Array.isArray(data) ? data : [];
      if (append) {
        setCases((prev) => [...prev, ...list]);
      } else {
        setCases(list);
      }
      setPage(targetPage);
      setHasMore(list.length === 25);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Unable to load recovery cases.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    loadCases(0, false);
  }, []);

  const filteredCases = cases.filter((c) => {
    if (statusFilter !== 'ALL' && c.status !== statusFilter) return false;
    if (searchId && !String(c.id).includes(searchId.trim())) return false;
    return true;
  });

  return (
    <div className="dashboard-view-root">
      <div className="welcome-headline-card">
        <div className="welcome-text-wrap">
          <Badge variant="neutral" size="sm">CASE MANAGEMENT</Badge>
          <h2>Recovery Cases Directory</h2>
          <p>
            Review all authorized cases, examine calculated risk tiers, monitor recovery attempts, 
            and trigger case repair or action plans.
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={() => loadCases(0, false)} disabled={loading}>
          ↻ Refresh Cases
        </Button>
      </div>

      {error && (
        <div className="dashboard-alert error" role="alert">
          <span>⚠️</span> <div>{error}</div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <Card className="table-card">
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ flex: 1, minWidth: '220px' }}>
            <input
              type="text"
              placeholder="Search by Case ID…"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              className="form-input"
              style={{ height: '38px' }}
            />
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {['ALL', 'OPEN', 'IN_PROGRESS', 'RECOVERED', 'ESCALATED', 'EXHAUSTED', 'STOPPED'].map((st) => (
              <Button
                key={st}
                variant={statusFilter === st ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setStatusFilter(st)}
              >
                {st.replace('_', ' ')}
              </Button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="skeleton-table">
            <Skeleton height="44px" width="100%" />
            <Skeleton height="44px" width="100%" />
            <Skeleton height="44px" width="100%" />
          </div>
        ) : filteredCases.length === 0 ? (
          <div className="empty-panel-state">
            <p>No recovery cases match your search criteria.</p>
          </div>
        ) : (
          <div className="responsive-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>CASE ID</th>
                  <th>LINKED PAYMENT</th>
                  <th>REVENUE AT RISK</th>
                  <th>CONFIRMED RECOVERED</th>
                  <th>RISK LEVEL</th>
                  <th>ATTEMPTS</th>
                  <th>STATUS</th>
                  <th>DETAILS</th>
                </tr>
              </thead>
              <tbody>
                {filteredCases.map((c) => (
                  <tr key={c.id}>
                    <td><strong>#{c.id}</strong></td>
                    <td>{c.paymentId ? `Payment #${c.paymentId}` : '—'}</td>
                    <td>{formatMoney(c.revenueAtRisk)}</td>
                    <td><strong className="text-emerald">{formatMoney(c.recoveredAmount)}</strong></td>
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
                    <td>{c.recoveryAttempts ?? 0} / 3</td>
                    <td>
                      <span className={`status-pill status-${(c.status || '').toLowerCase()}`}>
                        {c.status}
                      </span>
                    </td>
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

        {hasMore && (
          <div style={{ marginTop: '20px', textAlign: 'center' }}>
            <Button
              variant="secondary"
              size="sm"
              loading={loadingMore}
              disabled={loadingMore}
              onClick={() => loadCases(page + 1, true)}
            >
              Load More Cases
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
