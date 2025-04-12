// FILE: scripts/backupCron.js

import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { fileURLToPath } from "url";
import cron from "node-cron";

// Load .env
dotenv.config();

// Mendapatkan __dirname di ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Track backup yang sudah dijalankan untuk menghindari duplikasi
const backupRunTracker = {};

function shouldBackupNow(schedule) {
  try {
    // Validasi jadwal cron
    if (!cron.validate(schedule)) {
      console.error("❌ Format jadwal cron tidak valid:", schedule);
      return false;
    }

    console.log("✓ Jadwal cron valid:", schedule);

    // Dapatkan waktu saat ini
    const now = new Date();
    const currentMinute = now.getMinutes();
    const currentHour = now.getHours();
    const currentDay = now.getDate();
    const currentMonth = now.getMonth() + 1; // Januari = 1

    // Buat kunci unik untuk menandai backup hari ini/jam ini
    const todayKey = `${currentDay}-${currentMonth}-${now.getFullYear()}-${currentHour}-${currentMinute}`;

    // Cek apakah jadwal cron cocok dengan waktu saat ini
    // Parsing jadwal cron
    const parts = schedule.split(" ");
    const cronMinute = parts[0];
    const cronHour = parts[1];

    // Verifikasi apakah menit dan jam saat ini cocok dengan jadwal
    let minuteMatch = false;
    let hourMatch = false;

    // Cek menit
    if (cronMinute === "*") {
      minuteMatch = true;
    } else if (cronMinute.includes(",")) {
      // Jika ada beberapa menit yang ditentukan (misalnya "0,30")
      minuteMatch = cronMinute.split(",").includes(currentMinute.toString());
    } else if (cronMinute.includes("/")) {
      // Jika ada interval (misalnya "*/5")
      const interval = parseInt(cronMinute.split("/")[1]);
      minuteMatch = currentMinute % interval === 0;
    } else if (cronMinute.includes("-")) {
      // Jika ada rentang (misalnya "10-15")
      const [start, end] = cronMinute.split("-").map(Number);
      minuteMatch = currentMinute >= start && currentMinute <= end;
    } else {
      // Jika hanya satu nilai (misalnya "0")
      minuteMatch = parseInt(cronMinute) === currentMinute;
    }

    // Cek jam
    if (cronHour === "*") {
      hourMatch = true;
    } else if (cronHour.includes(",")) {
      hourMatch = cronHour.split(",").includes(currentHour.toString());
    } else if (cronHour.includes("/")) {
      const interval = parseInt(cronHour.split("/")[1]);
      hourMatch = currentHour % interval === 0;
    } else if (cronHour.includes("-")) {
      const [start, end] = cronHour.split("-").map(Number);
      hourMatch = currentHour >= start && currentHour <= end;
    } else {
      hourMatch = parseInt(cronHour) === currentHour;
    }

    // Cek apakah sudah dijalankan pada menit dan jam yang sama
    if (minuteMatch && hourMatch) {
      if (backupRunTracker[todayKey]) {
        console.log("⏩ Backup sudah dijalankan pada menit dan jam ini");
        return false;
      }

      // Tandai bahwa backup sudah dijalankan pada menit dan jam ini
      backupRunTracker[todayKey] = true;

      // Bersihkan tracker lama (lebih dari 1 jam yang lalu)
      const oneHourAgo = new Date();
      oneHourAgo.setHours(oneHourAgo.getHours() - 1);
      Object.keys(backupRunTracker).forEach((key) => {
        const [day, month, year, hour, minute] = key.split("-").map(Number);
        const trackerDate = new Date(year, month - 1, day, hour, minute);
        if (trackerDate < oneHourAgo) {
          delete backupRunTracker[key];
        }
      });

      console.log("✅ Waktu saat ini cocok dengan jadwal cron:", schedule);
      return true;
    }

    console.log("⏩ Waktu saat ini tidak cocok dengan jadwal cron:", schedule);
    return false;
  } catch (error) {
    console.error("❌ Error saat validasi jadwal:", error);
    return false;
  }
}

function backup() {
  console.log("🔄 Memulai proses backup...");

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

    const backupFolder = path.join(__dirname, "../backup");
    console.log("📁 Lokasi folder backup:", backupFolder);

    if (!fs.existsSync(backupFolder)) {
      console.log("📁 Membuat folder backup...");
      fs.mkdirSync(backupFolder, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/:/g, "-").split(".")[0];
    const filename = `backup-${timestamp}.backup`;
    const fullPath = path.join(backupFolder, filename);

    console.log("💾 Menyimpan backup ke:", fullPath);
    const cmd = `pg_dump -Fc -U ${username} -h ${hostname} -p ${port} ${database} > "${fullPath}"`;

    execSync(cmd, { env });
    console.log("✅ Backup selesai:", filename);

    // Verifikasi bahwa file backup benar-benar dibuat
    if (fs.existsSync(fullPath)) {
      const stats = fs.statSync(fullPath);
      console.log(`✅ File backup dibuat: ${fullPath} (${stats.size} bytes)`);

      // Bersihkan file backup lama berdasarkan pengaturan retensi
      cleanupOldBackups();
    } else {
      console.error("❌ File backup tidak ditemukan setelah proses backup");
    }

    return true;
  } catch (error) {
    console.error("❌ Gagal menjalankan backup:", error.message);
    return false;
  }
}

function isResetInProgress() {
  console.log("🔍 Memeriksa apakah reset sedang berlangsung...");

  const resetFlagPath = path.join(__dirname, "../reset-in-progress.flag");

  if (fs.existsSync(resetFlagPath)) {
    const flagCreationTime = fs.statSync(resetFlagPath).mtime;
    const currentTime = new Date();
    const timeDifference = currentTime.getTime() - flagCreationTime.getTime();

    // Jika flag dibuat kurang dari 5 menit yang lalu, anggap reset masih berlangsung
    if (timeDifference < 5 * 60 * 1000) {
      console.log("⚠️ Reset database sedang berlangsung, melewati backup");
      return true;
    } else {
      // Jika flag sudah lama, hapus flag
      console.log("🧹 Menghapus flag reset yang sudah kadaluarsa");
      fs.unlinkSync(resetFlagPath);
      return false;
    }
  }

  return false;
}

// Fungsi untuk membersihkan file backup lama
function cleanupOldBackups() {
  try {
    const configPath = path.join(__dirname, "../backup-settings.json");
    if (!fs.existsSync(configPath)) {
      console.log("⚠️ File konfigurasi tidak ditemukan, tidak dapat membersihkan backup lama");
      return;
    }

    const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    const retention = config.retention || 7; // Default 7 hari jika tidak ditentukan

    console.log(`🧹 Membersihkan file backup yang lebih tua dari ${retention} hari...`);

    const backupFolder = path.join(__dirname, "../backup");
    const files = fs.readdirSync(backupFolder).filter((file) => file.endsWith(".backup"));

    const now = new Date();
    const retentionDate = new Date(now);
    retentionDate.setDate(retentionDate.getDate() - retention);

    let deletedCount = 0;

    files.forEach((file) => {
      const filePath = path.join(backupFolder, file);
      const stats = fs.statSync(filePath);
      const fileDate = new Date(stats.birthtime || stats.ctime);

      if (fileDate < retentionDate) {
        console.log(`🗑️ Menghapus backup lama: ${file} (dibuat pada ${fileDate.toISOString()})`);
        fs.unlinkSync(filePath);
        deletedCount++;
      }
    });

    console.log(`✅ Pembersihan selesai: ${deletedCount} file backup lama dihapus`);
  } catch (error) {
    console.error("❌ Gagal membersihkan file backup lama:", error.message);
  }
}

function runBackupIfDue() {
  
  console.log("\n🔄 Memeriksa backup...");
  
  // Periksa apakah reset sedang berlangsung
  if (isResetInProgress()) {
    console.log("⏩ Melewati backup karena reset sedang berlangsung");
    return;
  }

  const configPath = path.join(__dirname, "../backup-settings.json");
  console.log("📋 Lokasi file konfigurasi:", configPath);

  if (!fs.existsSync(configPath)) {
    console.error("❌ File backup-settings.json tidak ditemukan di", configPath);
    return;
  }

  try {
    const configContent = fs.readFileSync(configPath, "utf-8");
    console.log("📄 Isi file konfigurasi:", configContent);

    const config = JSON.parse(configContent);
    console.log("🔄 Konfigurasi backup:", config);

    if (!config.autoBackup) {
      console.log("⏩ Backup otomatis dinonaktifkan (autoBackup=false)");
      return;
    }

    if (!config.schedule) {
      console.error("❌ Jadwal tidak ditemukan dalam konfigurasi");
      return;
    }

    if (shouldBackupNow(config.schedule)) {
      console.log("✅ Jadwal cocok, menjalankan backup sekarang...");
      backup();
    } else {
      console.log("⏩ Bukan waktunya backup sesuai jadwal");
    }
  } catch (error) {
    console.error("❌ Gagal membaca atau parsing file konfigurasi:", error.message);
  }
}

console.log("🚀 Memulai service backup PostgreSQL...");

// Menjadwalkan pengecekan setiap menit
cron.schedule("* * * * *", () => {
  console.log("\n🕒 Cron job dijalankan pada:", new Date().toISOString());
  runBackupIfDue();
});

console.log("✅ Service backup berjalan. Menunggu jadwal backup...");
