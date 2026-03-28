# 6) High-fidelity web design (implemented in code)

This project’s high-fidelity design is implemented directly in the React app using Tailwind utility classes (spacing, type scale, hierarchy) and a small set of reusable primitives.

## Screens included

- Homepage: [frontend/src/pages/HomePage.tsx](../frontend/src/pages/HomePage.tsx)
- Login (password + OTP): [frontend/src/pages/LoginPage.tsx](../frontend/src/pages/LoginPage.tsx)
- Onboarding: [frontend/src/pages/OnboardingPage.tsx](../frontend/src/pages/OnboardingPage.tsx)
- Dashboard: [frontend/src/pages/DashboardPage.tsx](../frontend/src/pages/DashboardPage.tsx)
- Step-by-step Form: [frontend/src/pages/ApplicationFormPage.tsx](../frontend/src/pages/ApplicationFormPage.tsx)
- Document upload: [frontend/src/pages/DocumentUploadPage.tsx](../frontend/src/pages/DocumentUploadPage.tsx)
- Appointment booking: [frontend/src/pages/AppointmentBookingPage.tsx](../frontend/src/pages/AppointmentBookingPage.tsx)
- Review/confirmation: [frontend/src/pages/ConfirmationPage.tsx](../frontend/src/pages/ConfirmationPage.tsx)

## Layout & spacing

- Max reading width is constrained for calm scanning (`max-w-*` containers) so the user is not overwhelmed.
- Content is grouped into Cards with consistent padding and borders to create predictable structure.
- Primary actions are right-aligned (where appropriate) and visually consistent.

## Typography

- Clear page titles (`text-2xl`/`text-3xl`) and section titles (`text-base font-semibold`).
- Supporting guidance uses smaller text (`text-sm`) with comfortable line-height.

## Visual hierarchy

- Each page follows the pattern: **Title → 1-line guidance → main content → primary action**.
- Required vs optional is indicated with explicit labels (“Required/Optional”), not color alone.

## Clarity & readability

- Field labels are always visible; hints are placed next to labels.
- Errors are shown adjacent to the field in plain language.

## Reusable design primitives

- UI primitives live in: [frontend/src/ui/ui.tsx](../frontend/src/ui/ui.tsx)
  - Card, Button, TextField, Input, Select, InlineAlert, ProgressBar, Stepper, SyncBadge

If you need to submit a Figma link, you can recreate these same screens in Figma and paste the view link into the root README.

## Prototype (Figma) — fastest way (no redesign needed)

The assignment submission format asks for a **Figma link (view access)**. If you don’t want to redo screens in Figma from scratch, the simplest approach is:

1. Run the app locally (`npm run dev`).
2. Open each screen in the browser and take a screenshot.
3. In Figma, create frames and place the screenshots inside them.
4. Add prototype links between frames to demonstrate the end-to-end journey.

### Screens to include (6–8 recommended)

- Home (`/`)
- Login (`/login`)
- Onboarding (`/onboarding`)
- Dashboard (`/dashboard`)
- Form (`/apply/:id/form`)
- Documents (`/apply/:id/documents`)
- Appointment (`/apply/:id/appointment`)
- Confirmation (`/apply/:id/confirmation`)

### Prototype connections (minimum)

- Home → Login
- Login → Onboarding (first-time) → Start (`/start`)
- Start → Form → Documents → Appointment → Confirmation
- Confirmation → Dashboard (record access + exports)

### Figma link

- Paste the Figma view link in the root README: `README.md` → “Submission checklist”.

## UX improvements (mapped to evaluation)

- **Form experience:** step-by-step flow + journey stepper + field-level validation and plain-language errors.
- **Save/Sync:** debounced autosave with a clear “Saving…” → “Saved at …” status indicator.
- **Document clarity:** checklist with required/optional badges and example hints; progress blocks continuation until required items are complete.
- **Booking experience:** slots grouped by center; “Full” slots are disabled and labeled explicitly.
- **Record access / export:** dashboard and confirmation allow PDF export + appointment receipt download + copyable application ID.
