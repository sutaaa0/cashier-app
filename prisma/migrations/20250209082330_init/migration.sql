-- CreateTable
CREATE TABLE "Receipt" (
    "id" SERIAL NOT NULL,
    "transactionId" TEXT NOT NULL,
    "penjualanId" INTEGER NOT NULL,
    "customerName" TEXT NOT NULL,
    "petugasId" INTEGER NOT NULL,
    "total" DOUBLE PRECISION NOT NULL,
    "items" JSONB NOT NULL,
    "pdfUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Receipt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Receipt_transactionId_key" ON "Receipt"("transactionId");

-- CreateIndex
CREATE UNIQUE INDEX "Receipt_penjualanId_key" ON "Receipt"("penjualanId");

-- AddForeignKey
ALTER TABLE "Receipt" ADD CONSTRAINT "Receipt_penjualanId_fkey" FOREIGN KEY ("penjualanId") REFERENCES "Penjualan"("penjualanId") ON DELETE RESTRICT ON UPDATE CASCADE;
