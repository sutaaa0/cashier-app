/*
  Warnings:

  - You are about to alter the column `kembalian` on the `Penjualan` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.
  - You are about to alter the column `uangMasuk` on the `Penjualan` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.

*/
-- AlterTable
ALTER TABLE "Penjualan" ALTER COLUMN "kembalian" SET DATA TYPE INTEGER,
ALTER COLUMN "uangMasuk" SET DATA TYPE INTEGER;
