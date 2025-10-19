-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "EventType" ADD VALUE 'UPSELL_CLICK';
ALTER TYPE "EventType" ADD VALUE 'CROSS_SELL_CLICK';
ALTER TYPE "EventType" ADD VALUE 'PROMO_CODE_USED';

-- AlterTable
ALTER TABLE "qrcodes" ADD COLUMN     "landingPage" JSONB,
ADD COLUMN     "upsellConfig" JSONB;
