-- What a founder writes about an investor's stage and cheque, in their own
-- words ("Pre-Seed / Seed", "€25K–€150K"), for the fundraising API (docs §111).

-- AlterTable
ALTER TABLE "InvestorPipelineLead" ADD COLUMN     "checkSizeText" TEXT,
ADD COLUMN     "stageFocus" TEXT;
