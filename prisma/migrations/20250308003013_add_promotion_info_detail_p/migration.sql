-- AlterTable
ALTER TABLE "DetailPenjualan" ADD COLUMN     "discountAmount" DOUBLE PRECISION,
ADD COLUMN     "discountPercentage" DOUBLE PRECISION,
ADD COLUMN     "promotionId" INTEGER,
ADD COLUMN     "promotionTitle" TEXT;
