-- AlterTable
ALTER TABLE "DetailPenjualan" ADD COLUMN     "diskonNominal" INTEGER,
ADD COLUMN     "diskonPersen" DOUBLE PRECISION,
ADD COLUMN     "hargaAsli" INTEGER,
ADD COLUMN     "promotionId" INTEGER;
