import React from 'react';

export function Button({ 
  children, 
  variant = 'primary', // 'primary' | 'secondary' | 'ghost' | 'danger' | 'gradient'
  size = 'md',        // 'sm' | 'md' | 'lg'
  disabled = false, 
  loading = false, 
  icon = null,
  onClick, 
  type = 'button',
  className = '',
  ...props 
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`btn btn-${variant} btn-${size} ${loading ? 'is-loading' : ''} ${className}`}
      {...props}
    >
      {loading && <span className="btn-spinner" aria-hidden="true" />}
      {!loading && icon && <span className="btn-icon">{icon}</span>}
      <span className="btn-text">{children}</span>
    </button>
  );
}

export function Card({ children, className = '', glow = false, ...props }) {
  return (
    <div className={`card ${glow ? 'card-glow' : ''} ${className}`} {...props}>
      {children}
    </div>
  );
}

export function Badge({ children, variant = 'neutral', size = 'sm', className = '' }) {
  return (
    <span className={`badge badge-${variant} badge-${size} ${className}`}>
      {children}
    </span>
  );
}

export function Input({ 
  label, 
  error, 
  hint, 
  id, 
  className = '', 
  rightElement,
  ...props 
}) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
  return (
    <div className={`form-field ${error ? 'has-error' : ''} ${className}`}>
      {label && <label htmlFor={inputId} className="form-label">{label}</label>}
      <div className="input-wrapper">
        <input id={inputId} className="form-input" {...props} />
        {rightElement && <div className="input-right-element">{rightElement}</div>}
      </div>
      {error && <p className="form-error" role="alert">{error}</p>}
      {!error && hint && <p className="form-hint">{hint}</p>}
    </div>
  );
}

export function Skeleton({ width, height, borderRadius = 'var(--radius-md)', className = '' }) {
  return (
    <div 
      className={`skeleton ${className}`} 
      style={{ width, height, borderRadius }} 
      aria-hidden="true"
    />
  );
}

export function Modal({ isOpen, onClose, title, children, maxWidth = '540px' }) {
  if (!isOpen) return null;
  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div 
        className="modal-surface" 
        style={{ maxWidth }} 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h3 className="modal-title">{title}</h3>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close dialog">✕</button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}
