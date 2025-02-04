/*
  Warnings:

  - You are about to drop the column `hargaSaatIni` on the `DetailPenjualan` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `Penjualan` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Penjualan" DROP CONSTRAINT "Penjualan_userId_fkey";

-- DropIndex
DROP INDEX "DetailPenjualan_produkId_idx";

-- DropIndex
DROP INDEX "Pelanggan_nama_idx";

-- DropIndex
DROP INDEX "Penjualan_tanggalPenjualan_idx";

-- DropIndex
DROP INDEX "Penjualan_userId_idx";

-- DropIndex
DROP INDEX "Produk_kategori_idx";

-- DropIndex
DROP INDEX "Produk_stok_idx";

-- AlterTable
ALTER TABLE "DetailPenjualan" DROP COLUMN "hargaSaatIni";

-- AlterTable
ALTER TABLE "Penjualan" DROP COLUMN "userId";
