# Verification notes

Verified locally on November 23, 2026 with Node.js 22:

- `npm run check`: lint passed; 14 backend/domain tests passed; production Vite build passed.
- `npm run test:e2e`: 2 browser tests passed, covering desktop create/reload/update/delete, search, local matching, local follow-up draft and mobile rendering.
- `npm audit --omit=dev`: no vulnerabilities reported at check time. This is not a security certification.
- Dashboard, career studio and mobile screenshots were opened and visually inspected. No page-level mobile horizontal overflow, overlapping controls or clipped content was found at 390px width.

The demo and tests ran with a real temporary MongoDB process. No real user job applications were imported. No real Gemini API key was used. Provider request success, consent, failure and empty-result paths are tested with injected simulated responses. Live model output, deployment and GitHub publication remain unverified.

No resume has been edited and no repository has been published by this build. The project should be run and understood before describing it in an interview.
