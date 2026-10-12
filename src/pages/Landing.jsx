import React from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { Button, Card, Badge } from '../components/ui';
import './Landing.css';

export default function Landing() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="landing-page">
      {/* Background glow orbs */}
      <div className="landing-glow glow-top-left" aria-hidden="true" />
      <div className="landing-glow glow-top-right" aria-hidden="true" />

      {/* Navigation */}
      <header className="landing-nav">
        <div className="nav-container">
          <Link to="/" className="nav-logo">
            <span className="logo-symbol">R</span>
            <span className="logo-text">RecoverAI</span>
          </Link>

          <nav className="nav-links">
            <a href="#features">Features</a>
            <a href="#how-it-works">How It Works</a>
            <a href="#security">Security</a>
          </nav>

          <div className="nav-actions">
            <button 
              className="theme-toggle-btn" 
              onClick={toggleTheme} 
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
            <Link to="/login">
              <Button variant="ghost" size="sm">Sign In</Button>
            </Link>
            <Link to="/signup">
              <Button variant="primary" size="sm">Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-container">
          <div className="hero-badge-wrap">
            <Badge variant="info" size="sm">
              <span className="pulse-dot" />
              INTELLIGENT REVENUE RECOVERY PLATFORM
            </Badge>
          </div>
          
          <h1 className="hero-title">
            Transform Failed Transactions Into <span className="gradient-text">Recovered Revenue</span>
          </h1>

          <p className="hero-description">
            RecoverAI brings intelligent orchestration, rule-based recovery heuristics, 
            and complete workflow governance to failed payments—protecting customer relationships 
            and cash flow without manual chaos.
          </p>

          <div className="hero-cta-group">
            <Link to="/signup">
              <Button variant="gradient" size="lg">
                Get Started Free →
              </Button>
            </Link>
            <a href="#features">
              <Button variant="secondary" size="lg">
                Explore Features
              </Button>
            </a>
          </div>

          {/* Futuristic Platform Preview Card */}
          <div className="hero-preview-wrapper">
            <div className="preview-glass-card">
              <div className="preview-topbar">
                <div className="preview-dots">
                  <span /><span /><span />
                </div>
                <div className="preview-title">RecoverAI Intelligence Console</div>
                <div className="preview-status">
                  <span className="status-live" /> LIVE MONITORED
                </div>
              </div>
              
              <div className="preview-grid">
                <div className="preview-stat-card">
                  <span className="stat-label">REVENUE AT RISK</span>
                  <div className="stat-value">₹4,85,000</div>
                  <span className="stat-trend positive">Active Cases Monitored</span>
                </div>
                <div className="preview-stat-card">
                  <span className="stat-label">CONFIRMED RECOVERED</span>
                  <div className="stat-value text-emerald">₹3,42,000</div>
                  <span className="stat-trend positive">70.5% Recovery Rate</span>
                </div>
                <div className="preview-stat-card">
                  <span className="stat-label">HEURISTIC AI DIAGNOSIS</span>
                  <div className="stat-value text-indigo">Autonomous</div>
                  <span className="stat-trend">Max 3 Guarded Attempts</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="features-section">
        <div className="section-container">
          <div className="section-header">
            <Badge variant="neutral">CAPABILITIES</Badge>
            <h2>Precision engineered for payment resilience</h2>
            <p>Built with enterprise security boundaries, strict ownership policies, and automated safeguards.</p>
          </div>

          <div className="features-grid">
            <Card glow className="feature-card">
              <div className="feature-icon-box">▤</div>
              <h3>Recovery Case Governance</h3>
              <p>Each failed payment transitions into an auditable case with strict lifecycle tracking: Open, In Progress, Recovered, Escalated, or Exhausted.</p>
            </Card>

            <Card glow className="feature-card">
              <div className="feature-icon-box">↗</div>
              <h3>Guarded Action Workflows</h3>
              <p>Execute reminders, links, and retries with enforced 3-attempt limits. High-risk actions halt safely for human verification before proceeding.</p>
            </Card>

            <Card glow className="feature-card">
              <div className="feature-icon-box">✦</div>
              <h3>Intelligent AI Diagnostics</h3>
              <p>Automated heuristic engine analyzes failure codes, payment methods, and historical attempts to advise optimal recovery intervention.</p>
            </Card>

            <Card glow className="feature-card">
              <div className="feature-icon-box">🔒</div>
              <h3>Strict Data Ownership</h3>
              <p>Multi-tenant authorization ensures users only inspect and manage cases assigned directly to them, with zero cross-tenant leakage.</p>
            </Card>

            <Card glow className="feature-card">
              <div className="feature-icon-box">₹</div>
              <h3>Authoritative Collections</h3>
              <p>Revenue metrics reflect confirmed collection records only. No optimistic client claims or unverified assumptions.</p>
            </Card>

            <Card glow className="feature-card">
              <div className="feature-icon-box">⚡</div>
              <h3>Role-Based Access Control</h3>
              <p>Fine-grained administrative controls for assigning cases, managing user accounts, and monitoring portfolio-level health metrics.</p>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="workflow-section">
        <div className="section-container">
          <div className="section-header">
            <Badge variant="info">WORKFLOW</Badge>
            <h2>How RecoverAI Protects Your Cash Flow</h2>
            <p>From failed payment detection to confirmed bank collection in four structured steps.</p>
          </div>

          <div className="workflow-steps">
            <div className="step-card">
              <div className="step-num">01</div>
              <h4>Payment Failure Ingestion</h4>
              <p>Failed payment events are captured with failure reasons and customer context into the secure data layer.</p>
            </div>
            <div className="step-card">
              <div className="step-num">02</div>
              <h4>Ownership & Case Assignment</h4>
              <p>Recovery cases are created and securely mapped to authorized user workspaces or administrative queues.</p>
            </div>
            <div className="step-card">
              <div className="step-num">03</div>
              <h4>AI Diagnosis & Action Execution</h4>
              <p>Intelligent recommendation rules select the safest recovery path while enforcing the 3-attempt ceiling.</p>
            </div>
            <div className="step-card">
              <div className="step-num">04</div>
              <h4>Confirmed Collection Recording</h4>
              <p>Funds are accounted only upon confirmed settlement, updating case statuses to Recovered in real-time.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section id="security" className="security-section">
        <div className="section-container">
          <Card className="security-banner">
            <div className="security-content">
              <Badge variant="success">ENTERPRISE GRADE SECURITY</Badge>
              <h2>Security & Compliance Built In</h2>
              <p>
                RecoverAI utilizes BCrypt password hashing (cost factor 12), stateless signed JWT tokens, 
                scoped database transaction boundaries, strict CORS domain gating, and immutable audit logs.
              </p>
              <div className="security-tags">
                <span>✓ Stateless Signed Bearer Tokens</span>
                <span>✓ Server-Enforced Role Separation</span>
                <span>✓ Strict Record Ownership Isolation</span>
                <span>✓ BCrypt 12 Password Encryption</span>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-container">
          <div className="footer-brand">
            <div className="nav-logo">
              <span className="logo-symbol">R</span>
              <span className="logo-text">RecoverAI</span>
            </div>
            <p>Intelligent payment recovery engineered for modern financial infrastructure.</p>
          </div>

          <div className="footer-links">
            <div className="footer-col">
              <h5>Product</h5>
              <a href="#features">Features</a>
              <a href="#how-it-works">How It Works</a>
              <Link to="/login">Sign In</Link>
            </div>
            <div className="footer-col">
              <h5>Security</h5>
              <a href="#security">Architecture</a>
              <a href="#security">Ownership Model</a>
              <a href="#security">Audit Logs</a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© 2026 RecoverAI Platform. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
