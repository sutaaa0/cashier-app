/*
  Warnings:

  - You are about to drop the `_PromotionCategories` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_PromotionProducts` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_PromotionCategories" DROP CONSTRAINT "_PromotionCategories_A_fkey";

-- DropForeignKey
ALTER TABLE "_PromotionCategories" DROP CONSTRAINT "_PromotionCategories_B_fkey";

-- DropForeignKey
ALTER TABLE "_PromotionProducts" DROP CONSTRAINT "_PromotionProducts_A_fkey";

-- DropForeignKey
ALTER TABLE "_PromotionProducts" DROP CONSTRAINT "_PromotionProducts_B_fkey";

-- DropTable
DROP TABLE "_PromotionCategories";

-- DropTable
DROP TABLE "_PromotionProducts";

-- CreateTable
CREATE TABLE "PromotionProduct" (
    "id" SERIAL NOT NULL,
    "promotionId" INTEGER NOT NULL,
    "produkId" INTEGER NOT NULL,
    "activeUntil" TIMESTAMP(3),

    CONSTRAINT "PromotionProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PromotionCategory" (
    "id" SERIAL NOT NULL,
    "promotionId" INTEGER NOT NULL,
    "kategoriId" INTEGER NOT NULL,

    CONSTRAINT "PromotionCategory_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PromotionProduct" ADD CONSTRAINT "PromotionProduct_promotionId_fkey" FOREIGN KEY ("promotionId") REFERENCES "Promotion"("promotionId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromotionProduct" ADD CONSTRAINT "PromotionProduct_produkId_fkey" FOREIGN KEY ("produkId") REFERENCES "Produk"("produkId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromotionCategory" ADD CONSTRAINT "PromotionCategory_promotionId_fkey" FOREIGN KEY ("promotionId") REFERENCES "Promotion"("promotionId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromotionCategory" ADD CONSTRAINT "PromotionCategory_kategoriId_fkey" FOREIGN KEY ("kategoriId") REFERENCES "Kategori"("kategoriId") ON DELETE RESTRICT ON UPDATE CASCADE;
