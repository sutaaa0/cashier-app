// File: app/api/reset/settings/route.ts
import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const settingsPath = path.join(process.cwd(), "reset-settings.json");

// Pastikan file settings ada
if (!fs.existsSync(settingsPath)) {
  const defaultSettings = {
    confirmationCode: "RESET-DB", // Kode untuk konfirmasi
    preserveMasterData: true,   // Default: pertahankan data master
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
    return NextResponse.json({ error: 'Gagal membaca pengaturan reset database' }, { status: 500 });
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
    
    // Validasi confirmationCode
    if (data.confirmationCode !== undefined) {
      if (typeof data.confirmationCode !== 'string') {
        return NextResponse.json({ error: 'Kode konfirmasi harus berupa string' }, { status: 400 });
      }
      
      if (data.confirmationCode.length < 6) {
        return NextResponse.json({ error: 'Kode konfirmasi minimal 6 karakter' }, { status: 400 });
      }
    }
    
    // Validasi preserveMasterData
    if (data.preserveMasterData !== undefined && typeof data.preserveMasterData !== 'boolean') {
      return NextResponse.json({ error: 'Nilai preserveMasterData harus berupa boolean' }, { status: 400 });
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
      message: 'Pengaturan reset database berhasil disimpan'
    });
  } catch (error) {
    console.error('Error saving reset settings:', error);
    return NextResponse.json({ 
      error: 'Gagal menyimpan pengaturan',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}