/*
  Warnings:

  - You are about to drop the column `deskripsiDiskon` on the `DetailPenjualan` table. All the data in the column will be lost.
  - You are about to drop the column `namaDiskon` on the `DetailPenjualan` table. All the data in the column will be lost.
  - You are about to drop the column `nominalDiskon` on the `DetailPenjualan` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "DetailPenjualan" DROP COLUMN "deskripsiDiskon",
DROP COLUMN "namaDiskon",
DROP COLUMN "nominalDiskon";
