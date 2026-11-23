import React, { useState, useEffect } from "react";
import { X, Trash2, ArrowUpRight } from "lucide-react";
import { blank, statuses } from "../lib.js";
export function Editor({ item, onClose, onSave, onDelete }) {
  const [form, setForm] = useState(
      Object.fromEntries(
        Object.keys(blank).map((k) => [k, item[k] || blank[k]]),
      ),
    ),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [confirm, setConfirm] = useState(false);
  useEffect(() => {
    const previous = document.activeElement;
    const close = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab") {
        const nodes = [
          ...document.querySelectorAll(
            ".modal button:not(:disabled),.modal input,.modal select,.modal textarea,.modal a[href]",
          ),
        ];
        const first = nodes[0],
          last = nodes.at(-1);
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("keydown", close);
      document.body.style.overflow = oldOverflow;
      previous?.focus();
    };
  }, []);
  const set = (k, v) => setForm({ ...form, [k]: v });
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      await onSave(form);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <section
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="editor-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-heading">
          <div>
            <p className="eyebrow">MAKE ROOM FOR POSSIBILITY</p>
            <h2 id="editor-title">
              {item._id ? "Application details" : "Add an application"}
            </h2>
          </div>
          <button aria-label="Close" className="icon-button" onClick={onClose}>
            <X size={22} />
          </button>
        </div>
        <form onSubmit={submit}>
          <div className="form-grid">
            <label>
              Company
              <input
                autoFocus
                required
                maxLength={100}
                value={form.company}
                onChange={(e) => set("company", e.target.value)}
              />
            </label>
            <label>
              Role
              <input
                required
                maxLength={140}
                value={form.role}
                onChange={(e) => set("role", e.target.value)}
              />
            </label>
            <label>
              Location
              <input
                maxLength={150}
                value={form.location}
                onChange={(e) => set("location", e.target.value)}
              />
            </label>
            <label>
              Status
              <select
                value={form.status}
                onChange={(e) => set("status", e.target.value)}
              >
                {statuses.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </label>
            <label>
              Applied on
              <input
                type="date"
                value={form.appliedOn}
                onChange={(e) => set("appliedOn", e.target.value)}
              />
            </label>
            <label>
              Next deadline
              <input
                type="date"
                value={form.deadline}
                onChange={(e) => set("deadline", e.target.value)}
              />
            </label>
          </div>
          <label>
            Job posting URL
            <input
              type="url"
              placeholder="https://..."
              maxLength={1000}
              value={form.url}
              onChange={(e) => set("url", e.target.value)}
            />
          </label>
          {form.url && /^https?:\/\//i.test(form.url) && (
            <a
              className="external-link"
              href={form.url}
              target="_blank"
              rel="noreferrer"
            >
              Open job posting <ArrowUpRight size={14} />
            </a>
          )}
          <label>
            Next action
            <input
              maxLength={200}
              placeholder="One small step to keep things moving"
              value={form.nextAction}
              onChange={(e) => set("nextAction", e.target.value)}
            />
          </label>
          <label>
            Notes
            <textarea
              rows={3}
              maxLength={5000}
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
            />
          </label>
          {item.history?.length > 0 && (
            <div className="history">
              <b>Status history</b>
              <p>
                {item.history.map((h, i) => (
                  <span key={i}>
                    {h.status}{" "}
                    <small>{new Date(h.at).toLocaleDateString()}</small>
                    {i < item.history.length - 1 ? " → " : ""}
                  </span>
                ))}
              </p>
            </div>
          )}
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          <div className="modal-actions">
            {item._id && (
              <button
                type="button"
                className="danger"
                disabled={busy}
                onClick={async () => {
                  if (!confirm) {
                    setConfirm(true);
                    return;
                  }
                  setBusy(true);
                  await onDelete(item._id);
                  setBusy(false);
                }}
              >
                <Trash2 size={15} />
                {confirm ? "Confirm delete" : "Delete"}
              </button>
            )}
            <button type="button" className="secondary" onClick={onClose}>
              Cancel
            </button>
            <button className="primary" disabled={busy}>
              {busy ? "Saving..." : "Save application"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
