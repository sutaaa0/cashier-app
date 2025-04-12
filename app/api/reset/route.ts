// File: app/api/reset/route.ts
import { execSync } from 'child_process';
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { prisma } from '@/lib/db';

interface ResetRequestBody {
  preserveMasterData?: boolean;
}

export async function POST(request: Request) {
  try {
    // Parse the request body to get preserveMasterData option
    const data: ResetRequestBody = await request.json().catch(() => ({}));
    const preserveMasterData = data.preserveMasterData !== undefined ? data.preserveMasterData : true;
    
    const DATABASE_URL = process.env.DATABASE_URL;
    
    if (!DATABASE_URL) throw new Error('DATABASE_URL tidak ditemukan.');
    
    const dbUrl = new URL(DATABASE_URL);
    const user = dbUrl.username;
    const password = dbUrl.password;
    const host = dbUrl.hostname;
    const port = dbUrl.port;
    const database = dbUrl.pathname.replace('/', '');
    
    const env = { ...process.env, PGPASSWORD: password };
    
    // Buat folder logs jika belum ada
    const logsDir = path.join(process.cwd(), "logs");
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
    
    // Log reset database
    const timestamp = new Date().toISOString().replace(/[:\.]/g, '-');
    const logFilename = `reset-${timestamp}.log`;
    const logPath = path.join(logsDir, logFilename);
    
    // Simpan log sebelum reset
    fs.writeFileSync(logPath, `Reset database dimulai pada: ${new Date().toISOString()}\n`);
    fs.appendFileSync(logPath, `Mode reset: ${preserveMasterData ? 'Preserve Master Data' : 'Full Reset'}\n`);
    
    // Lakukan backup terlebih dahulu sebelum reset
    const backupDir = path.join(process.cwd(), "backup");
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    const backupFilename = `pre-reset-backup-${timestamp}.backup`;
    const backupPath = path.join(backupDir, backupFilename);
    
    // Backup terlebih dahulu sebelum reset
    const backupCommand = `pg_dump -Fc -U ${user} -h ${host} -p ${port} ${database} > "${backupPath}"`;
    execSync(backupCommand, { env });
    
    fs.appendFileSync(logPath, `Backup sebelum reset dibuat: ${backupFilename}\n`);

    // Disconnect all Prisma connections before proceeding
    await prisma.$disconnect();
    
    if (preserveMasterData) {
      // Pendekatan 1: Reset dengan mempertahankan data master
      fs.appendFileSync(logPath, "Menggunakan mode reset dengan mempertahankan data master\n");
      
      // Backup data master menggunakan SQL export karena lebih reliable
      const masterDataBackupSQL = `
        COPY (SELECT * FROM "User") TO '${path.join(backupDir, `users-backup-${timestamp}.csv`)}' WITH CSV HEADER;
        COPY (SELECT * FROM "Kategori") TO '${path.join(backupDir, `categories-backup-${timestamp}.csv`)}' WITH CSV HEADER;
        COPY (SELECT * FROM "Produk") TO '${path.join(backupDir, `products-backup-${timestamp}.csv`)}' WITH CSV HEADER;
      `;
      
      // Simpan SQL untuk backup ke file
      const backupSQLPath = path.join(backupDir, `backup-master-data-${timestamp}.sql`);
      fs.writeFileSync(backupSQLPath, masterDataBackupSQL);
      
      try {
        // Jalankan backup data master
        const backupMasterCmd = `psql -U ${user} -h ${host} -p ${port} -d ${database} -f "${backupSQLPath}"`;
        execSync(backupMasterCmd, { env });
        fs.appendFileSync(logPath, `Backup data master berhasil menggunakan SQL\n`);
      } catch (error) {
        console.error("Error backing up master data with SQL:", error);
        fs.appendFileSync(logPath, `Warning: Error saat backup data master: ${error instanceof Error ? error.message : String(error)}\n`);
        // Continue with reset anyway
      }

      // Cari tahu berapa banyak data yang akan dihapus untuk verifikasi
      try {
        const countSQL = `
        SELECT 
          (SELECT COUNT(*) FROM "DetailPenjualan") AS detail_penjualan_count,
          (SELECT COUNT(*) FROM "Penjualan") AS penjualan_count,
          (SELECT COUNT(*) FROM "Pelanggan") AS pelanggan_count,
          (SELECT COUNT(*) FROM "Guest") AS guest_count,
          (SELECT COUNT(*) FROM "Refund") AS refund_count
        `;
        
        const countCmd = `psql -U ${user} -h ${host} -p ${port} -d ${database} -c "${countSQL}"`;
        const countResult = execSync(countCmd, { env }).toString();
        fs.appendFileSync(logPath, `Data yang akan dihapus:\n${countResult}\n`);
      } catch (error) {
        console.error("Error counting data:", error);
        fs.appendFileSync(logPath, `Warning: Error saat menghitung data: ${error instanceof Error ? error.message : String(error)}\n`);
      }
      
      // Gunakan pendekatan direct delete untuk setiap tabel karena lebih reliable daripada TRUNCATE CASCADE
      // Urutan penting karena foreign key constraints
      const deleteSQL = `
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
      `;
      
      // Simpan SQL untuk reset ke file
      const resetSQLPath = path.join(backupDir, `reset-sql-${timestamp}.sql`);
      fs.writeFileSync(resetSQLPath, deleteSQL);
      
      // Disconnect semua koneksi terlebih dahulu
      const disconnectCmd = `psql -U ${user} -h ${host} -p ${port} -d postgres -c "SELECT pg_terminate_backend(pg_stat_activity.pid) FROM pg_stat_activity WHERE pg_stat_activity.datname = '${database}' AND pid <> pg_backend_pid();"`;
      execSync(disconnectCmd, { env });
      fs.appendFileSync(logPath, `Semua koneksi database diputus\n`);
      
      // Jalankan SQL reset
      try {
        const resetCmd = `psql -U ${user} -h ${host} -p ${port} -d ${database} -f "${resetSQLPath}"`;
        const result = execSync(resetCmd, { env }).toString();
        fs.appendFileSync(logPath, `Reset data berhasil, hasil:\n${result}\n`);
      } catch (error) {
        console.error("Error executing reset SQL:", error);
        fs.appendFileSync(logPath, `Error saat menjalankan reset SQL: ${error instanceof Error ? error.message : String(error)}\n`);
        
        // Coba pendekatan alternatif jika yang pertama gagal
        fs.appendFileSync(logPath, `Mencoba pendekatan alternatif dengan query individual...\n`);
        
        const alternativeDeleteCmds = [
          `psql -U ${user} -h ${host} -p ${port} -d ${database} -c "SET session_replication_role = 'replica';"`,
          `psql -U ${user} -h ${host} -p ${port} -d ${database} -c "DELETE FROM \\\"DetailRefund\\\";"`,
          `psql -U ${user} -h ${host} -p ${port} -d ${database} -c "DELETE FROM \\\"DetailPenjualan\\\";"`,
          `psql -U ${user} -h ${host} -p ${port} -d ${database} -c "DELETE FROM \\\"PromotionProduct\\\";"`,
          `psql -U ${user} -h ${host} -p ${port} -d ${database} -c "DELETE FROM \\\"Promotion\\\";"`,
          `psql -U ${user} -h ${host} -p ${port} -d ${database} -c "DELETE FROM \\\"Refund\\\";"`,
          `psql -U ${user} -h ${host} -p ${port} -d ${database} -c "DELETE FROM \\\"Penjualan\\\";"`,
          `psql -U ${user} -h ${host} -p ${port} -d ${database} -c "DELETE FROM \\\"Guest\\\";"`,
          `psql -U ${user} -h ${host} -p ${port} -d ${database} -c "DELETE FROM \\\"Pelanggan\\\";"`,
          `psql -U ${user} -h ${host} -p ${port} -d ${database} -c "SET session_replication_role = 'origin';"`,
        ];
        
        for (const cmd of alternativeDeleteCmds) {
          try {
            execSync(cmd, { env });
            fs.appendFileSync(logPath, `Berhasil: ${cmd}\n`);
          } catch (cmdError) {
            fs.appendFileSync(logPath, `Gagal: ${cmd}\nError: ${cmdError instanceof Error ? cmdError.message : String(cmdError)}\n`);
          }
        }
      }
      
      // Verifikasi hasil reset
      try {
        const verifySQL = `
        SELECT 
          (SELECT COUNT(*) FROM "DetailPenjualan") AS detail_penjualan_count,
          (SELECT COUNT(*) FROM "Penjualan") AS penjualan_count,
          (SELECT COUNT(*) FROM "Pelanggan") AS pelanggan_count,
          (SELECT COUNT(*) FROM "Guest") AS guest_count,
          (SELECT COUNT(*) FROM "Refund") AS refund_count,
          (SELECT COUNT(*) FROM "User") AS user_count,
          (SELECT COUNT(*) FROM "Kategori") AS kategori_count,
          (SELECT COUNT(*) FROM "Produk") AS produk_count
        `;
        
        const verifyCmd = `psql -U ${user} -h ${host} -p ${port} -d ${database} -c "${verifySQL}"`;
        const verifyResult = execSync(verifyCmd, { env }).toString();
        fs.appendFileSync(logPath, `Verifikasi hasil reset:\n${verifyResult}\n`);
      } catch (error) {
        console.error("Error verifying reset:", error);
        fs.appendFileSync(logPath, `Error saat verifikasi: ${error instanceof Error ? error.message : String(error)}\n`);
      }
      
    } else {
      // Pendekatan 2: Full reset (hapus semua dan buat ulang)
      fs.appendFileSync(logPath, "Menggunakan mode full reset (hapus semua data)\n");
      
      const resetCommands = [
        // Disconnect semua koneksi
        `psql -U ${user} -h ${host} -p ${port} -d postgres -c "SELECT pg_terminate_backend(pg_stat_activity.pid) FROM pg_stat_activity WHERE pg_stat_activity.datname = '${database}' AND pid <> pg_backend_pid();"`,
        // Drop dan buat ulang database
        `psql -U ${user} -h ${host} -p ${port} -d postgres -c "DROP DATABASE IF EXISTS ${database};"`,
        `psql -U ${user} -h ${host} -p ${port} -d postgres -c "CREATE DATABASE ${database} WITH OWNER ${user};"`,
      ];
      
      // Jalankan perintah reset
      for (const cmd of resetCommands) {
        execSync(cmd, { env });
        fs.appendFileSync(logPath, `Menjalankan: ${cmd}\n`);
      }
      
      // Cek jika ada file schema.sql untuk menginisialisasi database
      const schemaPath = path.join(process.cwd(), "schema.sql");
      if (fs.existsSync(schemaPath)) {
        const initCommand = `psql -U ${user} -h ${host} -p ${port} -d ${database} -f "${schemaPath}"`;
        execSync(initCommand, { env });
        fs.appendFileSync(logPath, `Menjalankan inisialisasi schema: ${initCommand}\n`);
      } else {
        // Jika tidak ada schema.sql, gunakan prisma migrate deploy untuk menginisialisasi schema
        fs.appendFileSync(logPath, `Tidak menemukan schema.sql, mencoba menggunakan prisma migrate deploy...\n`);
        try {
          // Pastikan path ke prisma benar
          const prismaPath = path.join(process.cwd(), 'node_modules', '.bin', 'prisma');
          execSync(`${prismaPath} migrate deploy`, { env });
          fs.appendFileSync(logPath, `Berhasil menjalankan prisma migrate deploy\n`);
        } catch (error) {
          console.error("Error running prisma migrate deploy:", error);
          fs.appendFileSync(logPath, `Error saat menjalankan prisma migrate deploy: ${error instanceof Error ? error.message : String(error)}\n`);
        }
      }
    }
    
    fs.appendFileSync(logPath, `Reset database selesai pada: ${new Date().toISOString()}\n`);
    
    return NextResponse.json({ 
      success: true, 
      message: `Database berhasil direset (Mode: ${preserveMasterData ? 'Preserve Master Data' : 'Full Reset'})`,
      backupFile: backupFilename,
      log: logFilename,
      preserveMasterData
    });
  } catch (error) {
    console.error('Error reset database:', error);
    return NextResponse.json({ 
      error: 'Gagal melakukan reset database', 
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}