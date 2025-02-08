-- AddForeignKey
ALTER TABLE "Refund" ADD CONSTRAINT "Refund_penjualanId_fkey" FOREIGN KEY ("penjualanId") REFERENCES "Penjualan"("penjualanId") ON DELETE RESTRICT ON UPDATE CASCADE;
