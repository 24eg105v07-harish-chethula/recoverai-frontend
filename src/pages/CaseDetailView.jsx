import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { Card, Button, Badge, Skeleton, Modal } from '../components/ui';

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

export default function CaseDetailView() {
  const { id } = useParams();

  const [caseData, setCaseData] = useState(null);
  const [actions, setActions] = useState([]);
  const [collections, setCollections] = useState([]);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  // Action creation
  const [selectedActionType, setSelectedActionType] = useState('SEND_REMINDER');
  const [creatingAction, setCreatingAction] = useState(false);

  // AI analysis
  const [analyzing, setAnalyzing] = useState(false);

  // Repair
  const [repairing, setRepairing] = useState(false);

  // Collection confirmation modal
  const [isCollectionModalOpen, setIsCollectionModalOpen] = useState(false);
  const [collectionForm, setCollectionForm] = useState({ amount: '', referenceCode: '', note: '' });
  const [confirmingCollection, setConfirmingCollection] = useState(false);

  const loadCaseDetails = React.useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [caseRes, actionsRes, collectionsRes] = await Promise.all([
        api.get(`/api/recovery-cases/${id}`),
        api.get(`/api/recovery-actions/for-case/${id}`),
        api.get(`/api/recovery-collections/case/${id}`).catch(() => ({ data: [] })),
      ]);

      setCaseData(caseRes.data);
      setActions(actionsRes.data || []);
      setCollections(collectionsRes.data || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Unable to load case details.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadCaseDetails();
  }, [loadCaseDetails]);

  const handleCreateAction = async (e) => {
    e.preventDefault();
    setCreatingAction(true);
    setError('');
    setNotice('');
    try {
      await api.post(`/api/recovery-actions/for-case/${id}?actionType=${selectedActionType}`);
      setNotice(`Recovery action (${selectedActionType.replace('_', ' ')}) created successfully.`);
      await loadCaseDetails();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to create action.');
    } finally {
      setCreatingAction(false);
    }
  };

  const handleRunAction = async (actionId, op) => {
    setError('');
    setNotice('');
    try {
      await api.put(`/api/recovery-actions/${actionId}/${op}`);
      setNotice(`Action #${actionId} updated (${op}).`);
      await loadCaseDetails();
    } catch (err) {
      setError(err.response?.data?.message || err.message || `Failed to update action #${actionId}.`);
    }
  };

  const handleRepair = async () => {
    setRepairing(true);
    setError('');
    setNotice('');
    try {
      const { data } = await api.put(`/api/recovery-cases/${id}/repair`);
      setCaseData(data);
      setNotice('Case state synchronized with confirmed collections.');
      await loadCaseDetails();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to repair case.');
    } finally {
      setRepairing(false);
    }
  };

  const handleAnalyze = async () => {
    setAnalyzing(true);
    setError('');
    setNotice('');
    try {
      const { data } = await api.post(`/api/ai-analysis/case/${id}`);
      setAiAnalysis(data);
      setNotice('AI heuristic diagnostics generated.');
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Failed to analyze case.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleConfirmCollection = async (e) => {
    e.preventDefault();
    setConfirmingCollection(true);
    setError('');
    setNotice('');
    try {
      await api.post('/api/recovery-collections/confirm', null, {
        params: {
          caseId: id,
          amount: collectionForm.amount,
          referenceCode: collectionForm.referenceCode,
          note: collectionForm.note || undefined,
        },
      });
      setNotice('Collection confirmed and recorded successfully! Case status updated.');
      setIsCollectionModalOpen(false);
      setCollectionForm({ amount: '', referenceCode: '', note: '' });
      await loadCaseDetails();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to record collection.');
    } finally {
      setConfirmingCollection(false);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-view-root">
        <Skeleton height="80px" width="100%" />
        <Skeleton height="300px" width="100%" />
      </div>
    );
  }

  if (!caseData && error) {
    return (
      <div className="dashboard-view-root">
        <div className="dashboard-alert error">
          <span>⚠️</span> <div>{error}</div>
          <Link to="/recovery-cases"><Button variant="ghost" size="sm">Back to cases</Button></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-view-root">
      {/* Top Banner */}
      <div className="welcome-headline-card">
        <div className="welcome-text-wrap">
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
            <Link to="/recovery-cases" style={{ fontSize: '13px', color: 'var(--text-muted)' }}>← Cases Directory</Link>
            <span style={{ color: 'var(--text-muted)' }}>/</span>
            <Badge variant="info">CASE #{caseData?.id}</Badge>
          </div>
          <h2>Recovery Case #{caseData?.id} Details</h2>
          <p>
            Status: <strong>{caseData?.status}</strong> · Revenue at Risk: <strong>{formatMoney(caseData?.revenueAtRisk)}</strong> · Recovered: <strong>{formatMoney(caseData?.recoveredAmount)}</strong>
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <Button variant="secondary" size="sm" onClick={handleRepair} loading={repairing}>
            ↻ Sync Collections (Repair)
          </Button>
          <Button variant="gradient" size="sm" onClick={handleAnalyze} loading={analyzing}>
            ✦ Run AI Diagnosis
          </Button>
          <Button variant="primary" size="sm" onClick={() => setIsCollectionModalOpen(true)}>
            + Record Collection
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

      {/* Case Details Cards */}
      <div className="kpi-cards-grid">
        <Card className="kpi-card">
          <span className="kpi-label">LINKED PAYMENT</span>
          <div className="kpi-value" style={{ fontSize: '20px' }}>
            {caseData?.paymentId ? `#${caseData.paymentId}` : 'None'}
          </div>
          <span className="kpi-subnote">Original failed transaction</span>
        </Card>

        <Card className="kpi-card">
          <span className="kpi-label">RISK PROFILE</span>
          <div style={{ marginTop: '6px' }}>
            <Badge 
              variant={
                caseData?.riskLevel === 'CRITICAL' ? 'danger' :
                caseData?.riskLevel === 'HIGH' ? 'warning' :
                caseData?.riskLevel === 'MEDIUM' ? 'info' : 'neutral'
              }
              size="md"
            >
              {caseData?.riskLevel || 'LOW'} RISK
            </Badge>
          </div>
          <span className="kpi-subnote">{caseData?.riskReason || 'No risk reason noted.'}</span>
        </Card>

        <Card className="kpi-card">
          <span className="kpi-label">ATTEMPT COUNTER</span>
          <div className="kpi-value text-indigo">
            {caseData?.recoveryAttempts ?? 0} / 3
          </div>
          <span className="kpi-subnote">Guarded ceiling enforced by backend</span>
        </Card>

        <Card className="kpi-card">
          <span className="kpi-label">CURRENT STATUS</span>
          <div style={{ marginTop: '6px' }}>
            <span className={`status-pill status-${(caseData?.status || '').toLowerCase()}`}>
              {caseData?.status}
            </span>
          </div>
          <span className="kpi-subnote">Updated {new Date(caseData?.updatedAt || caseData?.createdAt).toLocaleString()}</span>
        </Card>
      </div>

      {/* AI Recommendation Spotlight */}
      {aiAnalysis && (
        <Card glow className="action-launch-panel" style={{ borderColor: 'var(--accent-indigo)' }}>
          <div className="panel-header">
            <div>
              <Badge variant="info">AI HEURISTIC RECOMMENDATION</Badge>
              <h3 style={{ marginTop: '8px' }}>{aiAnalysis.diagnosis || 'Heuristic Diagnostic'}</h3>
              <p style={{ marginTop: '4px' }}>{aiAnalysis.reasoning}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span className="stat-label">CONFIDENCE</span>
              <div style={{ fontSize: '20px', fontWeight: '800', color: 'var(--accent-cyan)' }}>
                {Math.round(Number(aiAnalysis.confidence || 0) * 100)}%
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginTop: '12px', flexWrap: 'wrap' }}>
            <div>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>RECOMMENDED ACTION:</span>{' '}
              <strong>{(aiAnalysis.recommendedAction || '').replaceAll('_', ' ')}</strong>
            </div>
            <div>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>ENGINE:</span>{' '}
              <span>{aiAnalysis.modelName || 'Heuristic-Engine-v1'}</span>
            </div>
          </div>
        </Card>
      )}

      {/* Trigger Recovery Action Form */}
      <Card className="action-launch-panel">
        <div className="panel-header">
          <div>
            <h3>Schedule Recovery Action</h3>
            <p>Execute an intervention step against this case within the 3-attempt limit.</p>
          </div>
        </div>

        <form onSubmit={handleCreateAction} className="case-launch-form">
          <div className="form-select-group">
            <label htmlFor="action-type-select">Action Type</label>
            <select
              id="action-type-select"
              value={selectedActionType}
              onChange={(e) => setSelectedActionType(e.target.value)}
              disabled={creatingAction || caseData?.recoveryAttempts >= 3}
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
            loading={creatingAction}
            disabled={creatingAction || ['RECOVERED', 'STOPPED', 'ESCALATED', 'EXHAUSTED'].includes(caseData?.status)}
          >
            + Create Action Step
          </Button>
        </form>
        {caseData?.recoveryAttempts >= 3 && (
          <p style={{ fontSize: '12px', color: 'var(--accent-rose)', marginTop: '8px' }}>
            ⚠️ This case has exhausted the maximum 3 recovery attempts. Human review is required.
          </p>
        )}
      </Card>

      {/* Action History Table */}
      <Card className="table-card">
        <div className="panel-header">
          <div>
            <h3>Action History ({actions.length})</h3>
            <p>Lifecycle state machine: PENDING → APPROVED → EXECUTED → SUCCESS / FAILED</p>
          </div>
        </div>

        {actions.length === 0 ? (
          <div className="empty-panel-state">
            <p>No actions have been scheduled for this case yet.</p>
          </div>
        ) : (
          <div className="responsive-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ACTION ID</th>
                  <th>TYPE</th>
                  <th>ATTEMPT</th>
                  <th>STATUS</th>
                  <th>RESULT / NOTE</th>
                  <th>OPERATIONS</th>
                </tr>
              </thead>
              <tbody>
                {actions.map((act) => (
                  <tr key={act.id}>
                    <td><strong>#{act.id}</strong></td>
                    <td>{(act.actionType || '').replaceAll('_', ' ')}</td>
                    <td>#{act.attemptNumber ?? 0}</td>
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
                          <Button variant="secondary" size="sm" onClick={() => handleRunAction(act.id, 'approve')}>
                            Approve
                          </Button>
                        )}
                        {act.status === 'APPROVED' && (
                          <Button variant="primary" size="sm" onClick={() => handleRunAction(act.id, 'execute')}>
                            Execute
                          </Button>
                        )}
                        {act.status === 'EXECUTED' && (
                          <>
                            <Button variant="secondary" size="sm" onClick={() => handleRunAction(act.id, 'success')}>
                              Mark Success
                            </Button>
                            <Button variant="danger" size="sm" onClick={() => handleRunAction(act.id, 'failed')}>
                              Mark Failed
                            </Button>
                          </>
                        )}
                        {['SUCCESS', 'FAILED'].includes(act.status) && (
                          <small style={{ color: 'var(--text-muted)' }}>Finalized</small>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Confirmed Collections Table */}
      <Card className="table-card">
        <div className="panel-header">
          <div>
            <h3>Confirmed Collection Records ({collections.length})</h3>
            <p>Authoritative verified recovery settlements for Case #{id}</p>
          </div>
        </div>

        {collections.length === 0 ? (
          <div className="empty-panel-state">
            <p>No confirmed collections recorded for this case yet.</p>
          </div>
        ) : (
          <div className="responsive-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>COLLECTION ID</th>
                  <th>AMOUNT</th>
                  <th>REFERENCE CODE</th>
                  <th>CONFIRMED AT</th>
                  <th>NOTE</th>
                </tr>
              </thead>
              <tbody>
                {collections.map((col) => (
                  <tr key={col.id}>
                    <td><strong>#{col.id}</strong></td>
                    <td><strong className="text-emerald">{formatMoney(col.amount)}</strong></td>
                    <td><code>{col.referenceCode}</code></td>
                    <td>{new Date(col.confirmedAt).toLocaleString()}</td>
                    <td>{col.note || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Modal for Recording Collections */}
      <Modal
        isOpen={isCollectionModalOpen}
        onClose={() => setIsCollectionModalOpen(false)}
        title={`Record Confirmed Collection for Case #${id}`}
      >
        <form onSubmit={handleConfirmCollection} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            Only authoritative, verified settlement transactions should be confirmed here. 
            This will add to the recovered amount and update the case status.
          </p>

          <div className="form-field">
            <label className="form-label">Confirmed Amount (INR)</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              required
              className="form-input"
              placeholder="e.g. 5000"
              value={collectionForm.amount}
              onChange={(e) => setCollectionForm({ ...collectionForm, amount: e.target.value })}
            />
          </div>

          <div className="form-field">
            <label className="form-label">Unique Bank / Gateway Reference Code</label>
            <input
              type="text"
              required
              className="form-input"
              placeholder="e.g. UTR-98234-AX"
              value={collectionForm.referenceCode}
              onChange={(e) => setCollectionForm({ ...collectionForm, referenceCode: e.target.value })}
            />
          </div>

          <div className="form-field">
            <label className="form-label">Settlement Note (Optional)</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Settled via RTGS"
              value={collectionForm.note}
              onChange={(e) => setCollectionForm({ ...collectionForm, note: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
            <Button variant="ghost" size="md" onClick={() => setIsCollectionModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="md" loading={confirmingCollection} disabled={confirmingCollection}>
              Confirm & Save Collection
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
