
COPY (SELECT * FROM "User") TO 'C:\Users\dodi\OneDrive\Desktop\projects\fullstack\nextjs\cashier\backup\temp\temp\users-temp-2025-04-12T14-31-41.csv' WITH CSV HEADER;
COPY (SELECT * FROM "Kategori") TO 'C:\Users\dodi\OneDrive\Desktop\projects\fullstack\nextjs\cashier\backup\temp\temp\kategori-temp-2025-04-12T14-31-41.csv' WITH CSV HEADER;
COPY (SELECT * FROM "Produk") TO 'C:\Users\dodi\OneDrive\Desktop\projects\fullstack\nextjs\cashier\backup\temp\temp\produk-temp-2025-04-12T14-31-41.csv' WITH CSV HEADER;
