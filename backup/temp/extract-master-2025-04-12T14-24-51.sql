
COPY (SELECT * FROM "User") TO 'C:\Users\dodi\OneDrive\Desktop\projects\fullstack\nextjs\cashier\backup\temp\users-2025-04-12T14-24-51.csv' WITH CSV HEADER;
COPY (SELECT * FROM "Kategori") TO 'C:\Users\dodi\OneDrive\Desktop\projects\fullstack\nextjs\cashier\backup\temp\kategori-2025-04-12T14-24-51.csv' WITH CSV HEADER;
COPY (SELECT * FROM "Produk") TO 'C:\Users\dodi\OneDrive\Desktop\projects\fullstack\nextjs\cashier\backup\temp\produk-2025-04-12T14-24-51.csv' WITH CSV HEADER;
