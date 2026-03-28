# 5) Design decisions

## Why this design is better

- **Makes next steps obvious:** every screen has one primary action and a clear “what happens next” sentence.
- **Reduces form fatigue:** the form is split into short steps with a visible stepper.
- **Builds trust with saving:** autosave + timestamps remove uncertainty and reduce drop-offs.
- **Clarifies documents:** checklist items show examples and required/optional badges.
- **Simplifies booking:** slots are grouped by center and “Full” slots are not selectable.

## What was simplified / changed

- Removed “everything at once” form; replaced with 3 sub-steps.
- Added **pre-start introduction** (time + documents + steps) so users don’t feel trapped.
- Added a dashboard that acts as the single source of truth for status + exports.

## Key UX decisions

- **Progress indicators** across the journey (not just within a single screen).
- **Error placement**: show errors next to the relevant field with plain language.
- **Record access after submission**: always offer PDF export + receipt + copy ID.

## Accessibility & inclusivity (bonus)

- Labels on every field; focus rings for keyboard users.
- High-contrast text via Tailwind tokens.
- Avoids relying on color alone (status text like “Full/Available”, “Uploaded/Not uploaded”).
