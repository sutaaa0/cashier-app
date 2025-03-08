-- AlterTable
ALTER TABLE "Penjualan" ADD COLUMN     "pointsAwarded" INTEGER,
ADD COLUMN     "pointsDiscount" DOUBLE PRECISION,
ADD COLUMN     "redeemedPoints" INTEGER,
ADD COLUMN     "totalBeforeDiscount" DOUBLE PRECISION,
ADD COLUMN     "totalPromotionDiscount" DOUBLE PRECISION;
