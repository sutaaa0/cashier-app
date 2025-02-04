/*
  Warnings:

  - Added the required column `hargaSaatIni` to the `DetailPenjualan` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "DetailPenjualan" ADD COLUMN     "hargaSaatIni" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Penjualan" ADD COLUMN     "userId" INTEGER;

-- CreateIndex
CREATE INDEX "DetailPenjualan_produkId_idx" ON "DetailPenjualan"("produkId");

-- CreateIndex
CREATE INDEX "Pelanggan_nama_idx" ON "Pelanggan"("nama");

-- CreateIndex
CREATE INDEX "Penjualan_tanggalPenjualan_idx" ON "Penjualan"("tanggalPenjualan");

-- CreateIndex
CREATE INDEX "Penjualan_userId_idx" ON "Penjualan"("userId");

-- CreateIndex
CREATE INDEX "Produk_kategori_idx" ON "Produk"("kategori");

-- CreateIndex
CREATE INDEX "Produk_stok_idx" ON "Produk"("stok");

-- AddForeignKey
ALTER TABLE "Penjualan" ADD CONSTRAINT "Penjualan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
