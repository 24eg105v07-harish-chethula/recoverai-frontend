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

const ACTION_TYPES = [
  'RETRY_PAYMENT',
  'SEND_REMINDER',
  'GENERATE_PAYMENT_LINK',
  'ESCALATE_TO_HUMAN',
  'STOP',
];

export default function RecoveryActionsView() {
  const [actions, setActions] = useState([]);
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  // Creation form
  const [selectedCaseId, setSelectedCaseId] = useState('');
  const [selectedType, setSelectedType] = useState('SEND_REMINDER');
  const [creating, setCreating] = useState(false);
  const [busyActionId, setBusyActionId] = useState(null);

  const loadData = async (targetPage = 0, append = false) => {
    if (append) setLoadingMore(true);
    else setLoading(true);
    setError('');

    try {
      const [actionsRes, casesRes] = await Promise.all([
        api.get('/api/recovery-actions', { params: { page: targetPage, size: 25 } }),
        targetPage === 0 ? api.get('/api/recovery-cases', { params: { page: 0, size: 50 } }) : Promise.resolve({ data: [] }),
      ]);

      const list = Array.isArray(actionsRes.data) ? actionsRes.data : [];
      if (append) {
        setActions((prev) => [...prev, ...list]);
      } else {
        setActions(list);
      }
      setPage(targetPage);
      setHasMore(list.length === 25);

      if (targetPage === 0 && casesRes.data && casesRes.data.length > 0) {
        setCases(casesRes.data);
        setSelectedCaseId(String(casesRes.data[0].id));
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Unable to load recovery actions.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    loadData(0, false);
  }, []);

  const handleCreateAction = async (e) => {
    e.preventDefault();
    if (!selectedCaseId) return;
    setCreating(true);
    setError('');
    setNotice('');

    try {
      await api.post(`/api/recovery-actions/for-case/${selectedCaseId}?actionType=${selectedType}`);
      setNotice(`Action created successfully for Case #${selectedCaseId}.`);
      await loadData(0, false);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to create action.');
    } finally {
      setCreating(false);
    }
  };

  const handleRunAction = async (actionId, op) => {
    setBusyActionId(actionId);
    setError('');
    setNotice('');

    try {
      await api.put(`/api/recovery-actions/${actionId}/${op}`);
      setNotice(`Action #${actionId} updated (${op}).`);
      await loadData(0, false);
    } catch (err) {
      setError(err.response?.data?.message || err.message || `Failed to update action.`);
    } finally {
      setBusyActionId(null);
    }
  };

  return (
    <div className="dashboard-view-root">
      <div className="welcome-headline-card">
        <div className="welcome-text-wrap">
          <Badge variant="neutral" size="sm">WORKFLOW AUTOMATION</Badge>
          <h2>Recovery Actions Management</h2>
          <p>
            Monitor, approve, and execute recovery actions. The backend enforces a strict 3-attempt ceiling 
            and halts for human escalation where necessary.
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={() => loadData(0, false)} disabled={loading}>
          ↻ Refresh Actions
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

      {/* Action Creation Card */}
      <Card className="action-launch-panel">
        <div className="panel-header">
          <div>
            <h3>Schedule New Recovery Action</h3>
            <p>Select an authorized case to queue an action step</p>
          </div>
        </div>

        <form onSubmit={handleCreateAction} className="case-launch-form">
          <div className="form-select-group">
            <label htmlFor="case-select">Recovery Case</label>
            <select
              id="case-select"
              value={selectedCaseId}
              onChange={(e) => setSelectedCaseId(e.target.value)}
              disabled={creating || cases.length === 0}
              className="form-select"
            >
              {cases.length === 0 && <option value="">No cases available</option>}
              {cases.map((c) => (
                <option key={c.id} value={c.id}>
                  Case #{c.id} — {c.status} — Risk: {formatMoney(c.revenueAtRisk)} — Attempts: {c.recoveryAttempts}/3
                </option>
              ))}
            </select>
          </div>

          <div className="form-select-group" style={{ minWidth: '200px' }}>
            <label htmlFor="action-type-select">Action Type</label>
            <select
              id="action-type-select"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              disabled={creating}
              className="form-select"
            >
              {ACTION_TYPES.map((t) => (
                <option key={t} value={t}>{t.replaceAll('_', ' ')}</option>
              ))}
            </select>
          </div>

          <Button
            type="submit"
            variant="primary"
            loading={creating}
            disabled={creating || cases.length === 0}
          >
            + Create Action
          </Button>
        </form>
      </Card>

      {/* Action Log Table */}
      <Card className="table-card">
        <div className="panel-header">
          <div>
            <h3>All Recovery Actions</h3>
            <p>State machine: PENDING → APPROVED → EXECUTED → SUCCESS / FAILED</p>
          </div>
        </div>

        {loading ? (
          <div className="skeleton-table">
            <Skeleton height="44px" width="100%" />
            <Skeleton height="44px" width="100%" />
            <Skeleton height="44px" width="100%" />
          </div>
        ) : actions.length === 0 ? (
          <div className="empty-panel-state">
            <p>No recovery actions found.</p>
          </div>
        ) : (
          <div className="responsive-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ACTION ID</th>
                  <th>CASE</th>
                  <th>ACTION TYPE</th>
                  <th>ATTEMPT</th>
                  <th>STATUS</th>
                  <th>RESULT / MESSAGE</th>
                  <th>OPERATIONS</th>
                </tr>
              </thead>
              <tbody>
                {actions.map((act) => (
                  <tr key={act.id}>
                    <td><strong>#{act.id}</strong></td>
                    <td>
                      <Link to={`/recovery-cases/${act.recoveryCaseId}`}>
                        Case #{act.recoveryCaseId} →
                      </Link>
                    </td>
                    <td>{(act.actionType || '').replaceAll('_', ' ')}</td>
                    <td>{act.attemptNumber ?? 0}</td>
                    <td>
                      <Badge
                        variant={
                          act.status === 'SUCCESS' ? 'success' :
                          act.status === 'FAILED' ? 'danger' :
                          act.status === 'APPROVED' ? 'info' : 'warning'
                        }
                      >
                        {act.status}
                      </Badge>
                    </td>
                    <td><small>{act.result || '—'}</small></td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {act.status === 'PENDING' && (
                          <Button
                            variant="secondary"
                            size="sm"
                            disabled={busyActionId === act.id}
                            onClick={() => handleRunAction(act.id, 'approve')}
                          >
                            Approve
                          </Button>
                        )}
                        {act.status === 'APPROVED' && (
                          <Button
                            variant="primary"
                            size="sm"
                            disabled={busyActionId === act.id}
                            onClick={() => handleRunAction(act.id, 'execute')}
                          >
                            Execute
                          </Button>
                        )}
                        {act.status === 'EXECUTED' && (
                          <>
                            <Button
                              variant="secondary"
                              size="sm"
                              disabled={busyActionId === act.id}
                              onClick={() => handleRunAction(act.id, 'success')}
                            >
                              Success
                            </Button>
                            <Button
                              variant="danger"
                              size="sm"
                              disabled={busyActionId === act.id}
                              onClick={() => handleRunAction(act.id, 'failed')}
                            >
                              Failed
                            </Button>
                          </>
                        )}
                        {['SUCCESS', 'FAILED'].includes(act.status) && (
                          <small style={{ color: 'var(--text-muted)' }}>Done</small>
                        )}
                      </div>
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
              onClick={() => loadData(page + 1, true)}
            >
              Load More Actions
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
