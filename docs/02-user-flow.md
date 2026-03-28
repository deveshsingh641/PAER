# 2) User flow

This demo implements the full flow below.

## Flow (happy path)

1. **Landing / Homepage**
   - Understand steps + confidence boosters
   - Primary CTA: Log in

2. **Login / Signup**
   - Email+password (demo reviewer)
   - OTP login (demo)

3. **First-time onboarding**
   - Collect: Name, DOB, City
   - Explain: steps, time required, documents

4. **Start application (introduction)**
   - Show: journey steps + what you need
   - Create a new draft application

5. **Form filling (step-by-step)**
   - Step 1: Personal
   - Step 2: Identity
   - Step 3: Service
   - **Autosave** + “Saved at …” indicator

6. **Document upload**
   - Checklist with examples
   - Required/optional clarity

7. **Appointment booking**
   - Grouped by center
   - Only available slots selectable

8. **Review + submit**
   - Summary + missing sections list (if any)
   - Submit → confirmation

9. **Confirmation + record access**
   - Application ID (copy)
   - Download application PDF
   - Download appointment receipt
   - View anytime from dashboard

## Save / sync behavior

- Form changes trigger **debounced autosave**
- UI shows: `Saving…` → `Saved at 2:30 PM`
- Drafts always remain accessible in Dashboard
