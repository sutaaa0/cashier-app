"use server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import * as jose from "jose";
import { Penjualan, Produk } from "@prisma/client";
import { CreateOrderDetail, Product } from "@/types/types";

// Create JWT token using jose
async function createToken(payload: { userId: number; username: string; role: string }) {
  const secret = new TextEncoder().encode(process.env.JWT_SECRET);
  return await new jose.SignJWT(payload).setProtectedHeader({ alg: "HS256" }).setExpirationTime("30d").sign(secret);
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
    return { status: "Failed", message: `${error}`, code: 500 };
  }
}

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

    const token = await createToken({
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
    return { status: "Failed", message: `${error}`, code: 500 };
  }
}

export async function Logout() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete("token");

    return {
      status: "Success",
      message: "Berhasil logout",
      code: 200,
    };
  } catch (error) {
    console.error("Error saat logout:", `${error}`);
    return {
      status: "Failed",
      message: "Gagal logout",
      code: 500,
    };
  }
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token");

  if (!token) {
    return null;
  }

  try {
    const payload = await verifyToken(token.value);
    if (!payload) return null;

    const user = await prisma.user.findUnique({
      where: { id: payload.userId as number },
      select: {
        id: true,
        username: true,
        level: true,
      },
    });
    return user;
  } catch (error) {
    if (error) {
      return null;
    }
  }
}

// Transform Prisma Product to frontend Product format
function transformProduct(product: Produk): Product {
  return {
    produkId: product.produkId,
    nama: product.nama,
    harga: product.harga,
    kategori: product.kategori,
    image: product.image,
    stok: product.stok
  };
}

// Get all products
export async function getProducts() {
  const products = await prisma.produk.findMany({
    orderBy: { nama: 'asc' }
  });
  return products;
}

export async function createOrder(orderData: Penjualan) {
  try {
    return await prisma.$transaction(async (prisma) => {
      // Ensure customer exists
      let pelanggan = await prisma.pelanggan.findUnique({
        where: { pelangganId: orderData.pelangganId }
      });

      if (!pelanggan) {
        pelanggan = await prisma.pelanggan.create({
          data: {
            nama: "Walk-in Customer",
            alamat: "-",
            nomorTelepon: "-"
          }
        });
      }

      // Create order with valid customer
      const penjualan = await prisma.penjualan.create({
        data: {
          pelangganId: pelanggan.pelangganId,
          total_harga: orderData.total_harga,
          tanggalPenjualan: new Date(),
          detailPenjualan: {
            create: orderData.detailPenjualan.map(item => ({
              produkId: item.produkId,
              kuantitas: item.kuantitas,
              subtotal: item.subtotal
            }))
          }
        },
        include: {
          detailPenjualan: true
        }
      });

      return penjualan;
    });
  } catch (error) {
    console.error("Error creating order:", error);
    throw error;
  }
}

export async function createDetailOrder(detailOrderData: CreateOrderDetail) {
  return await prisma.detailPenjualan.create({
    data: {
      penjualanId: detailOrderData.penjualanId,
      produkId: detailOrderData.produkId,
      kuantitas: detailOrderData.kuantitas,
      subtotal: detailOrderData.subtotal
    }
  });
}

// Get products by category
export async function getProductsByCategory(category: string): Promise<Product[]> {
  const products = await prisma.produk.findMany({
    where: {
      kategori: category === "All Menu" ? undefined : category
    }
  });
  return products.map(transformProduct);
}

// Search products
export async function searchProducts(query: string): Promise<Product[]> {
  const products = await prisma.produk.findMany({
    where: {
      nama: {
        contains: query,
        mode: 'insensitive'
      }
    }
  });
  return products.map(transformProduct);
}

// Get product stock
export async function getProductStock(productId: string): Promise<number> {
  const product = await prisma.produk.findUnique({
    where: { produkId: parseInt(productId) },
    select: { stok: true }
  });
  return product?.stok ?? 0;
}

export async function createCustomer(customerData: { 
  nama: string; 
  alamat: string; 
  nomorTelepon: string 
}) {
  try {
    const customer = await prisma.pelanggan.create({
      data: {
        nama: customerData.nama,
        alamat: customerData.alamat,
        nomorTelepon: customerData.nomorTelepon,
      },
    });
    return { status: "Success", data: customer, code: 200 };
  } catch (error) {
    console.error("Error creating customer:", error);
    return { status: "Failed", message: "Gagal membuat pelanggan", code: 500 };
  }
}