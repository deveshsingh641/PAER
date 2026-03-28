import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const requestOtpSchema = z.object({
  phone: z.string().min(8).max(20),
});

export const verifyOtpSchema = z.object({
  challengeId: z.string().min(1),
  otp: z.string().min(4).max(8),
  name: z.string().min(1).optional(),
});

export const updateProfileSchema = z.object({
  name: z.string().min(1).optional(),
  dob: z.string().min(1).optional(),
  city: z.string().min(1).optional(),
});

export const startApplicationSchema = z.object({
  city: z.string().min(1).optional(),
});

export const applicationPatchSchema = z.object({
  onboarding: z
    .object({
      fullName: z.string().min(1).optional(),
      dob: z.string().min(1).optional(),
      city: z.string().min(1).optional(),
    })
    .optional(),
  form: z
    .object({
      personal: z
        .object({
          fullName: z.string().min(1).optional(),
          dob: z.string().min(1).optional(),
          gender: z.enum(['Female', 'Male', 'Other', 'Prefer not to say']).optional(),
          addressLine1: z.string().min(1).optional(),
          addressLine2: z.string().optional(),
          pincode: z.string().min(4).max(10).optional(),
        })
        .optional(),
      identity: z
        .object({
          idType: z.enum(['National ID', 'Driver License', 'Student ID', 'Other']).optional(),
          idNumber: z.string().min(3).max(32).optional(),
        })
        .optional(),
      service: z
        .object({
          passportType: z.enum(['New Passport', 'Re-issue / Renewal']).optional(),
          bookletPages: z.enum(['36', '60']).optional(),
          deliveryMode: z.enum(['Standard', 'Tatkal']).optional(),
        })
        .optional(),
    })
    .optional(),
});

export function zodBody(schema) {
  return (req, res, next) => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      const first = parsed.error.issues?.[0];
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: first?.message || 'Invalid input.',
        issues: parsed.error.issues,
      });
    }
    req.validatedBody = parsed.data;
    return next();
  };
}
