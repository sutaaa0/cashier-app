
-- Create temporary tables for current and backup categories
CREATE TEMP TABLE current_kategori AS (SELECT * FROM "Kategori");
CREATE TEMP TABLE backup_kategori AS (
  SELECT * FROM dblink('dbname=db_cashier_restore_temp user=postgres password=dodisuta288 host=localhost port=5432', 
                      'SELECT kategoriId, nama, icon, "isDeleted" FROM "Kategori"') 
  AS bk(kategoriId INT, nama TEXT, icon TEXT, isDeleted BOOLEAN)
);

-- Find categories in backup that don't exist in current database (based on name and icon)
INSERT INTO "Kategori" (nama, icon, "isDeleted")
SELECT bk.nama, bk.icon, bk.isDeleted
FROM backup_kategori bk
WHERE NOT EXISTS (
  SELECT 1 FROM current_kategori ck WHERE ck.nama = bk.nama AND ck.icon = bk.icon
);

-- Log the merge results
SELECT 'Kategori merge completed: ' || COUNT(*) || ' new categories added.'
FROM backup_kategori bk
WHERE NOT EXISTS (
  SELECT 1 FROM current_kategori ck WHERE ck.nama = bk.nama AND ck.icon = bk.icon
);

-- Cleanup temp tables
DROP TABLE current_kategori;
DROP TABLE backup_kategori;
