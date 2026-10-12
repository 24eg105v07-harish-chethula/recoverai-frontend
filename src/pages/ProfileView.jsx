import React from 'react';
import { Card, Badge, Button } from '../components/ui';

export default function ProfileView({ user, onLogout }) {
  return (
    <div className="dashboard-view-root">
      <div className="welcome-headline-card">
        <div className="welcome-text-wrap">
          <Badge variant="neutral" size="sm">ACCOUNT IDENTITY</Badge>
          <h2>Account Profile & Session Details</h2>
          <p>
            Your account is authenticated via stateless bearer JWT with cryptographically hashed credentials.
          </p>
        </div>
        <Button variant="danger" size="sm" onClick={onLogout}>
          Sign Out of Workspace
        </Button>
      </div>

      <div className="kpi-cards-grid">
        <Card className="kpi-card">
          <span className="kpi-label">FULL NAME</span>
          <div className="kpi-value" style={{ fontSize: '20px' }}>{user?.fullName || '—'}</div>
          <span className="kpi-subnote">Authenticated display identity</span>
        </Card>

        <Card className="kpi-card">
          <span className="kpi-label">EMAIL ADDRESS</span>
          <div className="kpi-value" style={{ fontSize: '20px' }}>{user?.email || '—'}</div>
          <span className="kpi-subnote">Primary workspace identifier</span>
        </Card>

        <Card className="kpi-card">
          <span className="kpi-label">ASSIGNED ROLE</span>
          <div style={{ marginTop: '6px' }}>
            <Badge variant={user?.role === 'ADMIN' ? 'warning' : 'info'} size="md">
              {user?.role}
            </Badge>
          </div>
          <span className="kpi-subnote">Server-authoritative authorization</span>
        </Card>

        <Card className="kpi-card">
          <span className="kpi-label">ACCOUNT STATUS</span>
          <div style={{ marginTop: '6px' }}>
            <Badge variant={user?.enabled ? 'success' : 'danger'} size="md">
              {user?.enabled ? 'Active Account' : 'Disabled'}
            </Badge>
          </div>
          <span className="kpi-subnote">Enforced on every API request</span>
        </Card>
      </div>

      <Card className="table-card">
        <div className="panel-header">
          <div>
            <h3>Security Architecture Details</h3>
            <p>Cryptographic standards and tenant protection parameters</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px', padding: '10px 0' }}>
          <div>
            <span className="stat-label">PASSWORD ENCRYPTION</span>
            <div style={{ fontSize: '14px', fontWeight: '600', marginTop: '4px' }}>
              BCrypt Hash (Work Factor 12)
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
              Password hashes are never transmitted to clients or logged.
            </p>
          </div>

          <div>
            <span className="stat-label">SESSION TOKEN</span>
            <div style={{ fontSize: '14px', fontWeight: '600', marginTop: '4px' }}>
              Stateless HMAC-SHA256 JWT
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
              Default 15-minute token expiry, cleared immediately on logout.
            </p>
          </div>

          <div>
            <span className="stat-label">DATA ACCESS CONTROL</span>
            <div style={{ fontSize: '14px', fontWeight: '600', marginTop: '4px' }}>
              Row-Level Owner Verification
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
              Backend services mandate user ownership before returning any records.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
