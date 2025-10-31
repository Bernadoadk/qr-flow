/*
  Warnings:

  - The values [VIDEO] on the enum `QRType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "QRType_new" AS ENUM ('LINK', 'PRODUCT', 'LOYALTY', 'CAMPAIGN', 'HOMEPAGE', 'COLLECTION', 'ADD_TO_CART', 'CHECKOUT', 'DISCOUNT', 'TEXT', 'EMAIL', 'PHONE', 'SMS');
ALTER TABLE "public"."qrcodes" ALTER COLUMN "type" DROP DEFAULT;
ALTER TABLE "qrcodes" ALTER COLUMN "type" TYPE "QRType_new" USING ("type"::text::"QRType_new");
ALTER TYPE "QRType" RENAME TO "QRType_old";
ALTER TYPE "QRType_new" RENAME TO "QRType";
DROP TYPE "public"."QRType_old";
ALTER TABLE "qrcodes" ALTER COLUMN "type" SET DEFAULT 'LINK';
COMMIT;

-- AlterTable
ALTER TABLE "qrcodes" ADD COLUMN     "additionalData" JSONB,
ADD COLUMN     "backgroundColor" TEXT,
ADD COLUMN     "backgroundImage" TEXT,
ADD COLUMN     "designOptions" JSONB,
ADD COLUMN     "foregroundColor" TEXT,
ADD COLUMN     "frameStyle" JSONB,
ADD COLUMN     "logoStyle" JSONB;
