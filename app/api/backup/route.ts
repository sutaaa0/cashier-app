// File: app/api/backup/route.ts
import { execSync } from 'child_process';
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const DATABASE_URL = process.env.DATABASE_URL;
    
    if (!DATABASE_URL) throw new Error('DATABASE_URL tidak ditemukan.');
    
    const dbUrl = new URL(DATABASE_URL);
    const user = dbUrl.username;
    const password = dbUrl.password;
    const host = dbUrl.hostname;
    const port = dbUrl.port;
    const database = dbUrl.pathname.replace('/', '');
    
    const env = { ...process.env, PGPASSWORD: password };
    
    // Buat nama file backup dengan timestamp
    const timestamp = new Date().toISOString().replace(/[:\.]/g, '-');
    const filename = `backup-${timestamp}.backup`;
    
    // Pastikan direktori backup ada
    const backupDir = path.join(process.cwd(), "backup");
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    const backupPath = path.join(backupDir, filename);
    
    // Gunakan -Fc untuk format custom PostgreSQL binary (.backup)
    const command = `pg_dump -Fc -U ${user} -h ${host} -p ${port} ${database} > "${backupPath}"`;
    
    // Jalankan perintah pg_dump
    execSync(command, { env, stdio: 'inherit' });
    
    // Verifikasi bahwa file berhasil dibuat
    if (!fs.existsSync(backupPath)) {
      throw new Error('Gagal membuat file backup');
    }
    
    // Baca file untuk dikembalikan sebagai respons download
    const fileBuffer = fs.readFileSync(backupPath);
    
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Type': 'application/octet-stream',
      },
    });
  } catch (error) {
    console.error('Error backup database:', error);
    return NextResponse.json({ 
      error: 'Gagal backup database', 
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}