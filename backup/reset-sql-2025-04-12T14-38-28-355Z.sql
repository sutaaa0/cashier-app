
      -- Matikan semua trigger dan foreign key constraint sementara
      SET session_replication_role = 'replica';
      
      -- Hapus data dari tabel-tabel dengan urutan yang benar (dari leaf ke root)
      DELETE FROM "DetailRefund";
      DELETE FROM "DetailPenjualan";
      DELETE FROM "PromotionProduct";
      DELETE FROM "Promotion";
      DELETE FROM "Refund";
      DELETE FROM "Penjualan";
      DELETE FROM "Guest";
      DELETE FROM "Pelanggan";
      
      -- Reset sequence untuk ID auto-increment
      ALTER SEQUENCE "DetailRefund_detailRefundId_seq" RESTART WITH 1;
      ALTER SEQUENCE "DetailPenjualan_detailId_seq" RESTART WITH 1;
      ALTER SEQUENCE "PromotionProduct_id_seq" RESTART WITH 1;
      ALTER SEQUENCE "Promotion_promotionId_seq" RESTART WITH 1;
      ALTER SEQUENCE "Refund_refundId_seq" RESTART WITH 1;
      ALTER SEQUENCE "Penjualan_penjualanId_seq" RESTART WITH 1;
      ALTER SEQUENCE "Guest_guestId_seq" RESTART WITH 1;
      ALTER SEQUENCE "Pelanggan_pelangganId_seq" RESTART WITH 1;
      
      -- Aktifkan kembali semua trigger dan constraint
      SET session_replication_role = 'origin';
      
      -- Verifikasi
      SELECT 'Setelah reset: ' || 
        (SELECT COUNT(*) FROM "Penjualan") || ' Penjualan, ' ||
        (SELECT COUNT(*) FROM "DetailPenjualan") || ' DetailPenjualan';
      