import { DataRoomDocCategory, DataRoomDocStatus, FundraisingRoundStatus, FundraisingRoundType, InvestorLeadStatus } from '@prisma/client';
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
export const updateRoundSchema = createRoundSchema.partial();

export const createLeadSchema = z.object({
  investorName: text(120),
  investorFirm: optionalText(120),
  investorType: optionalText(40),
  stageFocus: optionalText(80),
  checkSizeText: optionalText(80),
  status: z.nativeEnum(InvestorLeadStatus).default(InvestorLeadStatus.prospect),
  committedAmount: amount.nullish(),
  notes: optionalText(2000),
});
export const updateLeadSchema = createLeadSchema.partial();

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

export type CreateRound = z.infer<typeof createRoundSchema>;
export type UpdateRound = z.infer<typeof updateRoundSchema>;
export type CreateLead = z.infer<typeof createLeadSchema>;
export type UpdateLead = z.infer<typeof updateLeadSchema>;
export type UpdateDocument = z.infer<typeof updateDocumentSchema>;
