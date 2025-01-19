-- DropForeignKey
ALTER TABLE "Penjualan" DROP CONSTRAINT "Penjualan_pelangganId_fkey";

-- AlterTable
ALTER TABLE "Penjualan" ADD COLUMN     "guestId" INTEGER,
ALTER COLUMN "pelangganId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "Guest" (
    "guestId" SERIAL NOT NULL,

    CONSTRAINT "Guest_pkey" PRIMARY KEY ("guestId")
);

-- AddForeignKey
ALTER TABLE "Penjualan" ADD CONSTRAINT "Penjualan_pelangganId_fkey" FOREIGN KEY ("pelangganId") REFERENCES "Pelanggan"("pelangganId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Penjualan" ADD CONSTRAINT "Penjualan_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "Guest"("guestId") ON DELETE SET NULL ON UPDATE CASCADE;
