-- CreateEnum
CREATE TYPE "PromotionType" AS ENUM ('FLASH_SALE', 'SPECIAL_DAY', 'WEEKEND', 'PRODUCT_SPECIFIC', 'QUANTITY_BASED');

-- CreateTable
CREATE TABLE "Promotion" (
    "promotionId" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" "PromotionType" NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "discountPercentage" DOUBLE PRECISION,
    "discountAmount" DOUBLE PRECISION,
    "minQuantity" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Promotion_pkey" PRIMARY KEY ("promotionId")
);

-- CreateTable
CREATE TABLE "PromotionProduct" (
    "id" SERIAL NOT NULL,
    "promotionId" INTEGER NOT NULL,
    "produkId" INTEGER NOT NULL,

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
