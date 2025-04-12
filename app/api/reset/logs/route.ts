// File: app/api/reset/logs/route.ts

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
    const logsDir = path.join(process.cwd(), "logs");
    
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
      return NextResponse.json({ logs: [] });
    }
    
    const logs = fs.readdirSync(logsDir)
      .filter(file => file.startsWith('reset-') && file.endsWith('.log'))
      .map(file => {
        const filePath = path.join(logsDir, file);
        const stats = fs.statSync(filePath);
        const content = fs.readFileSync(filePath, 'utf-8');
        
        return {
          filename: file,
          size: stats.size,
          created: stats.birthtime || stats.ctime,
          content: content,
          path: filePath
        };
      })
      .sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime());
    
    return NextResponse.json({ logs });
  } catch (error) {
    console.error('Error listing reset logs:', error);
    return NextResponse.json({ error: 'Gagal mendapatkan daftar log reset' }, { status: 500 });
  }
}