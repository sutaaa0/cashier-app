/*
  Warnings:

  - A unique constraint covering the columns `[nomorTelepon]` on the table `Pelanggan` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Pelanggan_nomorTelepon_key" ON "Pelanggan"("nomorTelepon");
