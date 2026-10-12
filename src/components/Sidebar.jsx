function Sidebar({ activePage, onPageChange }) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'D' },
    { id: 'payments', label: 'Payments', icon: 'P' },
    { id: 'cases', label: 'Recovery Cases', icon: 'C' },
    { id: 'actions', label: 'Recovery Actions', icon: 'A' },
    { id: 'ai', label: 'AI Assistant', icon: 'AI' },
    { id: 'audit', label: 'Audit & Reports', icon: 'R' },
  ]

  return (
    <aside className="sidebar">
      <div className="sidebar-title">
        <span>RecoverAI</span>
        <small>Revenue Recovery Platform</small>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`sidebar-item ${
              activePage === item.id ? 'active' : ''
            }`}
            onClick={() => onPageChange(item.id)}
          >
            <span className="sidebar-icon">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <span>AI-powered</span>
        <small>Controlled & Auditable</small>
      </div>
    </aside>
  )
}

export default Sidebar