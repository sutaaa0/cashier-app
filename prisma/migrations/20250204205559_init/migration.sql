-- AlterTable
ALTER TABLE "DetailPenjualan" ADD COLUMN     "diskonAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "promotionId" INTEGER;

-- CreateTable
CREATE TABLE "Promotion" (
    "promotionId" SERIAL NOT NULL,
    "nama" TEXT NOT NULL,
    "deskripsi" TEXT,
    "tipeDiskon" TEXT NOT NULL,
    "nilaiDiskon" DOUBLE PRECISION NOT NULL,
    "tanggalMulai" TIMESTAMP(3) NOT NULL,
    "tanggalBerakhir" TIMESTAMP(3) NOT NULL,
    "hariPromosi" TEXT[],
    "minimumPembelian" DOUBLE PRECISION,
    "maximumDiskon" DOUBLE PRECISION,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Promotion_pkey" PRIMARY KEY ("promotionId")
);

-- CreateTable
CREATE TABLE "ProdukPromosi" (
    "id" SERIAL NOT NULL,
    "promotionId" INTEGER NOT NULL,
    "produkId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProdukPromosi_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProdukPromosi_promotionId_produkId_key" ON "ProdukPromosi"("promotionId", "produkId");

-- AddForeignKey
ALTER TABLE "ProdukPromosi" ADD CONSTRAINT "ProdukPromosi_promotionId_fkey" FOREIGN KEY ("promotionId") REFERENCES "Promotion"("promotionId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProdukPromosi" ADD CONSTRAINT "ProdukPromosi_produkId_fkey" FOREIGN KEY ("produkId") REFERENCES "Produk"("produkId") ON DELETE RESTRICT ON UPDATE CASCADE;
