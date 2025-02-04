/*
  Warnings:

  - Added the required column `icon` to the `Kategori` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Kategori" ADD COLUMN     "icon" TEXT NOT NULL;
