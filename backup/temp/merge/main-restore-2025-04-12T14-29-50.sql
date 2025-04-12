
-- Enable dblink extension if not already enabled
CREATE EXTENSION IF NOT EXISTS dblink;

-- Truncate all transaction tables but keep master data

-- Disable triggers temporarily
SET session_replication_role = 'replica';

-- Truncate transaction tables
TRUNCATE TABLE "DetailRefund" RESTART IDENTITY CASCADE;
TRUNCATE TABLE "DetailPenjualan" RESTART IDENTITY CASCADE;
TRUNCATE TABLE "PromotionProduct" RESTART IDENTITY CASCADE;
TRUNCATE TABLE "Promotion" RESTART IDENTITY CASCADE;
TRUNCATE TABLE "Refund" RESTART IDENTITY CASCADE;
TRUNCATE TABLE "Penjualan" RESTART IDENTITY CASCADE;
TRUNCATE TABLE "Guest" RESTART IDENTITY CASCADE;
TRUNCATE TABLE "Pelanggan" RESTART IDENTITY CASCADE;

-- Reset sequences
ALTER SEQUENCE "DetailRefund_detailRefundId_seq" RESTART WITH 1;
ALTER SEQUENCE "DetailPenjualan_detailId_seq" RESTART WITH 1;
ALTER SEQUENCE "PromotionProduct_id_seq" RESTART WITH 1;
ALTER SEQUENCE "Promotion_promotionId_seq" RESTART WITH 1;
ALTER SEQUENCE "Refund_refundId_seq" RESTART WITH 1;
ALTER SEQUENCE "Penjualan_penjualanId_seq" RESTART WITH 1;
ALTER SEQUENCE "Guest_guestId_seq" RESTART WITH 1;
ALTER SEQUENCE "Pelanggan_pelangganId_seq" RESTART WITH 1;

-- Re-enable triggers
SET session_replication_role = 'origin';

-- First, merge master data tables to avoid duplicates
\i 'C:\\Users\\dodi\\OneDrive\\Desktop\\projects\\fullstack\\nextjs\\cashier\\backup\\temp\\merge\\user-merge-2025-04-12T14-29-50.sql'
\i 'C:\\Users\\dodi\\OneDrive\\Desktop\\projects\\fullstack\\nextjs\\cashier\\backup\\temp\\merge\\kategori-merge-2025-04-12T14-29-50.sql'
\i 'C:\\Users\\dodi\\OneDrive\\Desktop\\projects\\fullstack\\nextjs\\cashier\\backup\\temp\\merge\\produk-merge-2025-04-12T14-29-50.sql'

-- Now transfer transaction data from temp database
-- Pelanggan
INSERT INTO "Pelanggan" (nama, alamat, "nomorTelepon", points, "createdAt")
SELECT nama, alamat, "nomorTelepon", points, "createdAt"  
FROM dblink('dbname=db_cashier_restore_temp user=postgres password=dodisuta288 host=localhost port=5432', 
          'SELECT nama, alamat, "nomorTelepon", points, "createdAt" FROM "Pelanggan"')
AS p(nama TEXT, alamat TEXT, "nomorTelepon" TEXT, points INT, "createdAt" TIMESTAMP)
ON CONFLICT ("nomorTelepon") DO NOTHING
WHERE "nomorTelepon" IS NOT NULL;

-- For Pelanggan without phone numbers, we can't easily check for duplicates
INSERT INTO "Pelanggan" (nama, alamat, points, "createdAt")
SELECT nama, alamat, points, "createdAt"  
FROM dblink('dbname=db_cashier_restore_temp user=postgres password=dodisuta288 host=localhost port=5432', 
          'SELECT nama, alamat, points, "createdAt" FROM "Pelanggan" WHERE "nomorTelepon" IS NULL')
AS p(nama TEXT, alamat TEXT, points INT, "createdAt" TIMESTAMP);

-- Guest
INSERT INTO "Guest" DEFAULT VALUES;

-- Re-map Pelanggan IDs (create a mapping table)
CREATE TEMP TABLE pelanggan_map AS
SELECT bp."pelangganId" as old_id, cp."pelangganId" as new_id
FROM 
  dblink('dbname=db_cashier_restore_temp user=postgres password=dodisuta288 host=localhost port=5432', 
        'SELECT "pelangganId", "nomorTelepon", nama FROM "Pelanggan"')
  AS bp("pelangganId" INT, "nomorTelepon" TEXT, nama TEXT)
LEFT JOIN "Pelanggan" cp ON 
  (cp."nomorTelepon" IS NOT NULL AND bp."nomorTelepon" IS NOT NULL AND cp."nomorTelepon" = bp."nomorTelepon")
  OR (cp."nomorTelepon" IS NULL AND bp."nomorTelepon" IS NULL AND cp.nama = bp.nama);

-- Re-map User IDs (create a mapping table)
CREATE TEMP TABLE user_map AS
SELECT bu.id as old_id, cu.id as new_id
FROM 
  dblink('dbname=db_cashier_restore_temp user=postgres password=dodisuta288 host=localhost port=5432', 
        'SELECT id, username FROM "User"')
  AS bu(id INT, username TEXT)
JOIN "User" cu ON cu.username = bu.username;

-- Penjualan (with ID remapping)
INSERT INTO "Penjualan" (total_harga, total_modal, keuntungan, "pelangganId", "tanggalPenjualan", "guestId", "userId", kembalian, "uangMasuk", "diskonPoin")
SELECT 
  p.total_harga, 
  p.total_modal, 
  p.keuntungan, 
  CASE 
    WHEN p."pelangganId" IS NOT NULL THEN 
      (SELECT new_id FROM pelanggan_map WHERE old_id = p."pelangganId")
    ELSE NULL
  END,
  p."tanggalPenjualan",
  p."guestId",
  (SELECT new_id FROM user_map WHERE old_id = p."userId"),
  p.kembalian,
  p."uangMasuk",
  p."diskonPoin"
FROM dblink('dbname=db_cashier_restore_temp user=postgres password=dodisuta288 host=localhost port=5432', 
          'SELECT "penjualanId", total_harga, total_modal, keuntungan, "pelangganId", "tanggalPenjualan", "guestId", "userId", kembalian, "uangMasuk", "diskonPoin" FROM "Penjualan"')
AS p("penjualanId" INT, total_harga FLOAT, total_modal FLOAT, keuntungan FLOAT, "pelangganId" INT, "tanggalPenjualan" TIMESTAMP, "guestId" INT, "userId" INT, kembalian INT, "uangMasuk" INT, "diskonPoin" INT);

-- Re-map Penjualan IDs (create a mapping table)
CREATE TEMP TABLE penjualan_map AS
SELECT 
  bp."penjualanId" as old_id,
  cp."penjualanId" as new_id
FROM 
  dblink('dbname=db_cashier_restore_temp user=postgres password=dodisuta288 host=localhost port=5432', 
        'SELECT "penjualanId", "tanggalPenjualan", total_harga FROM "Penjualan"')
  AS bp("penjualanId" INT, "tanggalPenjualan" TIMESTAMP, total_harga FLOAT)
JOIN "Penjualan" cp ON 
  cp."tanggalPenjualan" = bp."tanggalPenjualan" AND
  cp.total_harga = bp.total_harga
ORDER BY bp."penjualanId";

-- Re-map Produk IDs (create a mapping table)
CREATE TEMP TABLE produk_map AS
SELECT 
  bp."produkId" as old_id,
  cp."produkId" as new_id
FROM 
  dblink('dbname=db_cashier_restore_temp user=postgres password=dodisuta288 host=localhost port=5432', 
        'SELECT "produkId", nama, "kategoriId" FROM "Produk"')
  AS bp("produkId" INT, nama TEXT, "kategoriId" INT)
JOIN "Produk" cp ON 
  cp.nama = bp.nama AND
  cp."kategoriId" = bp."kategoriId"
ORDER BY bp."produkId";

-- DetailPenjualan (with ID remapping)
INSERT INTO "DetailPenjualan" (kuantitas, subtotal, "penjualanId", "produkId", "promotionId", "promotionTitle", "discountPercentage", "discountAmount")
SELECT 
  dp.kuantitas,
  dp.subtotal,
  (SELECT new_id FROM penjualan_map WHERE old_id = dp."penjualanId"),
  (SELECT new_id FROM produk_map WHERE old_id = dp."produkId"),
  dp."promotionId",
  dp."promotionTitle",
  dp."discountPercentage",
  dp."discountAmount"
FROM dblink('dbname=db_cashier_restore_temp user=postgres password=dodisuta288 host=localhost port=5432', 
          'SELECT "detailId", kuantitas, subtotal, "penjualanId", "produkId", "promotionId", "promotionTitle", "discountPercentage", "discountAmount" FROM "DetailPenjualan"')
AS dp("detailId" INT, kuantitas INT, subtotal INT, "penjualanId" INT, "produkId" INT, "promotionId" INT, "promotionTitle" TEXT, "discountPercentage" FLOAT, "discountAmount" FLOAT);

-- Refund (with ID remapping)
INSERT INTO "Refund" ("penjualanId", "tanggalRefund", "totalRefund", "userId", "returnHistoryData")
SELECT 
  (SELECT new_id FROM penjualan_map WHERE old_id = r."penjualanId"),
  r."tanggalRefund",
  r."totalRefund",
  (SELECT new_id FROM user_map WHERE old_id = r."userId"),
  r."returnHistoryData"
FROM dblink('dbname=db_cashier_restore_temp user=postgres password=dodisuta288 host=localhost port=5432', 
          'SELECT "refundId", "penjualanId", "tanggalRefund", "totalRefund", "userId", "returnHistoryData" FROM "Refund"')
AS r("refundId" INT, "penjualanId" INT, "tanggalRefund" TIMESTAMP, "totalRefund" FLOAT, "userId" INT, "returnHistoryData" TEXT);

-- Re-map Refund IDs (create a mapping table)
CREATE TEMP TABLE refund_map AS
SELECT 
  br."refundId" as old_id,
  cr."refundId" as new_id
FROM 
  dblink('dbname=db_cashier_restore_temp user=postgres password=dodisuta288 host=localhost port=5432', 
        'SELECT "refundId", "tanggalRefund", "totalRefund" FROM "Refund"')
  AS br("refundId" INT, "tanggalRefund" TIMESTAMP, "totalRefund" FLOAT)
JOIN "Refund" cr ON 
  cr."tanggalRefund" = br."tanggalRefund" AND
  cr."totalRefund" = br."totalRefund"
ORDER BY br."refundId";

-- DetailRefund (with ID remapping)
INSERT INTO "DetailRefund" ("refundId", "produkId", kuantitas)
SELECT 
  (SELECT new_id FROM refund_map WHERE old_id = dr."refundId"),
  (SELECT new_id FROM produk_map WHERE old_id = dr."produkId"),
  dr.kuantitas
FROM dblink('dbname=db_cashier_restore_temp user=postgres password=dodisuta288 host=localhost port=5432', 
          'SELECT "detailRefundId", "refundId", "produkId", kuantitas FROM "DetailRefund"')
AS dr("detailRefundId" INT, "refundId" INT, "produkId" INT, kuantitas INT);

-- Promotion 
INSERT INTO "Promotion" (title, description, type, "startDate", "endDate", "discountPercentage", "discountAmount", "minQuantity", "createdAt", "updatedAt")
SELECT 
  p.title,
  p.description,
  p.type::text::"PromotionType",
  p."startDate",
  p."endDate",
  p."discountPercentage",
  p."discountAmount",
  p."minQuantity",
  p."createdAt",
  p."updatedAt"
FROM dblink('dbname=db_cashier_restore_temp user=postgres password=dodisuta288 host=localhost port=5432', 
          'SELECT "promotionId", title, description, type::text, "startDate", "endDate", "discountPercentage", "discountAmount", "minQuantity", "createdAt", "updatedAt" FROM "Promotion"')
AS p("promotionId" INT, title TEXT, description TEXT, type TEXT, "startDate" TIMESTAMP, "endDate" TIMESTAMP, "discountPercentage" FLOAT, "discountAmount" FLOAT, "minQuantity" INT, "createdAt" TIMESTAMP, "updatedAt" TIMESTAMP);

-- Re-map Promotion IDs (create a mapping table)
CREATE TEMP TABLE promotion_map AS
SELECT 
  bp."promotionId" as old_id,
  cp."promotionId" as new_id
FROM 
  dblink('dbname=db_cashier_restore_temp user=postgres password=dodisuta288 host=localhost port=5432', 
        'SELECT "promotionId", title FROM "Promotion"')
  AS bp("promotionId" INT, title TEXT)
JOIN "Promotion" cp ON 
  cp.title = bp.title
ORDER BY bp."promotionId";

-- PromotionProduct (with ID remapping)
INSERT INTO "PromotionProduct" ("promotionId", "produkId", "activeUntil")
SELECT 
  (SELECT new_id FROM promotion_map WHERE old_id = pp."promotionId"),
  (SELECT new_id FROM produk_map WHERE old_id = pp."produkId"),
  pp."activeUntil"
FROM dblink('dbname=db_cashier_restore_temp user=postgres password=dodisuta288 host=localhost port=5432', 
          'SELECT id, "promotionId", "produkId", "activeUntil" FROM "PromotionProduct"')
AS pp(id INT, "promotionId" INT, "produkId" INT, "activeUntil" TIMESTAMP);

-- Get count of restored records
SELECT 
  'Restore completed successfully!' as result,
  (SELECT COUNT(*) FROM "Pelanggan") as pelanggan_count,
  (SELECT COUNT(*) FROM "Penjualan") as penjualan_count,
  (SELECT COUNT(*) FROM "DetailPenjualan") as detail_penjualan_count,
  (SELECT COUNT(*) FROM "Refund") as refund_count,
  (SELECT COUNT(*) FROM "DetailRefund") as detail_refund_count,
  (SELECT COUNT(*) FROM "Promotion") as promotion_count,
  (SELECT COUNT(*) FROM "PromotionProduct") as promotion_product_count;
