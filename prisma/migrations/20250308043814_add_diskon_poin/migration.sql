/*
  Warnings:

  - You are about to drop the column `pointsAwarded` on the `Penjualan` table. All the data in the column will be lost.
  - You are about to drop the column `pointsDiscount` on the `Penjualan` table. All the data in the column will be lost.
  - You are about to drop the column `redeemedPoints` on the `Penjualan` table. All the data in the column will be lost.
  - You are about to drop the column `totalBeforeDiscount` on the `Penjualan` table. All the data in the column will be lost.
  - You are about to drop the column `totalPromotionDiscount` on the `Penjualan` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Penjualan" DROP COLUMN "pointsAwarded",
DROP COLUMN "pointsDiscount",
DROP COLUMN "redeemedPoints",
DROP COLUMN "totalBeforeDiscount",
DROP COLUMN "totalPromotionDiscount",
ADD COLUMN     "diskonPoin" INTEGER;
