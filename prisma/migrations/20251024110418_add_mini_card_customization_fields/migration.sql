-- AlterTable
ALTER TABLE "campaigns" ADD COLUMN     "miniCardBackgroundColor" TEXT DEFAULT '#ffffff',
ADD COLUMN     "miniCardBackgroundGradient" BOOLEAN DEFAULT false,
ADD COLUMN     "miniCardBackgroundGradientColors" JSONB,
ADD COLUMN     "miniCardBackgroundGradientDirection" TEXT DEFAULT 'to right',
ADD COLUMN     "miniCardBorderColor" TEXT DEFAULT '#e5e7eb',
ADD COLUMN     "miniCardBorderRadius" INTEGER DEFAULT 8,
ADD COLUMN     "miniCardBorderWidth" INTEGER DEFAULT 1,
ADD COLUMN     "miniCardShadow" TEXT DEFAULT 'md';
