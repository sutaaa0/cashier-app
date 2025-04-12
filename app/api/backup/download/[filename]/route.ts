// FILE: app/api/backup/download/[filename]/route.ts

import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET(
  request: NextRequest,
  { params }: { params: { filename: string } }
) {
  // Verifikasi autentikasi
//   const session = await getServerSession(authOptions);
//   if (!session || session.user.role !== 'admin') {
//     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
//   }

  const { filename } = params;
  const filePath = path.join(process.cwd(), "backup", filename);
  
  // Pastikan filename aman
  const safeFilename = path.basename(filename);
  
  try {
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'File tidak ditemukan' }, { status: 404 });
    }
    
    const fileBuffer = fs.readFileSync(filePath);
    
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Disposition': `attachment; filename="${safeFilename}"`,
        'Content-Type': 'application/octet-stream',
      },
    });
  } catch (error) {
    console.error('Error downloading backup:', error);
    return NextResponse.json({ error: 'Gagal mengunduh file backup' }, { status: 500 });
  }
}
