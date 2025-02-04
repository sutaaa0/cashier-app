/*
  Warnings:

  - You are about to drop the column `promotionId` on the `DetailPenjualan` table. All the data in the column will be lost.
  - You are about to drop the column `promotionId` on the `Kategori` table. All the data in the column will be lost.
  - You are about to drop the column `applicableProducts` on the `Promotion` table. All the data in the column will be lost.
  - You are about to drop the column `maximumDiscount` on the `Promotion` table. All the data in the column will be lost.
  - You are about to drop the column `minimumPurchase` on the `Promotion` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `Promotion` table. All the data in the column will be lost.
  - Added the required column `appliesTo` to the `Promotion` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Promotion` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `discountType` on the `Promotion` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropForeignKey
ALTER TABLE "DetailPenjualan" DROP CONSTRAINT "DetailPenjualan_promotionId_fkey";

-- DropForeignKey
ALTER TABLE "Kategori" DROP CONSTRAINT "Kategori_promotionId_fkey";

-- AlterTable
ALTER TABLE "DetailPenjualan" DROP COLUMN "promotionId";

-- AlterTable
ALTER TABLE "Kategori" DROP COLUMN "promotionId";

-- AlterTable
ALTER TABLE "Promotion" DROP COLUMN "applicableProducts",
DROP COLUMN "maximumDiscount",
DROP COLUMN "minimumPurchase",
DROP COLUMN "status",
ADD COLUMN     "appliesTo" TEXT NOT NULL,
ADD COLUMN     "categoryIds" INTEGER[],
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "maxDiscount" DOUBLE PRECISION,
ADD COLUMN     "minPurchase" DOUBLE PRECISION,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
DROP COLUMN "discountType",
ADD COLUMN     "discountType" TEXT NOT NULL,
ALTER COLUMN "discountValue" SET DATA TYPE DOUBLE PRECISION;
