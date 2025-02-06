-- CreateEnum
CREATE TYPE "ApplicableType" AS ENUM ('ALL', 'CATEGORY', 'SPECIFIC');

-- AlterTable
ALTER TABLE "Promotion" ADD COLUMN     "applicableType" "ApplicableType" NOT NULL DEFAULT 'ALL',
ADD COLUMN     "categoryIds" INTEGER[],
ADD COLUMN     "productIds" INTEGER[];
