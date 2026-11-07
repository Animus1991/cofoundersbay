import { DataRoomDocCategory, DataRoomDocStatus, FundraisingRoundStatus, FundraisingRoundType, InvestorLeadStatus } from '@prisma/client';
import { CAP_TABLE_KINDS, CAP_TABLE_LIMITS } from '@cofounderbay/shared';
import { z } from 'zod';

/** Decimal(18, 2) holds this; anything larger is a typing slip, not a round. */
const amount = z.number().finite().min(0).max(1e13);
const text = (max: number) => z.string().trim().min(1).max(max);
const optionalText = (max: number) => z.string().trim().max(max).nullish().transform((v) => v || null);
const day = z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).nullish().transform((v) => (v ? new Date(v) : null));

export const createRoundSchema = z.object({
  name: text(120),
  roundType: z.nativeEnum(FundraisingRoundType).default(FundraisingRoundType.seed),
  status: z.nativeEnum(FundraisingRoundStatus).default(FundraisingRoundStatus.planning),
  targetAmount: amount.nullish(),
  currency: z.string().trim().length(3).transform((v) => v.toUpperCase()).default('EUR'),
  preMoneyValuation: amount.nullish(),
  leadInvestorName: optionalText(120),
  closingDate: day,
  description: optionalText(2000),
});
export const updateRoundSchema = createRoundSchema.partial().extend({
  capTable: z.array(z.object({
    id: z.string().min(1).max(60),
    name: text(CAP_TABLE_LIMITS.name),
    kind: z.enum(CAP_TABLE_KINDS),
    shares: z.number().finite().positive().max(CAP_TABLE_LIMITS.shares),
  })).max(CAP_TABLE_LIMITS.holders).optional(),
});

export const createLeadSchema = z.object({
  investorName: text(120),
  investorFirm: optionalText(120),
  investorEmail: z.string().trim().email().max(200).or(z.literal('')).nullish().transform((v) => v || null),
  investorType: optionalText(40),
  stageFocus: optionalText(80),
  checkSizeText: optionalText(80),
  status: z.nativeEnum(InvestorLeadStatus).default(InvestorLeadStatus.prospect),
  committedAmount: amount.nullish(),
  notes: optionalText(2000),
  nextFollowUpAt: day,
  nextStep: optionalText(200),
});
export const updateLeadSchema = createLeadSchema.partial().extend({
  /** The investor's own account: what lets them open shared files. Null unlinks, and access ends with it. */
  platformUserId: z.string().uuid().nullable().optional(),
});

export const documentFieldsSchema = z.object({
  name: text(160).optional(),
  category: z.nativeEnum(DataRoomDocCategory).default(DataRoomDocCategory.other),
  isRequired: z.preprocess((v) => v === 'true' || v === true, z.boolean()).default(false),
});

export const updateDocumentSchema = z.object({
  name: text(160).optional(),
  category: z.nativeEnum(DataRoomDocCategory).optional(),
  status: z.nativeEnum(DataRoomDocStatus).optional(),
  isRequired: z.boolean().optional(),
});

export const shareDocumentsSchema = z.object({
  documentIds: z.array(z.string().uuid()).min(1).max(100),
  shared: z.boolean(),
});

export const investorSearchSchema = z.object({ q: z.string().trim().min(2).max(80) });

/** Thirty days at most: a link meant to last is an account's job. */
export const createRoomLinkSchema = z.object({
  label: optionalText(120),
  days: z.number().int().min(1).max(30).default(7),
});

export type CreateRound = z.infer<typeof createRoundSchema>;
export type UpdateRound = z.infer<typeof updateRoundSchema>;
export type CreateLead = z.infer<typeof createLeadSchema>;
export type UpdateLead = z.infer<typeof updateLeadSchema>;
export type UpdateDocument = z.infer<typeof updateDocumentSchema>;
export type ShareDocuments = z.infer<typeof shareDocumentsSchema>;
export type CreateRoomLink = z.infer<typeof createRoomLinkSchema>;
