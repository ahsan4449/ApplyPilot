import React, { useState } from "react";
import { Sparkles, LoaderCircle, Compass } from "lucide-react";
import { api } from "../lib.js";
export function Studio({ config }) {
  const [kind, setKind] = useState("match"),
    [resume, setResume] = useState(""),
    [jobDescription, setJd] = useState(""),
    [company, setCompany] = useState(""),
    [role, setRole] = useState(""),
    [consent, setConsent] = useState(false),
    [busy, setBusy] = useState(false),
    [result, setResult] = useState(null),
    [error, setError] = useState(""),
    [copied, setCopied] = useState(false);
  async function submit(e) {
    e.preventDefault();
    setError("");
    setResult(null);
    setBusy(true);
    try {
      setResult(
        await api("/assist", {
          method: "POST",
          body: JSON.stringify({
            kind,
            resume,
            jobDescription,
            company: company || "the company",
            role: role || "the role",
            consent,
          }),
        }),
      );
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="studio-grid">
      <section className="panel studio-input">
        <div className="studio-tabs">
          <button
            className={kind === "match" ? "selected" : ""}
            onClick={() => {
              setKind("match");
              setResult(null);
            }}
          >
            Resume match
          </button>
          <button
            className={kind === "followup" ? "selected" : ""}
            onClick={() => {
              setKind("followup");
              setResult(null);
            }}
          >
            Follow-up draft
          </button>
        </div>
        <form onSubmit={submit}>
          {kind === "followup" && (
            <div className="form-grid">
              <label>
                Company
                <input
                  maxLength={100}
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                />
              </label>
              <label>
                Role
                <input
                  maxLength={140}
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                />
              </label>
            </div>
          )}
          <label>
            Your resume text
            <textarea
              required
              minLength={20}
              maxLength={12000}
              rows={7}
              placeholder="Paste relevant skills and experience. Remove contact details or anything sensitive."
              value={resume}
              onChange={(e) => setResume(e.target.value)}
            />
          </label>
          <label>
            Job description
            <textarea
              required
              minLength={20}
              maxLength={12000}
              rows={7}
              placeholder="Paste the role's requirements..."
              value={jobDescription}
              onChange={(e) => setJd(e.target.value)}
            />
          </label>
          <div className="consent">
            <label>
              <input
                type="checkbox"
                checked={consent}
                disabled={!config.geminiAvailable}
                onChange={(e) => setConsent(e.target.checked)}
              />
              <span>Use Gemini for extra writing help</span>
            </label>
            <p>
              {config.geminiAvailable
                ? "Opting in sends the text above to Google. Free-tier content may be used to improve Google products. Remove private information first."
                : "Gemini is not configured. Local keyword matching and template drafts work without a key."}{" "}
              Text is not stored by ApplyPilot.
            </p>
          </div>
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          <button className="primary" disabled={busy}>
            {busy ? (
              <LoaderCircle size={17} className="spin" />
            ) : (
              <Sparkles size={17} />
            )}{" "}
            {busy
              ? "Working..."
              : kind === "match"
                ? "Compare experience"
                : "Create draft"}
          </button>
        </form>
      </section>
      <section className="panel studio-result">
        <p className="eyebrow">CLARITY, NOT SHORTCUTS</p>
        <h2>
          {kind === "match" ? "Find the overlap." : "A thoughtful next step."}
        </h2>
        {!result ? (
          <div className="result-empty">
            <Compass size={64} strokeWidth={1} />
            <h3>Your experience has a story.</h3>
            <p>
              {kind === "match"
                ? "Compare the skills you have with what the role asks for. No invented experience. No hiring promises."
                : "Create an editable follow-up. Nothing is emailed or sent automatically."}
            </p>
          </div>
        ) : (
          <>
            <p className="source-label">
              {result.source === "gemini"
                ? "Gemini-assisted"
                : "Local tool · no external request"}
            </p>
            {kind === "match" ? (
              <>
                <div className="score">
                  {result.score === null ? "N/A" : result.score + "%"}
                  <small>keyword coverage</small>
                </div>
                <p className="muted">{result.explanation}</p>
                <h3>Skills in common</h3>
                <div className="skill-list">
                  {result.matched.map((s) => (
                    <span key={s} className="skill matched">
                      {s}
                    </span>
                  ))}
                  {!result.matched.length && <p>No matching keywords found.</p>}
                </div>
                <h3>Not found in your resume</h3>
                <div className="skill-list">
                  {result.missing.map((s) => (
                    <span key={s} className="skill">
                      {s}
                    </span>
                  ))}
                  {!result.missing.length && (
                    <p>
                      No keyword gaps detected. This does not mean full
                      qualification.
                    </p>
                  )}
                </div>
                <div className="advice">
                  {result.advice || result.suggestions.join("\n")}
                </div>
              </>
            ) : (
              <>
                <textarea
                  aria-label="Editable follow-up draft"
                  className="draft-output"
                  rows={16}
                  value={result.draft}
                  onChange={(e) =>
                    setResult({ ...result, draft: e.target.value })
                  }
                />
                <button
                  className="secondary"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(result.draft);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    } catch {
                      setError(
                        "Clipboard unavailable. Select and copy the draft manually.",
                      );
                    }
                  }}
                >
                  {copied ? "Copied" : "Copy draft"}
                </button>
                <p className="muted">
                  Review and personalize before sending. ApplyPilot never sends
                  email.
                </p>
              </>
            )}
          </>
        )}
      </section>
    </div>
  );
}
