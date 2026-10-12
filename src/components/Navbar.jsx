function Navbar({ userName = 'Admin' }) {
  return (
    <header className="navbar">
      <div className="navbar-brand">
        <div className="brand-icon">R</div>

        <div>
          <h1>RecoverAI</h1>
          <span>AI-Powered Revenue Recovery</span>
        </div>
      </div>

      <div className="navbar-user">
        <div className="user-avatar">
          {userName.charAt(0).toUpperCase()}
        </div>

        <div>
          <strong>{userName}</strong>
          <small>Administrator</small>
        </div>
      </div>
    </header>
  )
}

export default Navbar