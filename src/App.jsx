
import { useCallback, useEffect, useRef, useState } from "react";
import api from "./services/api.js";
import "./App.css";

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ||
  "https://recoverai-backend-klo0.onrender.com"
).replace(/\/+$/, "");
const API = `${API_BASE_URL}/api`;

const initialStats = {
  totalCases: 0,
  openCases: 0,
  inProgressCases: 0,
  recoveredCases: 0,
  escalatedCases: 0,
  exhaustedCases: 0,
  stoppedCases: 0,
  totalRevenueAtRisk: 0,
  totalRecoveredAmount: 0,
  recoveryRate: 0,
  pendingActions: 0,
  successfulActions: 0,
};

const actionTypes = [
  "RETRY_PAYMENT",
  "SEND_REMINDER",
  "GENERATE_PAYMENT_LINK",
  "ESCALATE_TO_HUMAN",
  "STOP",
];

function formatMoney(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function App({ user, onLogout, adminView = false }) {
  const [stats, setStats] = useState(initialStats);
  const [cases, setCases] = useState([]);
  const [actions, setActions] = useState([]);
  const [failedPayments, setFailedPayments] = useState([]);
  const [listPages, setListPages] = useState({ cases: 0, actions: 0, payments: 0 });
  const [hasMore, setHasMore] = useState({ cases: false, actions: false, payments: false });
  const [loadingMore, setLoadingMore] = useState("");
  const [selectedPayment, setSelectedPayment] = useState("");
  const [creatingCase, setCreatingCase] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [activePage, setActivePage] = useState("Dashboard");
  const [selectedCase, setSelectedCase] = useState("1");
  const [selectedType, setSelectedType] = useState("SEND_REMINDER");
  const [busyAction, setBusyAction] = useState(null);
  const [creating, setCreating] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const initialLoadStarted = useRef(false);

  async function request(url, options = {}) {
    try {
      const result = await api.request({ url, method: options.method || "GET", data: options.body, params: options.params });
      return result.data;
    } catch (err) {
      const payload = err.response?.data;
      throw new Error(payload?.message || payload?.detail || payload?.error || err.message || "Request failed");
    }
  }

  const loadDashboard = useCallback(async ({ includePayments = true, showLoading = false } = {}) => {
    if (showLoading) setLoading(true);

    try {
      const [summary, caseData, actionData, paymentData] = await Promise.all([
        request(`${API}/dashboard/summary`),
        request(`${API}/recovery-cases?page=0&size=50`),
        request(`${API}/recovery-actions?page=0&size=50`),
        includePayments && user?.role === "USER" ? request(`${API}/payments/owned-failed?page=0&size=50`) : Promise.resolve(null),
      ]);

      setError("");
      setStats({ ...initialStats, ...summary });
      setCases(Array.isArray(caseData) ? caseData : []);
      setActions(Array.isArray(actionData) ? actionData : []);
      setListPages({ cases: 0, actions: 0, payments: 0 });
      setHasMore({ cases: caseData.length === 50, actions: actionData.length === 50, payments: paymentData?.length === 50 });
      if (paymentData !== null) {
        setFailedPayments(Array.isArray(paymentData) ? paymentData : []);
        setSelectedPayment((current) => paymentData.some((item) => String(item.id) === current)
          ? current : String(paymentData[0]?.id || ""));
      }
      setSelectedCase((current) => caseData.some((item) => String(item.id) === current)
        ? current : String(caseData[0]?.id || ""));
    } catch (err) {
      setError(err.message || "Could not connect to the backend.");
    } finally {
      setLoading(false);
    }
  }, [user?.role]);

  async function loadMore(kind) {
    if (loadingMore) return;
    setLoadingMore(kind);
    const nextPage = listPages[kind] + 1;
    const path = { cases: "recovery-cases", actions: "recovery-actions", payments: "payments/owned-failed" }[kind];
    try {
      const data = await request(`${API}/${path}?page=${nextPage}&size=50`);
      const setter = { cases: setCases, actions: setActions, payments: setFailedPayments }[kind];
      setter((current) => [...current, ...data]);
      setListPages((current) => ({ ...current, [kind]: nextPage }));
      setHasMore((current) => ({ ...current, [kind]: data.length === 50 }));
    } catch (err) { setError(err.message || `Could not load more ${kind}.`); }
    finally { setLoadingMore(""); }
  }

  async function createCase(event) {
    event.preventDefault();
    if (!selectedPayment) return;
    setCreatingCase(true); setError(""); setNotice("");
    try {
      await request(`${API}/recovery-cases/from-payment/${selectedPayment}`, { method: "POST" });
      setNotice("Recovery case created and linked to your account.");
      await loadDashboard({ includePayments: false });
    } catch (err) { setError(err.message || "Could not create the recovery case."); }
    finally { setCreatingCase(false); }
  }

  useEffect(() => {
    if (!initialLoadStarted.current) {
      initialLoadStarted.current = true;
      loadDashboard();
    }
  }, [loadDashboard]);

  async function createAction(event) {
    event.preventDefault();
    if (!selectedCase) {
      setError("Please select a recovery case first.");
      return;
    }

    setCreating(true);
    setError("");
    setNotice("");

    try {
      await request(
        `${API}/recovery-actions/for-case/${selectedCase}?actionType=${selectedType}`,
        { method: "POST" }
      );
      setNotice("Recovery action created successfully.");
      await loadDashboard({ includePayments: false });
    } catch (err) {
      setError(err.message || "Could not create the recovery action.");
    } finally {
      setCreating(false);
    }
  }

  async function runAction(action, operation) {
    setBusyAction(action.id);
    setError("");
    setNotice("");

    try {
      let url = `${API}/recovery-actions/${action.id}/${operation}`;

      if (operation === "success") {
        const amount = window.prompt(
          "Enter the amount recovered (INR):",
          "0"
        );

        if (amount === null) return;

        const parsedAmount = Number(amount);
        if (!Number.isFinite(parsedAmount) || parsedAmount < 0) {
          throw new Error("Enter a valid non-negative recovery amount.");
        }

        url += `?recoveredAmount=${encodeURIComponent(parsedAmount)}`;
      }

      await request(url, { method: "PUT" });
      setNotice(`Action #${action.id} updated successfully.`);
      await loadDashboard({ includePayments: false });
    } catch (err) {
      setError(err.message || "Could not update this action.");
    } finally {
      setBusyAction(null);
    }
  }

  async function analyzeSelectedCase() {
    if (!selectedCase) {
      setError("Please select a recovery case first.");
      return;
    }

    setAnalyzing(true);
    setAiAnalysis(null);
    setError("");
    setNotice("");

    try {
      const result = await request(
        `${API}/ai-analysis/case/${selectedCase}`,
        { method: "POST" }
      );

      setAiAnalysis(result);
      setNotice(`AI analysis completed for case #${selectedCase}.`);
    } catch (err) {
      setError(err.message || "Could not analyse this recovery case.");
    } finally {
      setAnalyzing(false);
    }
  }

  const cards = [
    {
      label: "Total Cases",
      value: stats.totalCases,
      icon: "▤",
      color: "blue",
    },
    {
      label: "Open Cases",
      value: stats.openCases,
      icon: "◷",
      color: "orange",
    },
    {
      label: "Revenue at Risk",
      value: formatMoney(stats.totalRevenueAtRisk),
      icon: "₹",
      color: "red",
    },
    {
      label: "Amount Recovered",
      value: formatMoney(stats.totalRecoveredAmount),
      icon: "↗",
      color: "green",
    },
  ];

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">R</div>
          <div>
            <h2>RecoverAI</h2>
            <span>Recovery Intelligence</span>
          </div>
        </div>

        <p className="nav-heading">WORKSPACE</p>

        {[
          ["Dashboard", "▦"],
          ["Recovery Cases", "▤"],
          ["Recovery Actions", "↗"],
          ["AI Recommendations", "✦"],
        ].map(([name, icon]) => (
          <button
            key={name}
            className={`nav-item ${activePage === name ? "active" : ""}`}
            onClick={() => {
              setActivePage(name);
              setNotice("");
              setError("");
            }}
          >
            <span>{icon}</span>
            {name}
          </button>
        ))}

        {user?.role === "ADMIN" && (
          <button className="nav-item" onClick={() => window.location.assign("/admin")}>Admin dashboard</button>
        )}
        <div className="sidebar-bottom">
          <div className="status-dot" />
          <div>
            <strong>RecoverAI API</strong>
            <span>{error ? "Check connection or request" : loading ? "Connecting..." : "Connected"}</span>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <p className="eyebrow">PAYMENT RECOVERY PLATFORM</p>
            <h1>{adminView ? "Admin dashboard" : activePage}</h1>
            <p className="subtitle">
              Monitor failed payments and recovery performance.
            </p>
          </div>
          <button className="refresh-button" onClick={() => loadDashboard({ showLoading: true })}>
            ↻ <span>Refresh data</span>
          </button>
          <div className="account-menu">
            <span>{user?.fullName} · {user?.role}</span>
            {user?.role === "ADMIN" && <button className="text-button" onClick={() => window.location.assign("/admin/users")}>Manage users</button>}
            <button className="text-button" onClick={onLogout}>Log out</button>
          </div>
        </header>

        {error && (
          <div className="error-banner">
            <strong>Request error:</strong> {error}
            <button onClick={() => loadDashboard({ showLoading: true })}>Try again</button>
          </div>
        )}

        {notice && (
          <div className="success-banner">
            <strong>Success:</strong> {notice}
            <button onClick={() => setNotice("")}>Dismiss</button>
          </div>
        )}

        {activePage === "Dashboard" && (
          <>
            <section className="stats-grid">
              {cards.map((card) => (
                <article className="stat-card" key={card.label}>
                  <div className={`stat-icon ${card.color}`}>{card.icon}</div>
                  <p className="stat-label">{card.label}</p>
                  <h2>{loading ? "..." : card.value}</h2>
                  <span className="stat-note">Live backend data</span>
                </article>
              ))}
            </section>

            <section className="lower-grid">
              <article className="panel performance-panel">
                <div className="panel-heading">
                  <div>
                    <h3>Recovery performance</h3>
                    <p>Overview of payment recovery progress</p>
                  </div>
                  <span className="live-badge">● LIVE</span>
                </div>
                <div className="recovery-number">
                  {loading ? "..." : `${Number(stats.recoveryRate || 0)}%`}
                </div>
                <p className="muted">Overall recovery rate</p>
                <div className="progress-track">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${Math.min(100, Math.max(0, Number(stats.recoveryRate || 0)))}%`,
                    }}
                  />
                </div>
                <div className="performance-footer">
                  <div>
                    <span className="muted">Successful actions</span>
                    <strong>{loading ? "..." : stats.successfulActions}</strong>
                  </div>
                  <div>
                    <span className="muted">Pending actions</span>
                    <strong>{loading ? "..." : stats.pendingActions}</strong>
                  </div>
                </div>
              </article>

              <article className="panel">
                <div className="panel-heading">
                  <div>
                    <h3>Quick overview</h3>
                    <p>Current recovery status</p>
                  </div>
                  <span className="overview-icon">✦</span>
                </div>
                {[
                  ["All recovery cases", stats.totalCases],
                  ["Open cases", stats.openCases],
                  ["In-progress cases", stats.inProgressCases],
                  ["Recovered cases", stats.recoveredCases],
                  ["Escalated cases", stats.escalatedCases],
                  ["Exhausted cases", stats.exhaustedCases],
                  ["Stopped cases", stats.stoppedCases],
                ].map(([label, value]) => (
                  <div className="overview-row" key={label}>
                    <span>{label}</span>
                    <strong>{loading ? "..." : value ?? 0}</strong>
                  </div>
                ))}
              </article>
            </section>

            {user?.role === "USER" && (
              <section className="panel create-panel">
                <div className="panel-heading"><div><h3>Open a recovery case</h3><p>Create a case from a failed payment assigned to your account.</p></div></div>
                {failedPayments.length ? <form className="action-form" onSubmit={createCase}>
                  <label>Failed payment<select value={selectedPayment} onChange={(event) => setSelectedPayment(event.target.value)} disabled={creatingCase}>{failedPayments.map((payment) => <option key={payment.id} value={payment.id}>Payment #{payment.id} · {formatMoney(payment.amount)} · {payment.customerName}</option>)}</select></label>
                  <button className="primary-button" disabled={creatingCase}>{creatingCase ? "Creating…" : "Create recovery case"}</button>
                </form> : <p className="empty-state">No unclaimed failed payments are assigned to your account.</p>}
                {hasMore.payments && <button className="text-button" disabled={loadingMore === "payments"} onClick={() => loadMore("payments")}>{loadingMore === "payments" ? "Loading…" : "Load more assigned payments"}</button>}
              </section>
            )}

            <section className="panel cases-panel">
              <div className="panel-heading">
                <div>
                  <h3>Recent recovery cases</h3>
                  <p>Payment cases requiring attention</p>
                </div>
                <button className="text-button" onClick={() => setActivePage("Recovery Cases")}>
                  View cases →
                </button>
              </div>
              <CaseTable cases={cases} loading={loading} />
            </section>
          </>
        )}

        {activePage === "Recovery Cases" && (
          <section className="panel cases-panel">
            <div className="panel-heading">
              <div>
                <h3>All recovery cases</h3>
                <p>Review risk levels and case statuses</p>
              </div>
              <button className="text-button" onClick={() => loadDashboard({ showLoading: true })}>Refresh →</button>
            </div>
            <CaseTable cases={cases} loading={loading} detailed />
            {hasMore.cases && <button className="text-button" disabled={loadingMore === "cases"} onClick={() => loadMore("cases")}>{loadingMore === "cases" ? "Loading…" : "Load more cases"}</button>}
          </section>
        )}

        {activePage === "Recovery Actions" && (
          <>
            <section className="panel create-panel">
              <div className="panel-heading">
                <div>
                  <h3>Create recovery action</h3>
                  <p>Choose a case and action type to create a pending action.</p>
                </div>
              </div>

              <form className="action-form" onSubmit={createAction}>
                <label>
                  Recovery case
                  <select
                    value={selectedCase}
                    onChange={(event) => setSelectedCase(event.target.value)}
                    required
                    disabled={cases.length === 0 || creating}
                  >
                    {cases.length === 0 && <option value="">No cases available</option>}
                    {cases.map((item) => (
                      <option key={item.id} value={item.id}>
                        Case #{item.id} — {item.status} — {formatMoney(item.revenueAtRisk)}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Action type
                  <select
                    value={selectedType}
                    onChange={(event) => setSelectedType(event.target.value)}
                    disabled={creating}
                  >
                    {actionTypes.map((type) => (
                      <option key={type} value={type}>{type.replaceAll("_", " ")}</option>
                    ))}
                  </select>
                </label>

                <button className="primary-button" type="submit" disabled={creating || cases.length === 0}>
                  {creating ? "Creating..." : "+ Create action"}
                </button>
              </form>
            </section>

            <section className="panel cases-panel">
              <div className="panel-heading">
                <div>
                  <h3>Recovery action history</h3>
                  <p>{actions.length} actions found · Data from your backend</p>
                </div>
                <button className="text-button" onClick={() => loadDashboard({ showLoading: true })}>Refresh →</button>
              </div>

              {loading ? (
                <p className="empty-state">Loading actions...</p>
              ) : actions.length === 0 ? (
                <p className="empty-state">No actions yet. Use the form above to create one.</p>
              ) : (
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>CASE</th>
                        <th>ACTION TYPE</th>
                        <th>STATUS</th>
                        <th>RECOVERED</th>
                        <th>ATTEMPT</th>
                        <th>RESULT</th>
                        <th>OPERATIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {actions.map((action) => (
                        <tr key={action.id}>
                          <td>#{action.id}</td>
                          <td>#{action.recoveryCaseId}</td>
                          <td>{(action.actionType || "").replaceAll("_", " ")}</td>
                          <td>
                            <span className={`status-tag status-${(action.status || "").toLowerCase()}`}>
                              {action.status}
                            </span>
                          </td>
                          <td>{formatMoney(action.amountRecovered)}</td>
                          <td>{action.attemptNumber ?? 0}</td>
                          <td className="result-cell">{action.result || "—"}</td>
                          <td>
                            <div className="action-buttons">
                              {action.status === "PENDING" && (
                                <button
                                  className="small-button approve-button"
                                  disabled={busyAction === action.id}
                                  onClick={() => runAction(action, "approve")}
                                >
                                  Approve
                                </button>
                              )}
                              {action.status === "APPROVED" && (
                                <button
                                  className="small-button execute-button"
                                  disabled={busyAction === action.id}
                                  onClick={() => runAction(action, "execute")}
                                >
                                  Execute
                                </button>
                              )}
                              {action.status === "EXECUTED" && (
                                <button
                                  className="small-button approve-button"
                                  disabled={busyAction === action.id}
                                  onClick={() => runAction(action, "success")}
                                >
                                  Mark success
                                </button>
                              )}
                              {busyAction === action.id && <span>Working...</span>}
                              {["SUCCESS", "FAILED", "BLOCKED", "STOP"].includes(action.status) && (
                                <span className="muted">No action needed</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {hasMore.actions && <button className="text-button" disabled={loadingMore === "actions"} onClick={() => loadMore("actions")}>{loadingMore === "actions" ? "Loading…" : "Load more actions"}</button>}
            </section>
          </>
        )}

        {activePage === "AI Recommendations" && (
          <section className="panel cases-panel">
            <div className="panel-heading">
              <div>
                <h3>AI Recovery Analysis</h3>
                <p>Generate a rule-based recommendation for a recovery case.</p>
              </div>
            </div>

            <div className="action-form">
              <label>
                Recovery case
                <select
                  value={selectedCase}
                  onChange={(event) => {
                    setSelectedCase(event.target.value);
                    setAiAnalysis(null);
                    setError("");
                    setNotice("");
                  }}
                  disabled={analyzing || cases.length === 0}
                >
                  {cases.length === 0 && (
                    <option value="">No cases available</option>
                  )}
                  {cases.map((item) => (
                    <option key={item.id} value={item.id}>
                      {`Case #${item.id} — ${item.status} — ${formatMoney(item.revenueAtRisk)}`}
                    </option>
                  ))}
                </select>
              </label>

              <button
                className="primary-button"
                type="button"
                onClick={analyzeSelectedCase}
                disabled={analyzing || cases.length === 0}
              >
                {analyzing ? "Analyzing..." : "Analyze Case"}
              </button>
            </div>

            {aiAnalysis && (
              <div className="overview-row" style={{ marginTop: "24px", display: "block" }}>
                <h3>{aiAnalysis.diagnosis || "Recovery recommendation"}</h3>
                <p>
                  <strong>Recommended action:</strong>{" "}
                  {(aiAnalysis.recommendedAction || "NOT_AVAILABLE").replaceAll("_", " ")}
                </p>
                <p>
                  <strong>Confidence:</strong>{" "}
                  {`${Math.round(Number(aiAnalysis.confidence || 0) * 100)}%`}
                </p>
                <p>
                  <strong>Reasoning:</strong>{" "}
                  {aiAnalysis.reasoning || "No reasoning was returned."}
                </p>
                <p className="muted">
                  Engine: {aiAnalysis.modelName || "Rule-based"} · Case #{aiAnalysis.caseId}
                </p>
              </div>
            )}

            <p className="muted" style={{ marginTop: "18px" }}>
              This version uses rule-based recommendations and requires human review.
              It does not automatically send payment reminders or perform payments.
            </p>
          </section>
        )}

        <footer className="footer">
          <span>RecoverAI © 2026</span>
          <span>Intelligent payment recovery</span>
        </footer>
      </main>
    </div>
  );
}

function CaseTable({ cases, loading, detailed = false }) {
  if (loading) return <p className="empty-state">Loading recovery cases...</p>;
  if (!cases.length) return <p className="empty-state">No recovery cases found.</p>;

  return (
    <div className="table-wrapper">
      <table>
        <thead>
          <tr>
            <th>CASE ID</th>
            <th>PAYMENT ID</th>
            <th>AMOUNT AT RISK</th>
            {detailed && <th>RECOVERED</th>}
            {detailed && <th>ATTEMPTS</th>}
            <th>RISK LEVEL</th>
            <th>STATUS</th>
          </tr>
        </thead>
        <tbody>
          {cases.map((item) => (
            <tr key={item.id}>
              <td>#{item.id}</td>
              <td>{item.paymentId ?? "—"}</td>
              <td>{formatMoney(item.revenueAtRisk)}</td>
              {detailed && <td>{formatMoney(item.recoveredAmount)}</td>}
              {detailed && <td>{item.recoveryAttempts ?? 0}</td>}
              <td>
                <span className={`risk-tag ${(item.riskLevel || "low").toLowerCase()}`}>
                  {item.riskLevel || "LOW"}
                </span>
              </td>
              <td><span className="status-tag">{item.status || "UNKNOWN"}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default App;
