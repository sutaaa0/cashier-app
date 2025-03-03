-- AddForeignKey
ALTER TABLE "DetailPenjualan" ADD CONSTRAINT "DetailPenjualan_promotionId_fkey" FOREIGN KEY ("promotionId") REFERENCES "Promotion"("promotionId") ON DELETE SET NULL ON UPDATE CASCADE;
