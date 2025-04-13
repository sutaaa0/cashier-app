
        COPY (SELECT * FROM "User") TO 'C:\Users\dodi\OneDrive\Desktop\projects\fullstack\nextjs\cashier\backup\users-backup-2025-04-12T14-38-28-355Z.csv' WITH CSV HEADER;
        COPY (SELECT * FROM "Kategori") TO 'C:\Users\dodi\OneDrive\Desktop\projects\fullstack\nextjs\cashier\backup\categories-backup-2025-04-12T14-38-28-355Z.csv' WITH CSV HEADER;
        COPY (SELECT * FROM "Produk") TO 'C:\Users\dodi\OneDrive\Desktop\projects\fullstack\nextjs\cashier\backup\products-backup-2025-04-12T14-38-28-355Z.csv' WITH CSV HEADER;
      