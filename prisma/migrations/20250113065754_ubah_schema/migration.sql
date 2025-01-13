/*
  Warnings:

  - The primary key for the `DetailPenjualan` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `DetailPenjualan` table. All the data in the column will be lost.
  - You are about to drop the column `idPenjualan` on the `DetailPenjualan` table. All the data in the column will be lost.
  - You are about to drop the column `idProduk` on the `DetailPenjualan` table. All the data in the column will be lost.
  - The primary key for the `Penjualan` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `Penjualan` table. All the data in the column will be lost.
  - You are about to drop the column `idUser` on the `Penjualan` table. All the data in the column will be lost.
  - You are about to drop the column `tanggal` on the `Penjualan` table. All the data in the column will be lost.
  - The primary key for the `Produk` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `Produk` table. All the data in the column will be lost.
  - The primary key for the `User` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `User` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `penjualanId` to the `DetailPenjualan` table without a default value. This is not possible if the table is not empty.
  - Added the required column `produkId` to the `DetailPenjualan` table without a default value. This is not possible if the table is not empty.
  - Added the required column `pelangganId` to the `Penjualan` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "DetailPenjualan" DROP CONSTRAINT "DetailPenjualan_idPenjualan_fkey";

-- DropForeignKey
ALTER TABLE "DetailPenjualan" DROP CONSTRAINT "DetailPenjualan_idProduk_fkey";

-- DropForeignKey
ALTER TABLE "Penjualan" DROP CONSTRAINT "Penjualan_idUser_fkey";

-- AlterTable
ALTER TABLE "DetailPenjualan" DROP CONSTRAINT "DetailPenjualan_pkey",
DROP COLUMN "id",
DROP COLUMN "idPenjualan",
DROP COLUMN "idProduk",
ADD COLUMN     "detailId" SERIAL NOT NULL,
ADD COLUMN     "penjualanId" INTEGER NOT NULL,
ADD COLUMN     "produkId" INTEGER NOT NULL,
ADD CONSTRAINT "DetailPenjualan_pkey" PRIMARY KEY ("detailId");

-- AlterTable
ALTER TABLE "Penjualan" DROP CONSTRAINT "Penjualan_pkey",
DROP COLUMN "id",
DROP COLUMN "idUser",
DROP COLUMN "tanggal",
ADD COLUMN     "pelangganId" INTEGER NOT NULL,
ADD COLUMN     "penjualanId" SERIAL NOT NULL,
ADD COLUMN     "tanggalPenjualan" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "total_harga" SET DATA TYPE DOUBLE PRECISION,
ADD CONSTRAINT "Penjualan_pkey" PRIMARY KEY ("penjualanId");

-- AlterTable
ALTER TABLE "Produk" DROP CONSTRAINT "Produk_pkey",
DROP COLUMN "id",
ADD COLUMN     "produkId" SERIAL NOT NULL,
ADD CONSTRAINT "Produk_pkey" PRIMARY KEY ("produkId");

-- AlterTable
ALTER TABLE "User" DROP CONSTRAINT "User_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "User_pkey" PRIMARY KEY ("id");

-- CreateTable
CREATE TABLE "Pelanggan" (
    "pelangganId" SERIAL NOT NULL,
    "nama" TEXT NOT NULL,
    "alamat" TEXT NOT NULL,
    "nomorTelepon" TEXT NOT NULL,

    CONSTRAINT "Pelanggan_pkey" PRIMARY KEY ("pelangganId")
);

-- AddForeignKey
ALTER TABLE "Penjualan" ADD CONSTRAINT "Penjualan_pelangganId_fkey" FOREIGN KEY ("pelangganId") REFERENCES "Pelanggan"("pelangganId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DetailPenjualan" ADD CONSTRAINT "DetailPenjualan_penjualanId_fkey" FOREIGN KEY ("penjualanId") REFERENCES "Penjualan"("penjualanId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DetailPenjualan" ADD CONSTRAINT "DetailPenjualan_produkId_fkey" FOREIGN KEY ("produkId") REFERENCES "Produk"("produkId") ON DELETE RESTRICT ON UPDATE CASCADE;
