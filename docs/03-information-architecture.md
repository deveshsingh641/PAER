# 3) Information architecture

## Sitemap (primary)

- `/` Home
- `/login` Login
- `/onboarding` First-time setup
- `/start` Application introduction
- `/dashboard` Dashboard (status + access)
- `/apply/:id/form` Step-by-step form (3 sub-steps)
- `/apply/:id/documents` Document checklist + upload
- `/apply/:id/appointment` Appointment booking
- `/apply/:id/confirmation` Review + submit + confirmation

## Navigation structure

Top navigation (minimal):
- Home
- Dashboard
- Start application
- Log out

Within the application journey:
- Visible **progress indicator** (Personal → Identity → Service → Documents → Appointment)
- Next/Back controls; “Continue to …” labels match the next screen

## Content hierarchy (per core screens)

- **Page title** (what this screen is)
- **One-sentence guidance** (how to succeed here)
- **Primary action** (Next/Upload/Book/Submit)
- **Inline help** (examples/hints)
- **Errors** placed next to fields and summarized clearly
