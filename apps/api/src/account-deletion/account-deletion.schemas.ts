import { z } from 'zod';

/** `POST /account/delete`. Which of these is needed comes from `GET /account/deletion`. */
export const deleteAccountSchema = z.object({
  password: z.string().min(1).max(200).optional(),
  email: z.string().trim().max(254).optional(),
  code: z.string().trim().min(6).max(16).optional(),
});

export type DeleteAccount = z.infer<typeof deleteAccountSchema>;
