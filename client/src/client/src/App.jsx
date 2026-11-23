import React, { useEffect, useState } from "react";
import {
  ArrowUpRight,
  ArrowRight,
  Plus,
  Search,
  LayoutDashboard,
  BriefcaseBusiness,
  Sparkles,
  LogOut,
  CalendarDays,
  Download,
  Check,
  ChevronRight,
  LoaderCircle,
} from "lucide-react";
import { api, blank, statuses, formatDate } from "./lib.js";
import { Brand } from "./components/Brand.jsx";
import { Auth } from "./components/Auth.jsx";
import { Editor } from "./components/Editor.jsx";
import { Studio } from "./components/Studio.jsx";
const iconSize = { size: 18, strokeWidth: 1.8 };
export function App() {
  const [user, setUser] = useState(null),
    [loading, setLoading] = useState(true),
    [items, setItems] = useState([]),
    [view, setView] = useState("Overview"),
    [query, setQuery] = useState(""),
    [filter, setFilter] = useState("All"),
    [editor, setEditor] = useState(null),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [config, setConfig] = useState({ geminiAvailable: false });
  async function refresh() {
    const data = await api("/applications");
    setItems(data.applications);
  }
  useEffect(() => {
    api("/auth/me")
      .then(async (d) => {
        setUser(d.user);
        await refresh();
        setConfig(await api("/config"));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => {
    if (notice) {
      const t = setTimeout(() => setNotice(""), 4500);
      return () => clearTimeout(t);
    }
  }, [notice]);
  const today = new Date().toLocaleDateString("en-CA");
  const active = items.filter((a) => !["Rejected", "Offer"].includes(a.status));
  const upcoming = active
    .filter((a) => a.deadline)
    .sort((a, b) => a.deadline.localeCompare(b.deadline));
  const visible = items.filter(
    (a) =>
      (filter === "All" || a.status === filter) &&
      `${a.company} ${a.role} ${a.location}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  async function save(data) {
    await api("/applications" + (editor._id ? "/" + editor._id : ""), {
      method: editor._id ? "PATCH" : "POST",
      body: JSON.stringify(data),
    });
    await refresh();
    setEditor(null);
    setNotice("Application saved");
  }
  async function remove(id) {
    try {
      await api("/applications/" + id, { method: "DELETE" });
      await refresh();
      setEditor(null);
      setNotice("Application deleted");
    } catch (e) {
      setError(e.message);
    }
  }
  function exportData() {
    const blob = new Blob(
      [
        JSON.stringify(
          items.map(({ owner: _owner, __v, ...rest }) => rest),
          null,
          2,
        ),
      ],
      { type: "application/json" },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "applypilot-applications.json";
    a.click();
    URL.revokeObjectURL(url);
    setNotice("Export downloaded");
  }
  if (loading)
    return (
      <div className="loading">
        <LoaderCircle className="spin" /> Opening your workspace...
      </div>
    );
  if (!user)
    return (
      <Auth
        onLogin={async (u) => {
          setUser(u);
          await refresh();
          setConfig(await api("/config"));
        }}
      />
    );
  return (
    <div className="shell">
      <aside className="sidebar">
        <Brand />
        <div className="workspace-tag">
          <span className="tiny-avatar">P</span>
          <span>
            Personal workspace<small>Your next chapter starts here</small>
          </span>
        </div>
        <p className="nav-label">WORKSPACE</p>
        <nav>
          {[
            ["Overview", LayoutDashboard],
            ["Applications", BriefcaseBusiness],
            ["Career studio", Sparkles],
          ].map(([label, Icon]) => (
            <button
              className={view === label ? "nav-item active" : "nav-item"}
              key={label}
              onClick={() => {
                setView(label);
                setError("");
              }}
            >
              <Icon {...iconSize} />
              {label}
              {label === "Applications" && (
                <span className="nav-count">{items.length}</span>
              )}
            </button>
          ))}
        </nav>
        <div className="sidebar-note">
          <span className="note-icon">✦</span>
          <h3>A little progress, every day.</h3>
          <p>One thoughtful application is worth more than ten rushed ones.</p>
          <div className="note-line" />
        </div>
        <div className="account">
          <span className="avatar">{user.name.charAt(0).toUpperCase()}</span>
          <span className="account-name">
            {user.name}
            <small>Personal account</small>
          </span>
          <button
            className="icon-button"
            aria-label="Sign out"
            onClick={async () => {
              try {
                await api("/auth/logout", { method: "POST" });
                setUser(null);
                setItems([]);
              } catch (e) {
                setError(e.message);
              }
            }}
          >
            <LogOut size={17} />
          </button>
        </div>
      </aside>
      <main>
        <header className="topbar">
          <span>
            My workspace <ChevronRight size={14} /> <b>{view}</b>
          </span>
          <span className="private-label">
            <span /> Private by default
          </span>
        </header>
        <div className="content">
          {error && (
            <div role="alert" className="error">
              {error}
              <button onClick={() => setError("")}>Dismiss</button>
            </div>
          )}
          <div className="page-heading">
            <div>
              <p className="eyebrow">YOUR SEARCH, IN FOCUS</p>
              <h1>
                {view === "Overview"
                  ? "Make your next move."
                  : view === "Applications"
                    ? "Every opportunity, in one place."
                    : "Make your experience count."}
              </h1>
              <p className="subtitle">
                {view === "Overview"
                  ? "A clear view of where you are, and what comes next."
                  : view === "Applications"
                    ? "Keep the details close. Keep the momentum going."
                    : "Compare your experience honestly. Follow up thoughtfully."}
              </p>
            </div>
            {view !== "Career studio" && (
              <button
                className="primary"
                onClick={() => setEditor({ ...blank })}
              >
                <Plus size={17} />
                Add application
              </button>
            )}
          </div>
          {view === "Career studio" ? (
            <Studio config={config} />
          ) : (
            <>
              {view === "Overview" && (
                <>
                  <section className="stats">
                    {[
                      [
                        "Total applications",
                        items.length,
                        "Every possibility counts",
                        "all",
                      ],
                      [
                        "In progress",
                        active.length,
                        "Your next chapter is taking shape",
                        "progress",
                      ],
                      [
                        "Interviews",
                        items.filter((a) => a.status === "Interview").length,
                        "Time to show what you can do",
                        "interview",
                      ],
                      [
                        "Offers",
                        items.filter((a) => a.status === "Offer").length,
                        "Good things ahead",
                        "offer",
                      ],
                    ].map(([label, n, sub, key]) => (
                      <article key={key} className="stat">
                        <div>
                          {label}
                          <span className={"stat-icon " + key}>
                            {key === "offer" ? (
                              <Check size={17} />
                            ) : (
                              <ArrowUpRight size={17} />
                            )}
                          </span>
                        </div>
                        <strong>{n.toString().padStart(2, "0")}</strong>
                        <p>{sub}</p>
                      </article>
                    ))}
                  </section>
                  <div className="middle-grid">
                    <section className="panel pipeline">
                      <div className="section-title">
                        <h2>Your pipeline</h2>
                        <span className="muted">
                          From first step to next chapter
                        </span>
                      </div>
                      <div className="pipeline-bar">
                        {statuses.map((s) => (
                          <div
                            key={s}
                            className={"segment " + s.toLowerCase()}
                            style={{
                              flex: Math.max(
                                items.filter((a) => a.status === s).length,
                                0.1,
                              ),
                            }}
                          />
                        ))}
                      </div>
                      <div className="pipeline-legend">
                        {statuses.map((s) => (
                          <button
                            key={s}
                            onClick={() => {
                              setFilter(s);
                              setView("Applications");
                            }}
                          >
                            <span className={"dot " + s.toLowerCase()} />
                            <span>{s}</span>
                            <b>{items.filter((a) => a.status === s).length}</b>
                          </button>
                        ))}
                      </div>
                    </section>
                    <section className="focus-card">
                      <span className="focus-icon">
                        <Sparkles size={21} />
                      </span>
                      <div>
                        <p className="eyebrow">A MORE THOUGHTFUL APPLICATION</p>
                        <h2>Find your strongest angle.</h2>
                        <p>See how your skills line up with the role.</p>
                        <button onClick={() => setView("Career studio")}>
                          Open career studio <ArrowRight size={16} />
                        </button>
                      </div>
                    </section>
                  </div>
                </>
              )}
              <div className={view === "Overview" ? "bottom-grid" : ""}>
                <section className="panel application-panel">
                  <div className="section-title">
                    <h2>
                      {view === "Overview"
                        ? "Recent applications"
                        : "Applications"}{" "}
                      <span className="pill-count">{items.length}</span>
                    </h2>
                    <button className="text-button" onClick={exportData}>
                      <Download size={15} /> Export
                    </button>
                  </div>
                  <div className="table-tools">
                    <label className="search">
                      <Search size={17} />
                      <input
                        aria-label="Search applications"
                        placeholder="Search company, role or location..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                      />
                    </label>
                    <select
                      aria-label="Filter by status"
                      value={filter}
                      onChange={(e) => setFilter(e.target.value)}
                    >
                      <option value="All">All statuses</option>
                      {statuses.map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>COMPANY & ROLE</th>
                          <th>STATUS</th>
                          <th>DEADLINE</th>
                          <th aria-label="Open application" />
                        </tr>
                      </thead>
                      <tbody>
                        {(view === "Overview"
                          ? visible.slice(0, 5)
                          : visible
                        ).map((a) => (
                          <tr key={a._id}>
                            <td>
                              <button
                                className="company-cell"
                                onClick={() => setEditor(a)}
                              >
                                <span
                                  className={
                                    "company-logo color-" +
                                    (a.company.length % 4)
                                  }
                                >
                                  {a.company.slice(0, 1)}
                                </span>
                                <span>
                                  <b>{a.company}</b>
                                  <small>{a.role}</small>
                                </span>
                              </button>
                            </td>
                            <td>
                              <span
                                className={"badge " + a.status.toLowerCase()}
                              >
                                <span />
                                {a.status}
                              </span>
                            </td>
                            <td className="date-cell">
                              {a.deadline ? formatDate(a.deadline) : "Not set"}
                            </td>
                            <td>
                              <button
                                className="icon-button"
                                aria-label={"Edit " + a.company}
                                onClick={() => setEditor(a)}
                              >
                                <ArrowUpRight size={18} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {visible.length === 0 && (
                      <div className="empty">
                        <BriefcaseBusiness size={28} />
                        <h3>
                          {items.length
                            ? "No matching applications"
                            : "Your next chapter starts here"}
                        </h3>
                        <p>
                          {items.length
                            ? "Try another search or status."
                            : "Add your first opportunity to begin tracking it."}
                        </p>
                      </div>
                    )}
                  </div>
                  {view === "Overview" && items.length > 5 && (
                    <button
                      className="table-footer"
                      onClick={() => {
                        setFilter("All");
                        setView("Applications");
                      }}
                    >
                      View all applications <ArrowRight size={16} />
                    </button>
                  )}
                </section>
                {view === "Overview" && (
                  <aside className="panel deadlines">
                    <div className="section-title">
                      <h2>On the horizon</h2>
                      <CalendarDays size={18} />
                    </div>
                    <p className="muted">
                      Your next deadlines and small steps.
                    </p>
                    {upcoming.slice(0, 3).map((a) => (
                      <button
                        className="deadline-item"
                        key={a._id}
                        onClick={() => setEditor(a)}
                      >
                        <span className="date-tile">
                          <b>{a.deadline.slice(8)}</b>
                          <small>
                            {new Date(a.deadline + "T12:00:00")
                              .toLocaleDateString("en-US", { month: "short" })
                              .toUpperCase()}
                          </small>
                        </span>
                        <span>
                          <b>{a.company}</b>
                          <small>{a.nextAction || a.role}</small>
                          <em className={a.deadline < today ? "overdue" : ""}>
                            {a.deadline < today
                              ? "Overdue"
                              : a.deadline === today
                                ? "Today"
                                : "Due " + formatDate(a.deadline)}
                          </em>
                        </span>
                      </button>
                    ))}
                    {!upcoming.length && (
                      <p className="empty-small">
                        Nothing due yet. Add a deadline to an application to see
                        it here.
                      </p>
                    )}
                    <div className="gentle-note">
                      <span className="dot" /> Progress is a process. You've got
                      this.
                    </div>
                  </aside>
                )}
              </div>
            </>
          )}
          <footer className="page-footer">
            <span>Built for the next step, not the endless scroll.</span>
            <span>ApplyPilot / Personal workspace</span>
          </footer>
        </div>
      </main>
      {editor && (
        <Editor
          item={editor}
          onClose={() => setEditor(null)}
          onSave={save}
          onDelete={remove}
        />
      )}
      {notice && (
        <div className="toast" role="status">
          <Check size={16} />
          {notice}
        </div>
      )}
    </div>
  );
}
