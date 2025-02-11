/*
  Warnings:

  - You are about to drop the `PromotionCategory` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PromotionProduct` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "PromotionCategory" DROP CONSTRAINT "PromotionCategory_kategoriId_fkey";

-- DropForeignKey
ALTER TABLE "PromotionCategory" DROP CONSTRAINT "PromotionCategory_promotionId_fkey";

-- DropForeignKey
ALTER TABLE "PromotionProduct" DROP CONSTRAINT "PromotionProduct_produkId_fkey";

-- DropForeignKey
ALTER TABLE "PromotionProduct" DROP CONSTRAINT "PromotionProduct_promotionId_fkey";

-- DropTable
DROP TABLE "PromotionCategory";

-- DropTable
DROP TABLE "PromotionProduct";

-- CreateTable
CREATE TABLE "_PromotionCategories" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_PromotionCategories_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_PromotionProducts" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_PromotionProducts_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_PromotionCategories_B_index" ON "_PromotionCategories"("B");

-- CreateIndex
CREATE INDEX "_PromotionProducts_B_index" ON "_PromotionProducts"("B");

-- AddForeignKey
ALTER TABLE "_PromotionCategories" ADD CONSTRAINT "_PromotionCategories_A_fkey" FOREIGN KEY ("A") REFERENCES "Kategori"("kategoriId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PromotionCategories" ADD CONSTRAINT "_PromotionCategories_B_fkey" FOREIGN KEY ("B") REFERENCES "Promotion"("promotionId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PromotionProducts" ADD CONSTRAINT "_PromotionProducts_A_fkey" FOREIGN KEY ("A") REFERENCES "Produk"("produkId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PromotionProducts" ADD CONSTRAINT "_PromotionProducts_B_fkey" FOREIGN KEY ("B") REFERENCES "Promotion"("promotionId") ON DELETE CASCADE ON UPDATE CASCADE;
