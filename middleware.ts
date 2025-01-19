import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import * as jose from 'jose';


export async function middleware(request: NextRequest) {
  const token = request.cookies.get("token");

  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jose.jwtVerify(token.value, secret);

    // Tambahkan informasi user ke header
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-user-id", payload.userId as string);
    requestHeaders.set("x-user-role", payload.role as string);

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  } catch (error) {
    console.error("JWT tidak valid:", `${error}`);
    return NextResponse.redirect(new URL("/login", request.url));
  }
}

  export const config = {
    matcher: [
      '/home',
      '/api/:path*'
    ]
  };