import { execSync } from 'child_process';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
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
    
    // Gunakan -Fc untuk format custom PostgreSQL binary (.backup)
    const command = `pg_dump -Fc -U ${user} -h ${host} -p ${port} ${database}`;

    const backup = execSync(command, { env });

    return new NextResponse(backup, {
      headers: {
        'Content-Disposition': 'attachment; filename="backup.backup"',
        'Content-Type': 'application/octet-stream',
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Gagal backup database' }, { status: 500 });
  }
}
