import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './app/shell/AppShell'
import { RequireAuth } from './app/auth/RequireAuth'
import { HomePage } from './pages/HomePage'
import { LoginPage } from './pages/LoginPage'
import { OnboardingPage } from './pages/OnboardingPage'
import { StartApplicationPage } from './pages/StartApplicationPage'
import { DashboardPage } from './pages/DashboardPage'
import { ApplicationFormPage } from './pages/ApplicationFormPage'
import { DocumentUploadPage } from './pages/DocumentUploadPage'
import { AppointmentBookingPage } from './pages/AppointmentBookingPage'
import { ConfirmationPage } from './pages/ConfirmationPage'
import { NotFoundPage } from './pages/NotFoundPage'

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />

        <Route
          path="/onboarding"
          element={
            <RequireAuth>
              <OnboardingPage />
            </RequireAuth>
          }
        />
        <Route
          path="/start"
          element={
            <RequireAuth>
              <StartApplicationPage />
            </RequireAuth>
          }
        />
        <Route
          path="/dashboard"
          element={
            <RequireAuth>
              <DashboardPage />
            </RequireAuth>
          }
        />

        <Route
          path="/apply/:id/form"
          element={
            <RequireAuth>
              <ApplicationFormPage />
            </RequireAuth>
          }
        />
        <Route
          path="/apply/:id/documents"
          element={
            <RequireAuth>
              <DocumentUploadPage />
            </RequireAuth>
          }
        />
        <Route
          path="/apply/:id/appointment"
          element={
            <RequireAuth>
              <AppointmentBookingPage />
            </RequireAuth>
          }
        />
        <Route
          path="/apply/:id/confirmation"
          element={
            <RequireAuth>
              <ConfirmationPage />
            </RequireAuth>
          }
        />

        <Route path="/apply" element={<Navigate to="/start" replace />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
