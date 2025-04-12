// FIle: app/api/backup/list/route.ts

import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  // Verifikasi autentikasi
//   const session = await getServerSession(authOptions);
//   if (!session || session.user.role !== 'admin') {
//     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
//   }

  try {
    const backupDir = path.join(process.cwd(), "backup");
    
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
      return NextResponse.json({ files: [] });
    }
    
    const files = fs.readdirSync(backupDir)
      .filter(file => file.endsWith('.backup'))
      .map(file => {
        const filePath = path.join(backupDir, file);
        const stats = fs.statSync(filePath);
        
        return {
          filename: file,
          size: stats.size,
          created: stats.birthtime || stats.ctime,
          path: filePath
        };
      })
      .sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime());
    
    return NextResponse.json({ files });
  } catch (error) {
    console.error('Error listing backups:', error);
    return NextResponse.json({ error: 'Gagal mendapatkan daftar backup' }, { status: 500 });
  }
}
