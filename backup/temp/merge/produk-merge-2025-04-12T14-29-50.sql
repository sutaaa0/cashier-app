
-- Create temporary tables for current and backup products
CREATE TEMP TABLE current_produk AS (SELECT * FROM "Produk");
CREATE TEMP TABLE backup_produk AS (
  SELECT * FROM dblink('dbname=db_cashier_restore_temp user=postgres password=dodisuta288 host=localhost port=5432', 
                      'SELECT "produkId", nama, harga, "hargaModal", stok, image, "createdAt", "updatedAt", "isDeleted", "minimumStok", "statusStok", "kategoriId" FROM "Produk"') 
  AS bp("produkId" INT, nama TEXT, harga INT, "hargaModal" INT, stok INT, image TEXT, "createdAt" TIMESTAMP, "updatedAt" TIMESTAMP, "isDeleted" BOOLEAN, "minimumStok" INT, "statusStok" TEXT, "kategoriId" INT)
);

-- Find products in backup that don't exist in current database (based on name and kategoriId)
INSERT INTO "Produk" (nama, harga, "hargaModal", stok, image, "createdAt", "updatedAt", "isDeleted", "minimumStok", "statusStok", "kategoriId")
SELECT bp.nama, bp.harga, bp."hargaModal", bp.stok, bp.image, bp."createdAt", bp."updatedAt", bp."isDeleted", bp."minimumStok", bp."statusStok", 
  -- Get the corresponding kategoriId in the current database, or fallback to the original
  COALESCE(
    (SELECT ck."kategoriId" FROM current_kategori ck 
     INNER JOIN backup_kategori bk ON bk.nama = ck.nama AND bk.icon = ck.icon
     WHERE bk."kategoriId" = bp."kategoriId"), 
    bp."kategoriId"
  ) AS kategoriId
FROM backup_produk bp
WHERE NOT EXISTS (
  SELECT 1 FROM current_produk cp WHERE cp.nama = bp.nama AND cp."kategoriId" = bp."kategoriId"
);

-- Log the merge results
SELECT 'Produk merge completed: ' || COUNT(*) || ' new products added.'
FROM backup_produk bp
WHERE NOT EXISTS (
  SELECT 1 FROM current_produk cp WHERE cp.nama = bp.nama AND cp."kategoriId" = bp."kategoriId"
);

-- Cleanup temp tables
DROP TABLE current_produk;
DROP TABLE backup_produk;
