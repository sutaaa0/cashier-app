/*
  Warnings:

  - You are about to drop the column `deskripsi` on the `Promotion` table. All the data in the column will be lost.
  - You are about to drop the column `hariPromosi` on the `Promotion` table. All the data in the column will be lost.
  - You are about to drop the column `maximumDiskon` on the `Promotion` table. All the data in the column will be lost.
  - You are about to drop the column `minimumPembelian` on the `Promotion` table. All the data in the column will be lost.
  - You are about to drop the column `nama` on the `Promotion` table. All the data in the column will be lost.
  - You are about to drop the column `nilaiDiskon` on the `Promotion` table. All the data in the column will be lost.
  - You are about to drop the column `tanggalBerakhir` on the `Promotion` table. All the data in the column will be lost.
  - You are about to drop the column `tanggalMulai` on the `Promotion` table. All the data in the column will be lost.
  - You are about to drop the column `tipeDiskon` on the `Promotion` table. All the data in the column will be lost.
  - Added the required column `applicableProducts` to the `Promotion` table without a default value. This is not possible if the table is not empty.
  - Added the required column `discountType` to the `Promotion` table without a default value. This is not possible if the table is not empty.
  - Added the required column `discountValue` to the `Promotion` table without a default value. This is not possible if the table is not empty.
  - Added the required column `endDate` to the `Promotion` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `Promotion` table without a default value. This is not possible if the table is not empty.
  - Added the required column `startDate` to the `Promotion` table without a default value. This is not possible if the table is not empty.
  - Added the required column `status` to the `Promotion` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Promotion" DROP COLUMN "deskripsi",
DROP COLUMN "hariPromosi",
DROP COLUMN "maximumDiskon",
DROP COLUMN "minimumPembelian",
DROP COLUMN "nama",
DROP COLUMN "nilaiDiskon",
DROP COLUMN "tanggalBerakhir",
DROP COLUMN "tanggalMulai",
DROP COLUMN "tipeDiskon",
ADD COLUMN     "applicableProducts" TEXT NOT NULL,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "discountType" TEXT NOT NULL,
ADD COLUMN     "discountValue" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "endDate" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "maximumDiscount" DOUBLE PRECISION,
ADD COLUMN     "minimumPurchase" DOUBLE PRECISION,
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "productCategories" TEXT[],
ADD COLUMN     "startDate" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "status" TEXT NOT NULL;
