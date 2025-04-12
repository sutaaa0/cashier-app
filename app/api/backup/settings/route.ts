// FILE: app/api/backup/settings/route.ts
import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import cron from "node-cron";

const settingsPath = path.join(process.cwd(), "backup-settings.json");

// Pastikan file settings ada
if (!fs.existsSync(settingsPath)) {
  const defaultSettings = {
    autoBackup: true,
    schedule: "0 0 * * *", // Default: setiap hari jam 00:00
    retention: 7, // Simpan backup selama 7 hari
    backupDestination: "local" // Lokasi: local atau tambahkan opsi cloud
  };
  fs.writeFileSync(settingsPath, JSON.stringify(defaultSettings, null, 2), "utf-8");
}

export async function GET() {
  // Verifikasi autentikasi
  // const session = await getServerSession(authOptions);
  // if (!session || session.user.role !== 'admin') {
  //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  // }

  try {
    const settings = fs.readFileSync(settingsPath, "utf-8");
    return NextResponse.json(JSON.parse(settings));
  } catch (error) {
    console.log(error);
    return NextResponse.json({ error: 'Gagal membaca pengaturan backup' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  // Verifikasi autentikasi
  // const session = await getServerSession(authOptions);
  // if (!session || session.user.role !== 'admin') {
  //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  // }

  try {
    const data = await req.json();
    
    // Validasi format jadwal cron
    if (data.schedule) {
      if (typeof data.schedule !== 'string') {
        return NextResponse.json({ error: 'Format jadwal harus berupa string' }, { status: 400 });
      }
      
      // Validasi format cron menggunakan node-cron
      if (!cron.validate(data.schedule)) {
        return NextResponse.json({ 
          error: 'Format jadwal cron tidak valid. Gunakan format: menit jam hari-bulan bulan hari-minggu', 
          example: '0 0 * * * (setiap hari jam 00:00)'
        }, { status: 400 });
      }
    }
    
    // Validasi periode retensi
    if (data.retention !== undefined) {
      if (typeof data.retention !== 'number') {
        return NextResponse.json({ error: 'Periode retensi harus berupa angka' }, { status: 400 });
      }
      
      if (data.retention < 1) {
        return NextResponse.json({ error: 'Periode retensi minimal 1 hari' }, { status: 400 });
      }
      
      if (data.retention > 365) {
        return NextResponse.json({ error: 'Periode retensi maksimal 365 hari' }, { status: 400 });
      }
    }
    
    // Validasi autoBackup
    if (data.autoBackup !== undefined && typeof data.autoBackup !== 'boolean') {
      return NextResponse.json({ error: 'Nilai autoBackup harus berupa boolean' }, { status: 400 });
    }
    
    // Validasi backupDestination
    if (data.backupDestination !== undefined) {
      if (typeof data.backupDestination !== 'string') {
        return NextResponse.json({ error: 'Lokasi backup harus berupa string' }, { status: 400 });
      }
      
      const validDestinations = ['local']; // Tambahkan opsi lain seperti 's3', 'gcs', dll
      if (!validDestinations.includes(data.backupDestination)) {
        return NextResponse.json({ error: `Lokasi backup tidak valid. Pilihan yang tersedia: ${validDestinations.join(', ')}` }, { status: 400 });
      }
    }

    // Baca pengaturan saat ini
    const currentSettings = JSON.parse(fs.readFileSync(settingsPath, "utf-8"));
    
    // Update pengaturan
    const newSettings = {
      ...currentSettings,
      ...data
    };
    
    fs.writeFileSync(settingsPath, JSON.stringify(newSettings, null, 2), "utf-8");
    return NextResponse.json({ 
      success: true, 
      settings: newSettings, 
      message: 'Pengaturan backup berhasil disimpan'
    });
  } catch (error) {
    console.error('Error saving backup settings:', error);
    return NextResponse.json({ 
      error: 'Gagal menyimpan pengaturan',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}