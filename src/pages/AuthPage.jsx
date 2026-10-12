import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useTheme } from '../context/ThemeContext';
import { Button, Input, Card, Badge } from '../components/ui';
import './Auth.css';

export default function AuthPage({ mode, onSession }) {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const isSignup = mode === 'signup';

  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
  });

  const update = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setNotice('');

    if (isSignup) {
      if (!form.fullName.trim()) {
        setError('Please enter your full name.');
        return;
      }
      if (form.password !== form.confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
      if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{12,72}$/.test(form.password)) {
        setError('Password must be 12–72 characters and contain uppercase, lowercase, a number, and a special symbol.');
        return;
      }
    }

    setBusy(true);
    try {
      const endpoint = `/api/auth/${isSignup ? 'signup' : 'login'}`;
      const payload = isSignup
        ? {
            fullName: form.fullName.trim(),
            email: form.email.trim(),
            phoneNumber: form.phoneNumber.trim() || null,
            password: form.password,
          }
        : {
            email: form.email.trim(),
            password: form.password,
          };

      const { data } = await api.post(endpoint, payload);

      if (isSignup) {
        setNotice('Account registered successfully! Please sign in with your credentials.');
        setForm({ fullName: '', email: '', phoneNumber: '', password: '', confirmPassword: '' });
      } else {
        onSession(data);
      }
    } catch (err) {
      const msg =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Unable to process your request. Check your connection or credentials.';
      setError(msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-container">
      {/* Background glow orbs */}
      <div className="auth-glow glow-1" aria-hidden="true" />
      <div className="auth-glow glow-2" aria-hidden="true" />

      {/* Floating Theme Toggle */}
      <div className="auth-top-actions">
        <Link to="/" className="back-home-link">← Back to Overview</Link>
        <button 
          className="theme-toggle-btn" 
          onClick={toggleTheme} 
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
      </div>

      <div className="auth-split-layout">
        {/* Left Branding Showcase */}
        <div className="auth-brand-showcase">
          <Link to="/" className="auth-logo-badge">
            <span className="logo-symbol">R</span>
            <span className="logo-text">RecoverAI</span>
          </Link>

          <div className="brand-hero-content">
            <Badge variant="info">AUTONOMOUS REVENUE GOVERNANCE</Badge>
            <h1>Intelligent Recovery Workspace.</h1>
            <p>
              Access your real-time recovery dashboard, manage assigned payment cases, 
              and inspect AI recommendations with enterprise role isolation.
            </p>
          </div>

          <div className="security-assurance">
            <span className="shield-icon">🛡️</span>
            <div>
              <strong>Secure Architecture</strong>
              <p>BCrypt salted credentials, short-lived stateless JWT, and role-enforced endpoints.</p>
            </div>
          </div>
        </div>

        {/* Right Authentication Form */}
        <div className="auth-form-wrap">
          <Card glow className="auth-card-surface">
            <div className="card-header">
              <Badge variant="neutral" size="sm">
                {isSignup ? 'NEW USER REGISTRATION' : 'WORKSPACE LOGIN'}
              </Badge>
              <h2>{isSignup ? 'Create your account' : 'Welcome back'}</h2>
              <p className="card-subtext">
                {isSignup 
                  ? 'Join RecoverAI to manage payment recovery workflows.'
                  : 'Enter your verified credentials to access your console.'}
              </p>
            </div>

            {error && (
              <div className="auth-feedback-alert error" role="alert">
                <span>⚠️</span> {error}
              </div>
            )}
            {notice && (
              <div className="auth-feedback-alert success" role="status">
                <span>✓</span> {notice}
              </div>
            )}

            <form onSubmit={submit} className="auth-form-fields">
              {isSignup && (
                <Input
                  label="Full name"
                  name="fullName"
                  placeholder="e.g. Maya Sharma"
                  value={form.fullName}
                  onChange={update}
                  required
                  maxLength={120}
                  autoComplete="name"
                />
              )}

              <Input
                label="Email address"
                type="email"
                name="email"
                placeholder="name@company.com"
                value={form.email}
                onChange={update}
                required
                maxLength={254}
                autoComplete="email"
              />

              {isSignup && (
                <Input
                  label="Phone number (optional)"
                  type="tel"
                  name="phoneNumber"
                  placeholder="+91 98765 43210"
                  value={form.phoneNumber}
                  onChange={update}
                  maxLength={32}
                  autoComplete="tel"
                />
              )}

              <Input
                label="Password"
                type={visible ? 'text' : 'password'}
                name="password"
                placeholder="••••••••••••"
                value={form.password}
                onChange={update}
                required
                maxLength={72}
                autoComplete={isSignup ? 'new-password' : 'current-password'}
                hint={isSignup ? '12–72 chars, with upper, lower, number, and symbol.' : null}
                rightElement={
                  <button 
                    type="button" 
                    className="password-toggle-btn"
                    onClick={() => setVisible(!visible)}
                    aria-label={visible ? 'Hide password' : 'Show password'}
                  >
                    {visible ? 'Hide' : 'Show'}
                  </button>
                }
              />

              {isSignup && (
                <Input
                  label="Confirm password"
                  type={visible ? 'text' : 'password'}
                  name="confirmPassword"
                  placeholder="••••••••••••"
                  value={form.confirmPassword}
                  onChange={update}
                  required
                  maxLength={72}
                  autoComplete="new-password"
                />
              )}

              {!isSignup && (
                <div className="form-secondary-action">
                  <span className="future-feature-tag">Password recovery? Contact administrator</span>
                </div>
              )}

              <Button
                type="submit"
                variant="gradient"
                size="lg"
                loading={busy}
                disabled={busy}
                className="auth-submit-btn"
              >
                {busy ? 'Processing...' : isSignup ? 'Create Account' : 'Sign In'}
              </Button>

              <div className="auth-switch-prompt">
                {isSignup ? 'Already have an account?' : 'Need a workspace account?'}
                <button
                  type="button"
                  className="switch-link-btn"
                  onClick={() => navigate(isSignup ? '/login' : '/signup')}
                >
                  {isSignup ? 'Sign in' : 'Create an account'}
                </button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
