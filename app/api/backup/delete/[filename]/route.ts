// File: app/api/backup/delete/[filename]/route.ts

import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function DELETE(
  request: Request,
  { params }: { params: { filename: string } }
) {
  // Verifikasi autentikasi
//   const session = await getServerSession(authOptions);
//   if (!session || session.user.role !== 'admin') {
//     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
//   }

  const { filename } = params;
  
  // Pastikan filename aman
  const safeFilename = path.basename(filename);
  const filePath = path.join(process.cwd(), "backup", safeFilename);
  
  try {
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'File tidak ditemukan' }, { status: 404 });
    }
    
    fs.unlinkSync(filePath);
    
    return NextResponse.json({ success: true, message: 'File backup berhasil dihapus' });
  } catch (error) {
    console.error('Error deleting backup:', error);
    return NextResponse.json({ error: 'Gagal menghapus file backup' }, { status: 500 });
  }
}
