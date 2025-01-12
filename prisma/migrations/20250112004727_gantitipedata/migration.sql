/*
  Warnings:

  - The primary key for the `DetailPenjualan` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `Penjualan` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `Produk` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `User` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- DropForeignKey
ALTER TABLE "DetailPenjualan" DROP CONSTRAINT "DetailPenjualan_idPenjualan_fkey";

-- DropForeignKey
ALTER TABLE "DetailPenjualan" DROP CONSTRAINT "DetailPenjualan_idProduk_fkey";

-- DropForeignKey
ALTER TABLE "Penjualan" DROP CONSTRAINT "Penjualan_idUser_fkey";

-- AlterTable
ALTER TABLE "DetailPenjualan" DROP CONSTRAINT "DetailPenjualan_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "idPenjualan" SET DATA TYPE TEXT,
ALTER COLUMN "idProduk" SET DATA TYPE TEXT,
ADD CONSTRAINT "DetailPenjualan_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "DetailPenjualan_id_seq";

-- AlterTable
ALTER TABLE "Penjualan" DROP CONSTRAINT "Penjualan_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "idUser" SET DATA TYPE TEXT,
ADD CONSTRAINT "Penjualan_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Penjualan_id_seq";

-- AlterTable
ALTER TABLE "Produk" DROP CONSTRAINT "Produk_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "Produk_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Produk_id_seq";

-- AlterTable
ALTER TABLE "User" DROP CONSTRAINT "User_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "User_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "User_id_seq";

-- AddForeignKey
ALTER TABLE "Penjualan" ADD CONSTRAINT "Penjualan_idUser_fkey" FOREIGN KEY ("idUser") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DetailPenjualan" ADD CONSTRAINT "DetailPenjualan_idPenjualan_fkey" FOREIGN KEY ("idPenjualan") REFERENCES "Penjualan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DetailPenjualan" ADD CONSTRAINT "DetailPenjualan_idProduk_fkey" FOREIGN KEY ("idProduk") REFERENCES "Produk"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
