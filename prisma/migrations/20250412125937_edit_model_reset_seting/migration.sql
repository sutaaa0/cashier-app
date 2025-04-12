/*
  Warnings:

  - You are about to drop the column `autoReset` on the `ResetSettings` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `ResetSettings` table. All the data in the column will be lost.
  - You are about to drop the column `resetDate` on the `ResetSettings` table. All the data in the column will be lost.
  - You are about to drop the column `scheduleType` on the `ResetSettings` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "ResetSettings" DROP COLUMN "autoReset",
DROP COLUMN "createdAt",
DROP COLUMN "resetDate",
DROP COLUMN "scheduleType",
ADD COLUMN     "confirmationCode" TEXT NOT NULL DEFAULT 'RESET-DB';
