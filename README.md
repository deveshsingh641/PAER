# Passport Application Experience Redesign (PAER)

A small full-stack demo implementing a redesigned passport application journey focused on clarity, structure, and drop-off reduction.

## Tech stack (and why)

- **Frontend:** React + TypeScript + Vite + Tailwind
  - Fast iteration, clear component structure, responsive UI via Tailwind tokens (no custom color palette).
- **Backend:** Node.js + Express (file-based JSON persistence)
  - Keeps the demo easy to run on any reviewer machine (no DB installs); still supports auth, autosave, uploads, and exports.

## Demo login (mandatory for evaluation)

- **Email:** `hire-me@anshumat.org`
- **Password:** `HireMe@2025!`

The backend seeds this user automatically on startup.

> OTP login is also available as a **demo** flow (server returns a dev OTP) so reviewers can evaluate the onboarding UX without SMS.

## What’s implemented (screens)

- Landing / Homepage
- Login (email+password) + OTP login (demo)
- Onboarding (name, DOB, city)
- Dashboard (status tracking + exports)
- Step-by-step application form (3 short steps + autosave)
- Document checklist + uploads
- Appointment booking (available slots only)
- Review + submit + confirmation (application ID + PDF exports)

## UX improvements included

- **Step-by-step form** instead of one long page
- **Autosave + sync indicator** (`Saving…` → `Saved at …`) to reduce drop-offs
- **Clear errors** (plain language, next action is obvious)
- **Document clarity** with required/optional badges + examples
- **Booking clarity** (only available slots selectable, center grouping)
- **Record access** via dashboard + PDF export + receipt download + copyable application ID

More detail is in the docs folder:
- [docs/01-problem-understanding.md](docs/01-problem-understanding.md)
- [docs/02-user-flow.md](docs/02-user-flow.md)
- [docs/03-information-architecture.md](docs/03-information-architecture.md)
- [docs/04-wireframes-lowfi.md](docs/04-wireframes-lowfi.md)
- [docs/05-design-decisions.md](docs/05-design-decisions.md)
- [docs/06-high-fidelity-web-design.md](docs/06-high-fidelity-web-design.md)

## Submission checklist

- Figma link (view access): **Paste your view link here**
  - Fast option: import screenshots of the implemented screens into Figma frames and connect them in Prototype mode (see [docs/06-high-fidelity-web-design.md](docs/06-high-fidelity-web-design.md)).
- Short explanation (PDF / Notion / Slides): Export the `docs/` markdown to PDF, or share the `docs/` folder in Notion/Slides.

## Reviewer click-through (2–3 minutes)

1) Log in → `/login`
2) Onboarding → `/onboarding`
3) Start application → `/start`
4) Form autosave → `/apply/:id/form` (change a field and observe “Saved at …”)
5) Upload docs → `/apply/:id/documents`
6) Book appointment → `/apply/:id/appointment`
7) Review + submit → `/apply/:id/confirmation`
8) Dashboard exports → `/dashboard`

## Setup

### 1) Install dependencies

From the repo root:

```bash
npm i
```

This repo uses **npm workspaces**, so this single install command sets up both `frontend` and `backend`.

### 2) Run in dev

```bash
npm run dev
```

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3001/api/health`

### 3) (Optional) Production-like run

```bash
npm run build
npm run start
```

## Notes for reviewers

- Data persistence is stored in `backend/data/db.json` (created automatically). Uploaded documents go to `backend/uploads/`.
- This is a **demo UX prototype**; security hardening (rate limits, real OTP/SMS, stronger secrets) is intentionally out of scope.
