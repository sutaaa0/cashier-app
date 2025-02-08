-- CreateTable
CREATE TABLE "Refund" (
    "refundId" SERIAL NOT NULL,
    "penjualanId" INTEGER NOT NULL,
    "tanggalRefund" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "totalRefund" DOUBLE PRECISION NOT NULL,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "Refund_pkey" PRIMARY KEY ("refundId")
);

-- CreateTable
CREATE TABLE "DetailRefund" (
    "detailRefundId" SERIAL NOT NULL,
    "refundId" INTEGER NOT NULL,
    "produkId" INTEGER NOT NULL,
    "kuantitas" INTEGER NOT NULL,

    CONSTRAINT "DetailRefund_pkey" PRIMARY KEY ("detailRefundId")
);

-- AddForeignKey
ALTER TABLE "Refund" ADD CONSTRAINT "Refund_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DetailRefund" ADD CONSTRAINT "DetailRefund_refundId_fkey" FOREIGN KEY ("refundId") REFERENCES "Refund"("refundId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DetailRefund" ADD CONSTRAINT "DetailRefund_produkId_fkey" FOREIGN KEY ("produkId") REFERENCES "Produk"("produkId") ON DELETE RESTRICT ON UPDATE CASCADE;
