
-- Create temporary tables for current and backup users
CREATE TEMP TABLE current_users AS (SELECT * FROM "User");
CREATE TEMP TABLE backup_users AS (
  SELECT * FROM dblink('dbname=db_cashier_restore_temp user=postgres password=dodisuta288 host=localhost port=5432', 
                      'SELECT id, level, username, password FROM "User"') 
  AS bu(id INT, level TEXT, username TEXT, password TEXT)
);

-- Find users in backup that don't exist in current database (based on username)
INSERT INTO "User" (username, password, level)
SELECT bu.username, bu.password, bu.level
FROM backup_users bu
WHERE NOT EXISTS (
  SELECT 1 FROM current_users cu WHERE cu.username = bu.username
);

-- Log the merge results
SELECT 'User merge completed: ' || COUNT(*) || ' new users added.'
FROM backup_users bu
WHERE NOT EXISTS (
  SELECT 1 FROM current_users cu WHERE cu.username = bu.username
);

-- Cleanup temp tables
DROP TABLE current_users;
DROP TABLE backup_users;
