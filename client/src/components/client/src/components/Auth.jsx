import React, { useState } from "react";
import { ArrowRight, LoaderCircle, Compass } from "lucide-react";
import { api } from "../lib.js";
import { Brand } from "./Brand.jsx";
export function Auth({ onLogin }) {
  const [register, setRegister] = useState(false),
    [form, setForm] = useState({ name: "", email: "", password: "" }),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const { user } = await api("/auth/" + (register ? "register" : "login"), {
        method: "POST",
        body: JSON.stringify(
          register ? form : { email: form.email, password: form.password },
        ),
      });
      await onLogin(user);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="auth-page">
      <section className="auth-story">
        <Brand />
        <div>
          <p className="eyebrow">LESS SCATTER. MORE DIRECTION.</p>
          <h1>
            Your next chapter.
            <br />A clearer path there.
          </h1>
          <p>
            A home for your applications, your next steps,
            <br />
            and all the possibilities ahead.
          </p>
          <div className="auth-art">
            <Compass size={140} strokeWidth={0.65} />
            <span>ONE STEP AT A TIME</span>
          </div>
        </div>
        <small>Thoughtful tools for a very human journey.</small>
      </section>
      <section className="auth-form">
        <div>
          <p className="eyebrow">YOUR PERSONAL WORKSPACE</p>
          <h2>{register ? "Start your next chapter." : "Welcome back."}</h2>
          <p className="subtitle">
            {register
              ? "Give your job search a place to grow."
              : "Pick up where you left off."}
          </p>
          <form onSubmit={submit}>
            {register && (
              <label>
                Your name
                <input
                  required
                  maxLength={80}
                  autoComplete="name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </label>
            )}
            <label>
              Email address
              <input
                type="email"
                required
                autoComplete="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </label>
            <label>
              Password
              <input
                type="password"
                required
                minLength={10}
                maxLength={72}
                autoComplete={register ? "new-password" : "current-password"}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </label>
            <small className="muted">At least 10 characters.</small>
            {error && (
              <p role="alert" className="error">
                {error}
              </p>
            )}
            <button className="primary" disabled={busy}>
              {busy ? <LoaderCircle size={16} className="spin" /> : null}
              {register ? "Create account" : "Sign in"}
              <ArrowRight size={16} />
            </button>
          </form>
          <p className="auth-switch">
            {register ? "Already have an account?" : "New here?"}{" "}
            <button
              className="text-button"
              onClick={() => {
                setRegister(!register);
                setError("");
              }}
            >
              {register ? "Sign in" : "Create an account"}
            </button>
          </p>
          <div className="demo-hint">
            Trying the local demo?
            <br />
            <b>demo@example.com</b> / demo-password-2026
            <br />
            <small>Demo data is temporary and fictional.</small>
          </div>
        </div>
      </section>
    </div>
  );
}
