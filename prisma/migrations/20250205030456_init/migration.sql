/*
  Warnings:

  - You are about to drop the column `diskonAmount` on the `DetailPenjualan` table. All the data in the column will be lost.
  - You are about to drop the column `promotionId` on the `DetailPenjualan` table. All the data in the column will be lost.
  - You are about to drop the `ProdukPromosi` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Promotion` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "ProdukPromosi" DROP CONSTRAINT "ProdukPromosi_produkId_fkey";

-- DropForeignKey
ALTER TABLE "ProdukPromosi" DROP CONSTRAINT "ProdukPromosi_promotionId_fkey";

-- AlterTable
ALTER TABLE "DetailPenjualan" DROP COLUMN "diskonAmount",
DROP COLUMN "promotionId";

-- DropTable
DROP TABLE "ProdukPromosi";

-- DropTable
DROP TABLE "Promotion";

-- DropEnum
DROP TYPE "ApplicableType";
