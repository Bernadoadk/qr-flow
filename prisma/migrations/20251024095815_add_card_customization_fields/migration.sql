-- AlterTable
ALTER TABLE "campaigns" ADD COLUMN     "cardBackgroundColor" TEXT DEFAULT '#ffffff',
ADD COLUMN     "cardBackgroundGradient" BOOLEAN DEFAULT false,
ADD COLUMN     "cardBackgroundGradientColors" JSONB,
ADD COLUMN     "cardBackgroundGradientDirection" TEXT DEFAULT 'to right',
ADD COLUMN     "cardBorderColor" TEXT DEFAULT '#e5e7eb',
ADD COLUMN     "cardBorderRadius" INTEGER DEFAULT 8,
ADD COLUMN     "cardBorderWidth" INTEGER DEFAULT 1,
ADD COLUMN     "cardShadow" TEXT DEFAULT 'lg';
