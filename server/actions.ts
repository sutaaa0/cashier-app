"use server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
<<<<<<< HEAD
import * as jose from 'jose';

// Create JWT token using jose
async function createToken(payload: { userId: string, username: string, role: string }) {
  const secret = new TextEncoder().encode(process.env.JWT_SECRET);
  return await new jose.SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('30d')
    .sign(secret);
}

// Verify JWT token using jose
async function verifyToken(token: string) {
  const secret = new TextEncoder().encode(process.env.JWT_SECRET);
  const { payload } = await jose.jwtVerify(token, secret);
  return payload;
}

export async function Register(username: string, password: string, level: string) {
  try {
    const userExists = await prisma.user.findUnique({
      where: { username },
    });

    if (userExists) {
      return { status: "Failed", message: "User already exists", code: 400 };
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: { username, password: hashedPassword, level },
    });

    return { status: "Success", data: user, code: 200 };
  } catch (error) {
    console.error("Error registering user:", error);
    return { status: "Failed", message: "Gagal", code: 500 };
  }
}

=======
import { createToken } from "@/lib/jwt";
import jwt from "jsonwebtoken";

export async function Register(username: string, password: string, level: string) {
  try {
    const userExists = await prisma.user.findUnique({
      where: { username },
    });

    if (userExists) {
      return { status: "Failed", message: "User already exists", code: 400 };
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: { username, password: hashedPassword, level },
    });

    return { status: "Success", data: user, code: 200 };
  } catch (error) {
    console.error("Error registering user:", error);
    return { status: "Failed", message: "Gagal", code: 500 };
  }
}

>>>>>>> 2356d831e984267b1eeff2ee7a36959fb1aedfec
export async function Login(username: string, password: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      return { status: "Failed", message: "User tidak ditemukan", code: 404 };
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return { status: "Failed", message: "Password salah", code: 401 };
    }

<<<<<<< HEAD
    const token = await createToken({
=======
    // Buat token
    const token = createToken({
>>>>>>> 2356d831e984267b1eeff2ee7a36959fb1aedfec
      userId: user.id,
      username: user.username,
      role: user.level,
    });

    (await cookies()).set({
      name: "token",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    return {
      status: "Success",
      data: { user },
      code: 200,
    };
  } catch (error) {
    console.error("Error saat login:", error);
    return { status: "Failed", message: "Gagal login", code: 500 };
  }
}

export async function Logout() {
  try {
<<<<<<< HEAD
    (await cookies()).delete("token");
=======
    // Hapus cookie token
    (await cookies()).delete("token");

>>>>>>> 2356d831e984267b1eeff2ee7a36959fb1aedfec
    return {
      status: "Success",
      message: "Berhasil logout",
      code: 200,
    };
  } catch (error) {
    console.error("Error saat logout:", error);
    return {
      status: "Failed",
      message: "Gagal logout",
      code: 500,
    };
  }
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token');

  if (!token) {
    return null;
  }

  try {
<<<<<<< HEAD
    const payload = await verifyToken(token.value);
    if (!payload) return null;

    const user = await prisma.user.findUnique({
      where: { id: payload.userId as string },
=======
    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is not defined");
    }
    const decoded = jwt.verify(token.value as string, process.env.JWT_SECRET as string) as unknown as jwt.JwtPayload & { userId: string };
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
>>>>>>> 2356d831e984267b1eeff2ee7a36959fb1aedfec
    });
    return user;
  } catch (error) {
    console.error('Invalid token:', error);
    return null;
  }
<<<<<<< HEAD
}
=======
}
>>>>>>> 2356d831e984267b1eeff2ee7a36959fb1aedfec
