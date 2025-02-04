/*
  Warnings:

  - You are about to drop the column `kategori` on the `Produk` table. All the data in the column will be lost.
  - Added the required column `kategoriId` to the `Produk` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Produk" DROP COLUMN "kategori",
ADD COLUMN     "kategoriId" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "Kategori" (
    "kategoriId" SERIAL NOT NULL,
    "nama" TEXT NOT NULL,

    CONSTRAINT "Kategori_pkey" PRIMARY KEY ("kategoriId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Kategori_nama_key" ON "Kategori"("nama");

-- AddForeignKey
ALTER TABLE "Produk" ADD CONSTRAINT "Produk_kategoriId_fkey" FOREIGN KEY ("kategoriId") REFERENCES "Kategori"("kategoriId") ON DELETE RESTRICT ON UPDATE CASCADE;
