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

export default function AIRecommendationsView() {
  const [cases, setCases] = useState([]);
  const [selectedCaseId, setSelectedCaseId] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [loadingCases, setLoadingCases] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    const loadCases = async () => {
      setLoadingCases(true);
      try {
        const { data } = await api.get('/api/recovery-cases', { params: { page: 0, size: 50 } });
        const list = Array.isArray(data) ? data : [];
        setCases(list);
        if (list.length > 0) {
          setSelectedCaseId(String(list[0].id));
        }
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Unable to load cases.');
      } finally {
        setLoadingCases(false);
      }
    };
    loadCases();
  }, []);

  const handleRunAnalysis = async () => {
    if (!selectedCaseId) return;
    setAnalyzing(true);
    setAnalysis(null);
    setError('');
    setNotice('');

    try {
      const { data } = await api.post(`/api/ai-analysis/case/${selectedCaseId}`);
      setAnalysis(data);
      setNotice(`Analysis generated successfully for Case #${selectedCaseId}.`);
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Failed to analyze case.');
    } finally {
      setAnalyzing(false);
    }
  };

  const selectedCaseObj = cases.find((c) => String(c.id) === selectedCaseId);

  return (
    <div className="dashboard-view-root">
      <div className="welcome-headline-card">
        <div className="welcome-text-wrap">
          <Badge variant="info" size="sm">✦ INTELLIGENT HEURISTICS</Badge>
          <h2>AI Recovery Assistant & Diagnostics</h2>
          <p>
            Generate rule-based heuristic diagnoses for recovery cases. The engine evaluates 
            failure patterns, revenue magnitude, and prior attempt outcomes to advise safe next steps.
          </p>
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

      {/* Case Selector Card */}
      <Card className="action-launch-panel">
        <div className="panel-header">
          <div>
            <h3>Select Recovery Case for Diagnosis</h3>
            <p>Pick an authorized case to inspect its heuristic recommendation</p>
          </div>
        </div>

        {loadingCases ? (
          <Skeleton height="42px" width="100%" />
        ) : cases.length === 0 ? (
          <p className="empty-inline-state">No recovery cases available to analyze.</p>
        ) : (
          <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div className="form-select-group">
              <label htmlFor="ai-case-select">Choose Case</label>
              <select
                id="ai-case-select"
                value={selectedCaseId}
                onChange={(e) => {
                  setSelectedCaseId(e.target.value);
                  setAnalysis(null);
                  setNotice('');
                  setError('');
                }}
                disabled={analyzing}
                className="form-select"
              >
                {cases.map((c) => (
                  <option key={c.id} value={c.id}>
                    Case #{c.id} — Status: {c.status} — Risk: {formatMoney(c.revenueAtRisk)} — Attempts: {c.recoveryAttempts}/3
                  </option>
                ))}
              </select>
            </div>

            <Button
              variant="gradient"
              size="md"
              loading={analyzing}
              disabled={analyzing || !selectedCaseId}
              onClick={handleRunAnalysis}
            >
              ✦ Generate AI Diagnosis
            </Button>
          </div>
        )}
      </Card>

      {/* Selected Case Context */}
      {selectedCaseObj && (
        <div className="kpi-cards-grid">
          <Card className="kpi-card">
            <span className="kpi-label">CASE ID</span>
            <div className="kpi-value">#{selectedCaseObj.id}</div>
            <span className="kpi-subnote">Payment #{selectedCaseObj.paymentId || '—'}</span>
          </Card>
          <Card className="kpi-card">
            <span className="kpi-label">REVENUE AT RISK</span>
            <div className="kpi-value text-rose">{formatMoney(selectedCaseObj.revenueAtRisk)}</div>
            <span className="kpi-subnote">{formatMoney(selectedCaseObj.recoveredAmount)} confirmed recovered</span>
          </Card>
          <Card className="kpi-card">
            <span className="kpi-label">CALCULATED RISK LEVEL</span>
            <div style={{ marginTop: '4px' }}>
              <Badge 
                variant={
                  selectedCaseObj.riskLevel === 'CRITICAL' ? 'danger' :
                  selectedCaseObj.riskLevel === 'HIGH' ? 'warning' :
                  selectedCaseObj.riskLevel === 'MEDIUM' ? 'info' : 'neutral'
                }
                size="md"
              >
                {selectedCaseObj.riskLevel || 'LOW'}
              </Badge>
            </div>
            <span className="kpi-subnote">{selectedCaseObj.riskReason || 'Payment failure'}</span>
          </Card>
          <Card className="kpi-card">
            <span className="kpi-label">ATTEMPTS REMAINING</span>
            <div className="kpi-value text-indigo">
              {Math.max(0, 3 - (selectedCaseObj.recoveryAttempts ?? 0))} of 3
            </div>
            <span className="kpi-subnote">Ceiling guard active</span>
          </Card>
        </div>
      )}

      {/* Analysis Result Card */}
      {analysis && (
        <Card glow className="table-card" style={{ border: '1px solid var(--accent-indigo)' }}>
          <div className="panel-header">
            <div>
              <Badge variant="info">DIAGNOSTIC REPORT</Badge>
              <h3 style={{ fontSize: '20px', marginTop: '10px' }}>
                {analysis.diagnosis || 'Diagnosis Complete'}
              </h3>
              <p style={{ marginTop: '4px', color: 'var(--text-secondary)' }}>
                {analysis.reasoning || 'No details provided.'}
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span className="stat-label">CONFIDENCE RATING</span>
              <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--accent-cyan)' }}>
                {Math.round(Number(analysis.confidence || 0) * 100)}%
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', margin: '20px 0', padding: '16px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
            <div>
              <span className="stat-label">RECOMMENDED ACTION</span>
              <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)', marginTop: '4px' }}>
                {(analysis.recommendedAction || '').replaceAll('_', ' ')}
              </div>
            </div>
            <div>
              <span className="stat-label">MODEL ENGINE</span>
              <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                {analysis.modelName || 'Heuristic-Engine-v1'}
              </div>
            </div>
            <div>
              <span className="stat-label">GENERATED AT</span>
              <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                {analysis.createdAt ? new Date(analysis.createdAt).toLocaleString() : 'Just now'}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <Link to={`/recovery-cases/${selectedCaseId}`}>
              <Button variant="primary" size="md">
                View Case #{selectedCaseId} Details & History →
              </Button>
            </Link>
          </div>
        </Card>
      )}

      <Card className="table-card" style={{ opacity: 0.85 }}>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.6' }}>
          <strong>Governance Note:</strong> AI diagnostics provide human-in-the-loop decision support. 
          No recovery actions are scheduled or dispatched automatically without user or administrative authorization. 
          Recovered funds are accounted strictly upon verified collection records.
        </p>
      </Card>
    </div>
  );
}
