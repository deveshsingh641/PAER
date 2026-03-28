import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs/promises';
import { nanoid } from 'nanoid';

import { readDb, updateDb, nowIso } from './db.js';
import { authMiddleware, signToken, getUserSafe } from './auth.js';
import {
  zodBody,
  loginSchema,
  requestOtpSchema,
  verifyOtpSchema,
  updateProfileSchema,
  startApplicationSchema,
  applicationPatchSchema,
} from './validators.js';
import { ensureDemoUser } from './seed.js';
import { renderApplicationPdf, renderAppointmentReceiptPdf } from './pdf.js';

const app = express();

app.use(
  cors({
    origin: ['http://localhost:5173', 'http://localhost:4173'],
  })
);
app.use(express.json({ limit: '2mb' }));

const uploadsDir = path.resolve(process.cwd(), 'uploads');
await fs.mkdir(uploadsDir, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadsDir),
    filename: (_req, file, cb) => {
      const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
      cb(null, `${Date.now()}_${safe}`);
    },
  }),
  limits: { fileSize: 8 * 1024 * 1024 },
});

function pickApplicationSummary(application) {
  const totalSteps = 5;
  const completed = application.progress?.completedSteps ?? 0;
  const percent = Math.min(100, Math.round((completed / totalSteps) * 100));

  return {
    id: application.id,
    status: application.status,
    completedSteps: completed,
    totalSteps,
    percent,
    updatedAt: application.updatedAt,
    submittedAt: application.submittedAt ?? null,
    appointment: application.appointment ?? null,
  };
}

function computeCompletedSteps(application) {
  let completed = 0;
  const personal = application.form?.personal || {};
  const identity = application.form?.identity || {};
  const service = application.form?.service || {};

  const step1 = Boolean(personal.fullName && personal.dob && personal.addressLine1 && personal.pincode);
  const step2 = Boolean(identity.idType && identity.idNumber);
  const step3 = Boolean(service.passportType && service.bookletPages && service.deliveryMode);
  const step4 = Boolean((application.documents || []).some((d) => d.requirementId === 'photo'));
  const step5 = Boolean(application.appointment?.slotStart);

  if (step1) completed += 1;
  if (step2) completed += 1;
  if (step3) completed += 1;
  if (step4) completed += 1;
  if (step5) completed += 1;

  return completed;
}

function getDocumentRequirements() {
  return [
    {
      id: 'photo',
      title: 'Passport-size photo',
      required: true,
      hint: 'Recent photo with a plain background. No glare; face clearly visible.',
    },
    {
      id: 'identity',
      title: 'Proof of identity',
      required: true,
      hint: 'National ID / Driver License / Student ID (front + back if applicable).',
    },
    {
      id: 'address',
      title: 'Proof of address',
      required: true,
      hint: 'Bank statement / Utility bill / Rental agreement (showing current address).',
    },
    {
      id: 'dob',
      title: 'Proof of date of birth',
      required: true,
      hint: 'Birth certificate / School leaving certificate / Government-issued document.',
    },
  ];
}

function generateSlots({ city }) {
  const centers = [
    { id: 'center-1', name: `${city || 'City'} Passport Seva Kendra` },
    { id: 'center-2', name: `${city || 'City'} Head Post Office Center` },
  ];

  const results = [];
  const now = new Date();

  for (let dayOffset = 1; dayOffset <= 10; dayOffset += 1) {
    for (const center of centers) {
      for (let hour = 9; hour <= 16; hour += 1) {
        const start = new Date(now);
        start.setDate(now.getDate() + dayOffset);
        start.setHours(hour, 0, 0, 0);

        const iso = start.toISOString();
        const isAvailable = (start.getDate() + hour + center.id.length) % 3 !== 0; // deterministic-ish

        results.push({
          slotId: `${center.id}_${iso}`,
          city: city || 'City',
          centerId: center.id,
          centerName: center.name,
          slotStart: iso,
          available: isAvailable,
        });
      }
    }
  }

  return results;
}

app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.post('/api/auth/login', zodBody(loginSchema), async (req, res) => {
  const { email, password } = req.validatedBody;
  const db = await readDb();
  const user = db.users.find((u) => (u.email || '').toLowerCase() === email.toLowerCase());
  if (!user) return res.status(401).json({ error: 'INVALID_CREDENTIALS', message: 'Email or password is incorrect.' });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: 'INVALID_CREDENTIALS', message: 'Email or password is incorrect.' });

  const token = signToken({ userId: user.id });
  return res.json({ token, user: { id: user.id, email: user.email, name: user.name ?? null } });
});

app.post('/api/auth/request-otp', zodBody(requestOtpSchema), async (req, res) => {
  const { phone } = req.validatedBody;

  const challenge = {
    id: nanoid(),
    phone,
    otp: '123456',
    expiresAt: Date.now() + 5 * 60 * 1000,
    createdAt: nowIso(),
  };

  await updateDb((db) => {
    db.otpChallenges = (db.otpChallenges || []).filter((c) => c.phone !== phone);
    db.otpChallenges.push(challenge);
  });

  return res.json({ challengeId: challenge.id, devOtp: '123456', message: 'OTP sent (demo).' });
});

app.post('/api/auth/verify-otp', zodBody(verifyOtpSchema), async (req, res) => {
  const { challengeId, otp, name } = req.validatedBody;

  const result = await updateDb((db) => {
    const challenge = (db.otpChallenges || []).find((c) => c.id === challengeId);
    if (!challenge) return { error: 'INVALID_OTP' };
    if (challenge.expiresAt < Date.now()) return { error: 'OTP_EXPIRED' };
    if (String(otp) !== String(challenge.otp)) return { error: 'INVALID_OTP' };

    let user = db.users.find((u) => u.phone === challenge.phone);
    if (!user) {
      user = {
        id: nanoid(),
        phone: challenge.phone,
        name: name || null,
        createdAt: nowIso(),
      };
      db.users.push(user);
    } else {
      user.name = name || user.name || null;
    }

    db.otpChallenges = (db.otpChallenges || []).filter((c) => c.id !== challengeId);
    return { userId: user.id };
  });

  if (result?.error === 'OTP_EXPIRED') return res.status(400).json({ error: 'OTP_EXPIRED', message: 'OTP expired. Request a new one.' });
  if (result?.error === 'INVALID_OTP') return res.status(400).json({ error: 'INVALID_OTP', message: 'OTP is incorrect.' });

  const token = signToken({ userId: result.userId });
  const userSafe = await getUserSafe(result.userId);
  return res.json({ token, user: userSafe });
});

app.get('/api/me', authMiddleware, async (req, res) => {
  const user = await getUserSafe(req.userId);
  if (!user) return res.status(401).json({ error: 'UNAUTHENTICATED', message: 'Login required.' });
  return res.json({ user });
});

app.patch('/api/me', authMiddleware, zodBody(updateProfileSchema), async (req, res) => {
  const patch = req.validatedBody;
  const updated = await updateDb((db) => {
    const user = db.users.find((u) => u.id === req.userId);
    if (!user) return null;
    if (patch.name !== undefined) user.name = patch.name;
    if (patch.dob !== undefined) user.dob = patch.dob;
    if (patch.city !== undefined) user.city = patch.city;
    user.updatedAt = nowIso();
    return user;
  });

  if (!updated) return res.status(401).json({ error: 'UNAUTHENTICATED', message: 'Login required.' });
  const userSafe = await getUserSafe(req.userId);
  return res.json({ user: userSafe });
});

app.post('/api/applications', authMiddleware, zodBody(startApplicationSchema), async (req, res) => {
  const { city } = req.validatedBody;

  const created = await updateDb((db) => {
    const application = {
      id: nanoid(),
      userId: req.userId,
      status: 'Draft',
      onboarding: { city: city || null },
      form: { personal: {}, identity: {}, service: {} },
      documents: [],
      appointment: null,
      progress: { completedSteps: 0 },
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    db.applications.push(application);
    return application;
  });

  return res.status(201).json({ applicationId: created.id });
});

app.get('/api/applications', authMiddleware, async (req, res) => {
  const db = await readDb();
  const list = db.applications
    .filter((a) => a.userId === req.userId)
    .sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)))
    .map(pickApplicationSummary);
  return res.json({ applications: list });
});

app.get('/api/applications/:id', authMiddleware, async (req, res) => {
  const db = await readDb();
  const application = db.applications.find((a) => a.id === req.params.id && a.userId === req.userId);
  if (!application) return res.status(404).json({ error: 'NOT_FOUND', message: 'Application not found.' });

  return res.json({ application });
});

app.patch('/api/applications/:id', authMiddleware, zodBody(applicationPatchSchema), async (req, res) => {
  const patch = req.validatedBody;

  const updated = await updateDb((db) => {
    const application = db.applications.find((a) => a.id === req.params.id && a.userId === req.userId);
    if (!application) return null;

    application.onboarding = { ...(application.onboarding || {}), ...(patch.onboarding || {}) };
    application.form = application.form || { personal: {}, identity: {}, service: {} };
    application.form.personal = { ...(application.form.personal || {}), ...(patch.form?.personal || {}) };
    application.form.identity = { ...(application.form.identity || {}), ...(patch.form?.identity || {}) };
    application.form.service = { ...(application.form.service || {}), ...(patch.form?.service || {}) };

    const completedSteps = computeCompletedSteps(application);
    application.progress = { completedSteps };
    application.updatedAt = nowIso();

    return application;
  });

  if (!updated) return res.status(404).json({ error: 'NOT_FOUND', message: 'Application not found.' });

  return res.json({
    savedAt: updated.updatedAt,
    progress: pickApplicationSummary(updated),
  });
});

app.get('/api/applications/:id/document-requirements', authMiddleware, async (req, res) => {
  const db = await readDb();
  const application = db.applications.find((a) => a.id === req.params.id && a.userId === req.userId);
  if (!application) return res.status(404).json({ error: 'NOT_FOUND', message: 'Application not found.' });

  const requirements = getDocumentRequirements();
  const uploaded = application.documents || [];
  const checklist = requirements.map((r) => ({
    ...r,
    uploadedCount: uploaded.filter((d) => d.requirementId === r.id).length,
    complete: uploaded.some((d) => d.requirementId === r.id),
  }));

  return res.json({ checklist });
});

app.post('/api/applications/:id/documents', authMiddleware, upload.single('file'), async (req, res) => {
  const requirementId = String(req.body.requirementId || 'other');
  if (!req.file) return res.status(400).json({ error: 'NO_FILE', message: 'Select a file to upload.' });

  const updated = await updateDb((db) => {
    const application = db.applications.find((a) => a.id === req.params.id && a.userId === req.userId);
    if (!application) return null;

    application.documents = application.documents || [];
    application.documents.push({
      id: nanoid(),
      requirementId,
      originalName: req.file.originalname,
      filename: req.file.filename,
      size: req.file.size,
      mimeType: req.file.mimetype,
      uploadedAt: nowIso(),
    });

    const completedSteps = computeCompletedSteps(application);
    application.progress = { completedSteps };
    application.updatedAt = nowIso();

    return application;
  });

  if (!updated) return res.status(404).json({ error: 'NOT_FOUND', message: 'Application not found.' });
  return res.status(201).json({ message: 'Document uploaded.', savedAt: updated.updatedAt });
});

app.get('/api/applications/:id/documents', authMiddleware, async (req, res) => {
  const db = await readDb();
  const application = db.applications.find((a) => a.id === req.params.id && a.userId === req.userId);
  if (!application) return res.status(404).json({ error: 'NOT_FOUND', message: 'Application not found.' });
  return res.json({ documents: application.documents || [] });
});

app.get('/api/applications/:id/documents/:docId/download', authMiddleware, async (req, res) => {
  const db = await readDb();
  const application = db.applications.find((a) => a.id === req.params.id && a.userId === req.userId);
  if (!application) return res.status(404).json({ error: 'NOT_FOUND', message: 'Application not found.' });

  const docMeta = (application.documents || []).find((d) => d.id === req.params.docId);
  if (!docMeta) return res.status(404).json({ error: 'NOT_FOUND', message: 'Document not found.' });

  const fullPath = path.join(uploadsDir, docMeta.filename);
  return res.download(fullPath, docMeta.originalName);
});

app.get('/api/appointments/slots', authMiddleware, async (req, res) => {
  const city = String(req.query.city || 'City');
  const slots = generateSlots({ city });
  return res.json({ slots });
});

app.post('/api/applications/:id/appointment', authMiddleware, async (req, res) => {
  const slot = req.body?.slot;
  if (!slot?.slotId || !slot?.slotStart) {
    return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Select an appointment slot.' });
  }

  const updated = await updateDb((db) => {
    const application = db.applications.find((a) => a.id === req.params.id && a.userId === req.userId);
    if (!application) return null;

    application.appointment = {
      slotId: slot.slotId,
      city: slot.city,
      centerId: slot.centerId,
      centerName: slot.centerName,
      slotStart: slot.slotStart,
      bookedAt: nowIso(),
    };

    const completedSteps = computeCompletedSteps(application);
    application.progress = { completedSteps };
    application.updatedAt = nowIso();
    return application;
  });

  if (!updated) return res.status(404).json({ error: 'NOT_FOUND', message: 'Application not found.' });
  return res.json({ message: 'Appointment booked.', savedAt: updated.updatedAt });
});

app.post('/api/applications/:id/submit', authMiddleware, async (req, res) => {
  const updated = await updateDb((db) => {
    const application = db.applications.find((a) => a.id === req.params.id && a.userId === req.userId);
    if (!application) return null;

    const personal = application.form?.personal || {};
    const identity = application.form?.identity || {};
    const service = application.form?.service || {};
    const hasDocs = (application.documents || []).some((d) => d.requirementId === 'photo');
    const hasAppt = Boolean(application.appointment?.slotStart);

    const missing = [];
    if (!(personal.fullName && personal.dob && personal.addressLine1 && personal.pincode)) missing.push('Personal details');
    if (!(identity.idType && identity.idNumber)) missing.push('Identity details');
    if (!(service.passportType && service.bookletPages && service.deliveryMode)) missing.push('Service preferences');
    if (!hasDocs) missing.push('Photo upload');
    if (!hasAppt) missing.push('Appointment booking');

    if (missing.length > 0) return { error: 'INCOMPLETE', missing };

    application.status = 'Submitted';
    application.submittedAt = nowIso();
    application.updatedAt = nowIso();

    return application;
  });

  if (!updated) return res.status(404).json({ error: 'NOT_FOUND', message: 'Application not found.' });
  if (updated.error === 'INCOMPLETE') {
    return res.status(400).json({
      error: 'INCOMPLETE',
      message: 'Finish the missing sections before submitting.',
      missing: updated.missing,
    });
  }

  return res.json({ message: 'Application submitted.', applicationId: updated.id });
});

app.get('/api/applications/:id/export/pdf', authMiddleware, async (req, res) => {
  const db = await readDb();
  const application = db.applications.find((a) => a.id === req.params.id && a.userId === req.userId);
  if (!application) return res.status(404).json({ error: 'NOT_FOUND', message: 'Application not found.' });
  const userSafe = await getUserSafe(req.userId);
  return renderApplicationPdf({ application, userSafe }, res);
});

app.get('/api/applications/:id/export/receipt', authMiddleware, async (req, res) => {
  const db = await readDb();
  const application = db.applications.find((a) => a.id === req.params.id && a.userId === req.userId);
  if (!application) return res.status(404).json({ error: 'NOT_FOUND', message: 'Application not found.' });
  const userSafe = await getUserSafe(req.userId);
  return renderAppointmentReceiptPdf({ application, userSafe }, res);
});

const PORT = Number(process.env.PORT || 3001);

await ensureDemoUser();

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Backend listening on http://localhost:${PORT}`);
});
