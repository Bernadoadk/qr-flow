-- AlterTable
ALTER TABLE "campaigns" ADD COLUMN     "backgroundColorGradient" BOOLEAN DEFAULT false,
ADD COLUMN     "backgroundGradientColors" JSONB,
ADD COLUMN     "backgroundGradientDirection" TEXT DEFAULT 'to right',
ADD COLUMN     "fontSize" INTEGER DEFAULT 16,
ADD COLUMN     "fontWeight" TEXT DEFAULT 'normal',
ADD COLUMN     "primaryColorGradient" BOOLEAN DEFAULT false,
ADD COLUMN     "primaryGradientColors" JSONB,
ADD COLUMN     "primaryGradientDirection" TEXT DEFAULT 'to right',
ADD COLUMN     "secondaryColorGradient" BOOLEAN DEFAULT false,
ADD COLUMN     "secondaryGradientColors" JSONB,
ADD COLUMN     "secondaryGradientDirection" TEXT DEFAULT 'to right';
