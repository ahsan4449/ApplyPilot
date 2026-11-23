# Architecture and interview walkthrough

## Data flow

```text
React UI -> same-origin /api -> Express validation + session check
                                |-> owner-scoped MongoDB queries
                                |-> local skill matcher / draft template
                                `-> Gemini REST API, only with explicit consent
```

The browser never receives the Gemini key. Gemini has no access to database tools or email sending. Its response is rendered as plain text, not HTML. Application links are limited to HTTP(S).

## Collections

`User`: name, unique normalized email, password hash, timestamps. Password hashes are excluded from default queries and public response objects.

`Application`: owner reference, company, role, location, posting URL, stage, applied-on date, deadline, next action, notes, status history, timestamps. All read/update/delete operations use the authenticated owner in the database selector, not an owner supplied by the client.

Indexes support unique email and owner-scoped recency queries. A Zod strict schema rejects extra keys, so clients cannot overwrite `owner` or forge `history`. Updates explicitly pick fields present in the request so schema defaults never reset omitted fields.

## Decisions worth explaining

### Why a transparent local score?

A numeric model-generated score can look more authoritative than it is. ApplyPilot computes a reproducible keyword coverage percentage: matched known skills / known skills mentioned in the job description. For a description with no dictionary terms, it returns null rather than zero. Gemini adds prose advice; it does not change the score. Boundary matching prevents `JavaScript` from counting as `Java`, and aliases handle `NodeJS` versus `Node.js`.

### Why HTTP-only cookies?

JavaScript cannot read the session token, which reduces one route for token theft. SameSite=Strict, HTTPS-only cookies in production, an Origin check for browser writes and JSON requests reduce CSRF exposure. This does not eliminate XSS risk. The app does not render raw HTML or expose provider error payloads.

Tradeoff: JWT sessions are stateless. Logout clears the current browser cookie but does not revoke a token already copied elsewhere. A production system should use revocable server-side sessions or a session-version model and add verification/recovery flows.

### Why ephemeral MongoDB for demos?

A portfolio reviewer can run the complete MERN path without creating a cloud database or supplying secrets. It uses the same Mongoose models and Express routes as persistent mode. Temporary data is deliberately disposable, clearly labeled and not exposed outside loopback. Persistent startup never silently falls back to demo mode.

### Why no automated follow-up sending?

Drafting and sending have different consequences. ApplyPilot lets the user edit and copy a draft, but never contacts recruiters. This keeps the project focused and makes reviewing generated text a normal part of the workflow.

### How does the Gemini boundary work?

The server checks consent before any provider request, uses a server-held key, keeps resume/JD inputs out of MongoDB, applies body limits and per-IP AI rate limits, sets a 20-second timeout and returns an actionable error for provider failure. Submitted content is separated from the task in a system instruction and is never given executable tools. Prompt injection can still affect prose; users must review the draft. The app does not claim to make model outputs trustworthy.

## Test strategy

Backend tests use Supertest and a real ephemeral MongoDB, covering unauthenticated access, validation, registration/login, duplicate accounts, ownership isolation, status history, deletion, cross-origin rejection, matching edge cases, opt-in behavior and simulated provider responses. Browser tests cover a full create/reload/update/delete cycle, search, matching, follow-up drafting and a mobile layout with no page-level horizontal overflow.

Mocked provider tests prove request mechanics and handling, not real model quality or current credentials. A live Gemini test still needs a key. CI runs the tests and production build; first-run MongoDB download needs network access.

## Suggested 5-minute demo

1. Explain the job-search problem and show the dashboard with fictional data.
2. Create an application with a deadline and next action, change its status, then show status history.
3. Search and filter records. Explain that MongoDB uses the session owner in every query.
4. Paste a synthetic resume and job description. Explain the exact keyword formula and its limits.
5. Generate a local follow-up, edit it, and show the explicit Gemini toggle. Explain why nothing is sent automatically.
6. Run `npm run check` and discuss one improvement: revocable sessions, pagination or password recovery.

## Honest resume wording for review

Use only after personally running and understanding the project. Avoid adding invented users, accuracy gains, response rates or performance metrics.

- Built a MERN job-application workspace with cookie-based authentication, owner-scoped CRUD APIs, deadline tracking and status-change history.
- Implemented transparent resume/job-description keyword matching and optional Gemini-assisted advice and follow-up drafts with per-request consent and server-side keys.
- Added API regression tests and desktop/mobile browser tests for application workflows and access isolation.

The code was prepared with AI assistance. Be ready to explain each part, make a small change and discuss the tradeoffs before using it in an interview. Do not present provider-mocked tests as proof of live Gemini validation.
