import React, { useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { Button } from './ui';
import './Layout.css';

export default function ShellLayout({ user, onLogout, children }) {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'ADMIN';
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="shell-root">
      {/* Top Header */}
      <header className="shell-topbar">
        <div className="topbar-left">
          <button 
            className="mobile-nav-toggle" 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
          >
            ☰
          </button>
          <Link to="/" className="shell-brand">
            <span className="logo-symbol">R</span>
            <span className="shell-title">RecoverAI</span>
          </Link>
          <div className="platform-tag">
            <span>{isAdmin ? 'ADMIN CONSOLE' : 'USER WORKSPACE'}</span>
          </div>
        </div>

        <div className="topbar-right">
          <button 
            className="theme-toggle-btn" 
            onClick={toggleTheme} 
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>

          <div className="user-profile-badge">
            <div className="profile-avatar">
              {user?.fullName?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="profile-info">
              <span className="profile-name">{user?.fullName || 'User'}</span>
              <span className="profile-role">{user?.role}</span>
            </div>
          </div>

          <Button variant="ghost" size="sm" onClick={onLogout} className="logout-btn">
            Sign out
          </Button>
        </div>
      </header>

      <div className="shell-body">
        {/* Sidebar Navigation */}
        <aside className={`shell-sidebar ${mobileMenuOpen ? 'mobile-open' : ''}`}>
          <div className="nav-group-label">OVERVIEW</div>
          <NavLink 
            to="/dashboard" 
            className={({ isActive }) => `sidebar-link ${isActive ? 'is-active' : ''}`}
            onClick={() => setMobileMenuOpen(false)}
          >
            <span className="sidebar-icon">▦</span>
            <span>Dashboard</span>
          </NavLink>

          <div className="nav-group-label">RECOVERY MANAGEMENT</div>
          <NavLink 
            to="/recovery-cases" 
            className={({ isActive }) => `sidebar-link ${isActive ? 'is-active' : ''}`}
            onClick={() => setMobileMenuOpen(false)}
          >
            <span className="sidebar-icon">▤</span>
            <span>Recovery Cases</span>
          </NavLink>
          <NavLink 
            to="/recovery-actions" 
            className={({ isActive }) => `sidebar-link ${isActive ? 'is-active' : ''}`}
            onClick={() => setMobileMenuOpen(false)}
          >
            <span className="sidebar-icon">↗</span>
            <span>Recovery Actions</span>
          </NavLink>
          <NavLink 
            to="/ai-recommendations" 
            className={({ isActive }) => `sidebar-link ${isActive ? 'is-active' : ''}`}
            onClick={() => setMobileMenuOpen(false)}
          >
            <span className="sidebar-icon">✦</span>
            <span>AI Recommendations</span>
          </NavLink>

          <div className="nav-group-label">PAYMENTS & PROFILE</div>
          <NavLink 
            to="/payments" 
            className={({ isActive }) => `sidebar-link ${isActive ? 'is-active' : ''}`}
            onClick={() => setMobileMenuOpen(false)}
          >
            <span className="sidebar-icon">₹</span>
            <span>Payments</span>
          </NavLink>
          <NavLink 
            to="/profile" 
            className={({ isActive }) => `sidebar-link ${isActive ? 'is-active' : ''}`}
            onClick={() => setMobileMenuOpen(false)}
          >
            <span className="sidebar-icon">👤</span>
            <span>Account Profile</span>
          </NavLink>

          {isAdmin && (
            <>
              <div className="nav-group-label admin-section-label">ADMINISTRATION</div>
              <NavLink 
                to="/admin" 
                end
                className={({ isActive }) => `sidebar-link ${isActive ? 'is-active' : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <span className="sidebar-icon">📊</span>
                <span>Admin Overview</span>
              </NavLink>
              <NavLink 
                to="/admin/users" 
                className={({ isActive }) => `sidebar-link ${isActive ? 'is-active' : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <span className="sidebar-icon">👥</span>
                <span>User Directory</span>
              </NavLink>
              <NavLink 
                to="/admin/payments" 
                className={({ isActive }) => `sidebar-link ${isActive ? 'is-active' : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <span className="sidebar-icon">💳</span>
                <span>Admin Payments</span>
              </NavLink>
              <NavLink 
                to="/admin/recovery-cases" 
                className={({ isActive }) => `sidebar-link ${isActive ? 'is-active' : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <span className="sidebar-icon">📑</span>
                <span>Admin Cases</span>
              </NavLink>
            </>
          )}

          <div className="sidebar-status-pill">
            <span className="live-dot" />
            <div className="status-text">
              <strong>Connected</strong>
              <small>Stateless Bearer JWT</small>
            </div>
          </div>
        </aside>

        {/* Main Content Viewport */}
        <main className="shell-main">
          {children}
        </main>
      </div>
    </div>
  );
}
