// FILE: scripts/resetCron.js

import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { fileURLToPath } from 'url';
import cron from "node-cron";

// Load .env
dotenv.config();

// Mendapatkan __dirname di ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function shouldResetNow(schedule) {
  try {
    // Validasi jadwal cron
    if (!cron.validate(schedule)) {
      console.error("❌ Format jadwal cron tidak valid:", schedule);
      return false;
    }
    
    console.log("✓ Jadwal cron valid:", schedule);
    return true;
  } catch (error) {
    console.error("❌ Error saat validasi jadwal:", error);
    return false;
  }
}

function resetDatabase() {
  console.log("🔄 Memulai proses reset database...");

  const DATABASE_URL = process.env.DATABASE_URL;
  if (!DATABASE_URL) {
    console.error("❌ DATABASE_URL tidak ditemukan di .env");
    return;
  }

  try {
    const dbUrl = new URL(DATABASE_URL);
    const { username, password, hostname, port, pathname } = dbUrl;
    const database = pathname.slice(1);
    const env = { ...process.env, PGPASSWORD: password };

    // Membuat backup sebelum reset (opsional tapi direkomendasikan)
    const backupFolder = path.join(__dirname, "../backup");
    console.log("📁 Lokasi folder backup:", backupFolder);
    
    if (!fs.existsSync(backupFolder)) {
      console.log("📁 Membuat folder backup...");
      fs.mkdirSync(backupFolder, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
    const backupFilename = `pre-reset-${timestamp}.backup`;
    const backupPath = path.join(backupFolder, backupFilename);

    console.log("💾 Membuat backup sebelum reset ke:", backupPath);
    const backupCmd = `pg_dump -Fc -U ${username} -h ${hostname} -p ${port} ${database} > "${backupPath}"`;
    execSync(backupCmd, { env });
    console.log("✅ Backup sebelum reset selesai:", backupFilename);

    // Membuat folder logs jika belum ada
    const logsDir = path.join(__dirname, "../logs");
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
    
    // Log reset database
    const logFilename = `reset-${timestamp}.log`;
    const logPath = path.join(logsDir, logFilename);
    
    // Simpan log
    fs.writeFileSync(logPath, `Reset database otomatis dimulai pada: ${new Date().toISOString()}\n`);
    fs.appendFileSync(logPath, `Backup sebelum reset dibuat: ${backupFilename}\n`);

    // Reset database commands
    console.log("🔄 Menjalankan reset database...");
    
    // Disconnect semua koneksi
    const disconnectCmd = `psql -U ${username} -h ${hostname} -p ${port} -d postgres -c "SELECT pg_terminate_backend(pg_stat_activity.pid) FROM pg_stat_activity WHERE pg_stat_activity.datname = '${database}' AND pid <> pg_backend_pid();"`;
    execSync(disconnectCmd, { env });
    console.log("✅ Semua koneksi diputus");
    fs.appendFileSync(logPath, `Menjalankan: ${disconnectCmd}\n`);
    
    // Drop dan buat ulang database
    const dropCmd = `psql -U ${username} -h ${hostname} -p ${port} -d postgres -c "DROP DATABASE IF EXISTS ${database};"`;
    execSync(dropCmd, { env });
    console.log("✅ Database dihapus");
    fs.appendFileSync(logPath, `Menjalankan: ${dropCmd}\n`);
    
    const createCmd = `psql -U ${username} -h ${hostname} -p ${port} -d postgres -c "CREATE DATABASE ${database} WITH OWNER ${username};"`;
    execSync(createCmd, { env });
    console.log("✅ Database dibuat ulang");
    fs.appendFileSync(logPath, `Menjalankan: ${createCmd}\n`);

    // Cek apakah harus menginisialisasi schema
    const settingsPath = path.join(__dirname, "../reset-settings.json");
    let initSchema = true; // Default true
    
    if (fs.existsSync(settingsPath)) {
      try {
        const settings = JSON.parse(fs.readFileSync(settingsPath, "utf-8"));
        initSchema = settings.initSchema !== false; // Default ke true jika tidak disebutkan
      } catch (error) {
        console.error("❌ Error membaca reset-settings.json:", error);
      }
    }
    
    // Inisialisasi schema jika diatur
    if (initSchema) {
      const schemaPath = path.join(__dirname, "../schema.sql");
      if (fs.existsSync(schemaPath)) {
        console.log("🔄 Menginisialisasi database dengan schema.sql...");
        const initCmd = `psql -U ${username} -h ${hostname} -p ${port} -d ${database} -f "${schemaPath}"`;
        execSync(initCmd, { env });
        console.log("✅ Database berhasil diinisialisasi dengan schema");
        fs.appendFileSync(logPath, `Menjalankan inisialisasi schema: ${initCmd}\n`);
      } else {
        console.log("⚠️ File schema.sql tidak ditemukan, database kosong");
        fs.appendFileSync(logPath, `File schema.sql tidak ditemukan\n`);
      }
    } else {
      console.log("⚠️ Inisialisasi schema dinonaktifkan, database kosong");
      fs.appendFileSync(logPath, `Inisialisasi schema dinonaktifkan\n`);
    }
    
    fs.appendFileSync(logPath, `Reset database selesai pada: ${new Date().toISOString()}\n`);
    console.log("✅ Reset database selesai");
    
    return true;
  } catch (error) {
    console.error("❌ Gagal menjalankan reset database:", error.message);
    
    // Log error
    const logsDir = path.join(__dirname, "../logs");
    const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
    const logPath = path.join(logsDir, `reset-error-${timestamp}.log`);
    fs.writeFileSync(logPath, `Error reset database: ${error.message}\n`);
    
    return false;
  }
}

function runResetIfDue() {
  console.log("\n🔄 Memeriksa jadwal reset database...");
  
  const configPath = path.join(__dirname, "../reset-settings.json");
  console.log("📋 Lokasi file konfigurasi reset:", configPath);

  if (!fs.existsSync(configPath)) {
    console.error("❌ File reset-settings.json tidak ditemukan di", configPath);
    return;
  }

  try {
    const configContent = fs.readFileSync(configPath, "utf-8");
    console.log("📄 Isi file konfigurasi reset:", configContent);
    
    const config = JSON.parse(configContent);
    console.log("🔄 Konfigurasi reset:", config);

    if (!config.autoReset) {
      console.log("⏩ Reset otomatis dinonaktifkan (autoReset=false)");
      return;
    }

    if (!config.schedule) {
      console.error("❌ Jadwal reset tidak ditemukan dalam konfigurasi");
      return;
    }

    if (shouldResetNow(config.schedule)) {
      console.log("✅ Jadwal cocok, menjalankan reset database sekarang...");
      resetDatabase();
    } else {
      console.log("⏩ Bukan waktunya reset sesuai jadwal");
    }
  } catch (error) {
    console.error("❌ Gagal membaca atau parsing file konfigurasi reset:", error.message);
  }
}

console.log("🚀 Memulai service reset database PostgreSQL...");

// Menjadwalkan pengecekan setiap menit
cron.schedule("* * * * *", () => {
  console.log("\n🕒 Cron job reset dijalankan pada:", new Date().toISOString());
  runResetIfDue();
});

console.log("✅ Service reset database berjalan. Menunggu jadwal reset...");