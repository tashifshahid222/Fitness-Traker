const { z } = require('zod');

const updateUserSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100).optional(),
  username: z
    .string()
    .trim()
    .min(3, 'Username must be at least 3 characters')
    .max(30)
    .regex(/^[a-zA-Z0-9_]+$/, 'Username may only contain letters, numbers, and underscores')
    .optional(),
  profilePicture: z
    .string()
    .max(90000, 'Profile picture is too large')
    .refine(
      (v) => v === '' || /^https?:\/\//.test(v) || /^data:image\/(png|jpe?g|webp|gif);base64,/.test(v),
      'Profile picture must be an image URL or an uploaded image'
    )
    .optional(),
  preferences: z
    .object({
      theme: z.enum(['light', 'dark', 'system']).optional(),
      weightUnit: z.enum(['kg', 'lb']).optional(),
      notifications: z.boolean().optional(),
    })
    .optional(),
});

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(8, 'New password must be at least 8 characters').max(128),
  })
  .refine((v) => v.currentPassword !== v.newPassword, {
    message: 'New password must be different from the current password',
    path: ['newPassword'],
  });

const deleteAccountSchema = z.object({
  password: z.string().min(1, 'Password is required'),
});

module.exports = { updateUserSchema, changePasswordSchema, deleteAccountSchema };