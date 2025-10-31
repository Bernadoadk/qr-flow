-- AlterTable
ALTER TABLE "campaigns" ADD COLUMN     "ctaButtonColorGradient" BOOLEAN DEFAULT false,
ADD COLUMN     "ctaButtonColorGradientColors" JSONB,
ADD COLUMN     "ctaButtonColorGradientDirection" TEXT DEFAULT 'to right';
