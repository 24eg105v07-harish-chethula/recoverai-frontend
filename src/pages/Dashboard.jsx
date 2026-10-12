
import { useEffect, useState } from 'react'
import api from '../services/api'

const money = (value) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(value ?? 0))

function Dashboard() {
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchDashboardSummary = async () => {
    try {
      const response = await api.get('/api/dashboard/summary')
      setSummary(response.data)
    } catch (err) {
      console.error('Dashboard API error:', err)
      setError('Unable to load dashboard data. Check your backend connection.')
    } finally {
      setLoading(false)
    }
  }

  const retryDashboardSummary = () => {
    setError('')
    setLoading(true)
    fetchDashboardSummary()
  }

  useEffect(() => {
    api.get('/api/dashboard/summary')
      .then((response) => setSummary(response.data))
      .catch((err) => {
        console.error('Dashboard API error:', err)
        setError('Unable to load dashboard data. Check your backend connection.')
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <section className="page-section dashboard-loading">
        <div className="loading-orb" />
        <h2>Preparing your dashboard</h2>
        <p>Loading the latest recovery metrics...</p>
      </section>
    )
  }

  if (error) {
    return (
      <section className="page-section">
        <div className="dashboard-error">
          <span>!</span>
          <div>
            <h3>Dashboard unavailable</h3>
            <p>{error}</p>
          </div>
          <button onClick={retryDashboardSummary}>Try again</button>
        </div>
      </section>
    )
  }

  const recoveryRate = Math.min(
    100,
    Math.max(0, Number(summary.recoveryRate ?? 0))
  )

  const cards = [
    {
      label: 'Revenue at risk',
      value: money(summary.totalRevenueAtRisk),
      icon: '₹',
      color: 'purple',
      note: 'Amount requiring recovery',
    },
    {
      label: 'Amount recovered',
      value: money(summary.totalRecoveredAmount),
      icon: '↗',
      color: 'green',
      note: 'Confirmed collections recorded',
    },
    {
      label: 'Open cases',
      value: summary.openCases ?? 0,
      icon: '◷',
      color: 'orange',
      note: 'Cases awaiting resolution',
    },
    {
      label: 'Recovery rate',
      value: `${recoveryRate.toLocaleString('en-IN', {
        maximumFractionDigits: 1,
      })}%`,
      icon: '%',
      color: 'blue',
      note: 'Recovered amount vs revenue at risk',
    },
  ]

  const caseMetrics = [
    ['Total cases', summary.totalCases],
    ['In progress', summary.inProgressCases],
    ['Recovered', summary.recoveredCases],
    ['Escalated', summary.escalatedCases],
    ['Exhausted', summary.exhaustedCases],
    ['Stopped', summary.stoppedCases],
  ]

  const actionMetrics = [
    ['Total actions', summary.totalActions],
    ['Pending approval', summary.pendingActions],
    ['Approved', summary.approvedActions],
    ['Executed', summary.executedActions],
    ['Successful actions', summary.successfulActions],
    ['Failed actions', summary.failedActions],
  ]

  return (
    <section className="page-section premium-dashboard">
      <header className="dashboard-heading">
        <div>
          <div className="dashboard-eyebrow">
            <span className="eyebrow-dot" />
            RECOVERAI INTELLIGENCE
          </div>
          <h1>Recovery overview<span>.</span></h1>
          <p>Monitor at-risk revenue, recovery performance, and collection activity.</p>
        </div>

        <button
          className="dashboard-refresh"
          onClick={retryDashboardSummary}
        >
          <span>↻</span> Refresh data
        </button>
      </header>

      <div className="dashboard-welcome">
        <div className="welcome-copy">
          <span className="welcome-label">YOUR RECOVERY COMMAND CENTRE</span>
          <h2>Turn payment failures into opportunities.</h2>
          <p>
            Track recovery cases and actions in one place, with metrics
            connected to your live backend.
          </p>
        </div>
        <div className="welcome-art" aria-hidden="true">
          <div className="art-ring art-ring-one" />
          <div className="art-ring art-ring-two" />
          <div className="art-core">R</div>
          <span className="art-spark spark-one">✦</span>
          <span className="art-spark spark-two">↗</span>
        </div>
      </div>

      <div className="dashboard-section-heading">
        <div>
          <h2>Key performance indicators</h2>
          <p>A snapshot of your current recovery portfolio</p>
        </div>
        <span className="live-indicator"><i /> LIVE DATA</span>
      </div>

      <div className="premium-stats-grid">
        {cards.map((card) => (
          <article className="premium-stat-card" key={card.label}>
            <div className="stat-topline">
              <span className={`premium-stat-icon ${card.color}`}>
                {card.icon}
              </span>
              <span className="stat-menu-dot">•••</span>
            </div>
            <p className="premium-stat-label">{card.label}</p>
            <strong className="premium-stat-value">{card.value}</strong>
            <div className="premium-stat-footer">
              <span className={`stat-footer-mark ${card.color}`}>●</span>
              {card.note}
            </div>
          </article>
        ))}
      </div>

      <div className="premium-dashboard-grid">
        <article className="premium-panel performance-panel">
          <div className="premium-panel-heading">
            <div>
              <span className="panel-kicker">PERFORMANCE</span>
              <h3>Recovery progress</h3>
              <p>Confirmed collection amount against revenue at risk</p>
            </div>
            <span className="panel-icon">↗</span>
          </div>

          <div className="progress-summary">
            <div>
              <strong>{recoveryRate.toLocaleString('en-IN', {
                maximumFractionDigits: 1,
              })}%</strong>
              <span>Overall recovery rate</span>
            </div>
            <span className="progress-caption">{money(summary.totalRecoveredAmount)} recovered</span>
          </div>

          <div
            className="premium-progress-track"
            role="progressbar"
            aria-label="Recovery rate"
            aria-valuenow={recoveryRate}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div style={{ width: `${recoveryRate}%` }} />
          </div>

          <div className="progress-legend">
            <span><i className="legend-green" /> Recovered</span>
            <span><i className="legend-muted" /> Remaining at risk</span>
          </div>

          <div className="performance-bottom">
            <div>
              <span>Total cases</span>
              <strong>{summary.totalCases ?? 0}</strong>
            </div>
            <div>
              <span>Open cases</span>
              <strong>{summary.openCases ?? 0}</strong>
            </div>
            <div>
              <span>In progress</span>
              <strong>{summary.inProgressCases ?? 0}</strong>
            </div>
          </div>
        </article>

        <article className="premium-panel">
          <div className="premium-panel-heading">
            <div>
              <span className="panel-kicker">CASE MANAGEMENT</span>
              <h3>Recovery cases</h3>
              <p>Current case status breakdown</p>
            </div>
            <span className="panel-icon panel-icon-purple">▤</span>
          </div>

          <div className="premium-metric-list">
            {caseMetrics.map(([label, value]) => (
              <div className="premium-metric-row" key={label}>
                <span>{label}</span>
                <strong>{value ?? 0}</strong>
              </div>
            ))}
          </div>
        </article>

        <article className="premium-panel actions-panel">
          <div className="premium-panel-heading">
            <div>
              <span className="panel-kicker">WORKFLOW ACTIVITY</span>
              <h3>Recovery actions</h3>
              <p>Action statuses reported by the backend</p>
            </div>
            <span className="panel-icon panel-icon-orange">↗</span>
          </div>

          <div className="action-total">
            <div>
              <span>Total actions</span>
              <strong>{summary.totalActions ?? 0}</strong>
            </div>
            <span className="action-total-label">Recorded</span>
          </div>

          <div className="premium-metric-list">
            {actionMetrics.slice(1).map(([label, value]) => (
              <div className="premium-metric-row" key={label}>
                <span>{label}</span>
                <strong>{value ?? 0}</strong>
              </div>
            ))}
          </div>

          <p className="dashboard-footnote">
            Successful actions do not necessarily mean money was recovered.
            Only recorded collections count toward recovered revenue.
          </p>
        </article>
      </div>

      <footer className="dashboard-footer">
        <span><i /> RecoverAI services connected</span>
        <span>Metrics loaded from your backend API</span>
      </footer>
    </section>
  )
}

export default Dashboard
