/*
  Warnings:

  - You are about to drop the column `diskonNominal` on the `DetailPenjualan` table. All the data in the column will be lost.
  - You are about to drop the column `diskonPersen` on the `DetailPenjualan` table. All the data in the column will be lost.
  - You are about to drop the column `hargaAsli` on the `DetailPenjualan` table. All the data in the column will be lost.
  - You are about to drop the column `promotionId` on the `DetailPenjualan` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "DetailPenjualan" DROP CONSTRAINT "DetailPenjualan_promotionId_fkey";

-- AlterTable
ALTER TABLE "DetailPenjualan" DROP COLUMN "diskonNominal",
DROP COLUMN "diskonPersen",
DROP COLUMN "hargaAsli",
DROP COLUMN "promotionId";
