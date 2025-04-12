-- CreateTable
CREATE TABLE "ResetSettings" (
    "id" SERIAL NOT NULL,
    "autoReset" BOOLEAN NOT NULL DEFAULT false,
    "scheduleType" TEXT NOT NULL,
    "resetDate" TIMESTAMP(3),
    "preserveMasterData" BOOLEAN NOT NULL DEFAULT true,
    "lastResetDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResetSettings_pkey" PRIMARY KEY ("id")
);
