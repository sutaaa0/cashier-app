/*
  Warnings:

  - You are about to drop the `PromotionCategory` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "PromotionCategory" DROP CONSTRAINT "PromotionCategory_kategoriId_fkey";

-- DropForeignKey
ALTER TABLE "PromotionCategory" DROP CONSTRAINT "PromotionCategory_promotionId_fkey";

-- DropTable
DROP TABLE "PromotionCategory";
