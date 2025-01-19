"use server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import * as jose from "jose";
import { Produk } from "@prisma/client";
import { CreateOrderDetail, Product } from "@/types/types";
import { revalidatePath } from "next/cache";
import { v2 as cloudinary } from "cloudinary";
import { get } from "http";

export type Penjualan = {
  pelangganId?: number;
  guestId?: number;
  total_harga: number;
  detailPenjualan: Array<{
    produkId: number;
    kuantitas: number;
    subtotal: number;
  }>;
};

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
    stok: product.stok,
  };
}

// Get all products
export async function getProducts() {
  const products = await prisma.produk.findMany({
    orderBy: { nama: "asc" },
    where: {
      isDeleted: false,
    },
  });

  return products;
}

export async function createDetailOrder(detailOrderData: CreateOrderDetail) {
  return await prisma.detailPenjualan.create({
    data: {
      penjualanId: detailOrderData.penjualanId,
      produkId: detailOrderData.produkId,
      kuantitas: detailOrderData.kuantitas,
      subtotal: detailOrderData.subtotal,
    },
  });
}

// Get products by category
export async function getProductsByCategory(category: string): Promise<Product[]> {
  const products = await prisma.produk.findMany({
    where: {
      kategori: category === "All Menu" ? undefined : category,
    },
  });
  return products.map(transformProduct);
}

// Search products
export async function searchProducts(query: string): Promise<Product[]> {
  const products = await prisma.produk.findMany({
    where: {
      nama: {
        contains: query,
        mode: "insensitive",
      },
    },
  });
  return products.map(transformProduct);
}

// Get product stock
export async function getProductStock(productId: string): Promise<number> {
  const product = await prisma.produk.findUnique({
    where: { produkId: parseInt(productId) },
    select: { stok: true },
  });
  return product?.stok ?? 0;
}

export async function deleteProduct(productId: number) {
  const deleteProduk = await prisma.produk.update({
    where: {
      produkId: productId,
    },
    data: {
      isDeleted: true,
    },
  });

  return {
    status: "Success",
    data: deleteProduk,
  };
}

export async function createOrder(orderData: Penjualan & { redeemedPoints?: number }) {
  console.log("server actions createOrder:", orderData);
  try {
    return await prisma.$transaction(async (prisma) => {
      let penjualanData: any = {
        total_harga: orderData.total_harga,
        tanggalPenjualan: new Date(),
        detailPenjualan: {
          create: orderData.detailPenjualan.map((item) => ({
            produkId: item.produkId,
            kuantitas: item.kuantitas,
            subtotal: item.subtotal,
          })),
        },
      };

      if (orderData.pelangganId) {
        // For member purchases
        const pelanggan = await prisma.pelanggan.findUnique({
          where: { pelangganId: orderData.pelangganId },
        });

        if (!pelanggan) {
          throw new Error("Customer not found");
        }

        penjualanData.pelangganId = orderData.pelangganId;

        // Calculate points to be awarded (200 rupiah = 1 point)
        const pointsToAward = Math.floor(orderData.total_harga / 200);
        console.log("Server : Points to award:", pointsToAward);

        // Update member's points
        await prisma.pelanggan.update({
          where: { pelangganId: orderData.pelangganId },
          data: { points: { increment: pointsToAward } },
        });

        // Apply redeemed points if any
        if (orderData.redeemedPoints && orderData.redeemedPoints > 0) {
          penjualanData.total_harga = Math.max(penjualanData.total_harga - orderData.redeemedPoints, 0);
        }
      } else if (orderData.guestId) {
        // For guest purchases
        penjualanData.guestId = orderData.guestId;
      } else {
        // If neither pelangganId nor guestId is provided, create a new guest
        const guest = await prisma.guest.create({ data: {} });
        penjualanData.guestId = guest.guestId;
      }

      const penjualan = await prisma.penjualan.create({
        data: penjualanData,
        include: {
          detailPenjualan: true,
          pelanggan: true,
          guest: true,
        },
      });

      return penjualan;
    });
  } catch (error) {
    console.error("Error creating order:", error);
    throw error;
  }
}

export async function getCustomers(query: string) {
  const customers = await prisma.pelanggan.findMany({
    where: {
      OR: [{ nama: { contains: query, mode: "insensitive" } }, { nomorTelepon: { contains: query, mode: "insensitive" } }],
    },
  });
  return customers;
}

export async function createCustomer(customerData: { nama: string; alamat: string; nomorTelepon: string }) {
  try {
    const customer = await prisma.pelanggan.create({
      data: customerData,
    });
    return { status: "Success", data: customer };
  } catch (error) {
    console.error("Error creating customer:", error);
    return { status: "Error", message: "Failed to create customer" };
  }
}

export async function getMemberPoints(pelangganId: number) {
  const member = await prisma.pelanggan.findUnique({
    where: { pelangganId },
    select: { points: true },
  });
  return member?.points || 0;
}

export async function redeemPoints(pelangganId: number, pointsToRedeem: number) {
  const member = await prisma.pelanggan.findUnique({
    where: { pelangganId },
  });

  if (!member || member.points < pointsToRedeem) {
    throw new Error("Insufficient points");
  }

  await prisma.pelanggan.update({
    where: { pelangganId },
    data: { points: { decrement: pointsToRedeem } },
  });

  return pointsToRedeem;
}

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Helper function to upload image to Cloudinary
async function uploadToCloudinary(file: File): Promise<string> {
  try {
    // Convert file to base64
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64String = buffer.toString("base64");
    const dataURI = `data:${file.type};base64,${base64String}`;

    // Upload to Cloudinary
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload(
        dataURI,
        {
          folder: "products", // Customize your folder name
        },
        (error, result) => {
          if (error) reject(error);
          resolve(result);
        }
      );
    });

    // Return the secure URL from Cloudinary
    return (result as any).secure_url;
  } catch (error) {
    console.error("Error uploading to Cloudinary:", error);
    throw new Error("Failed to upload image");
  }
}

// Server action to add a new product
interface ActionResponse {
  status: "Success" | "Error";
  message: string;
  data?: any;
}

export async function addProduct(
  formData: {
    name: string;
    price: number;
    stock: number;
    category: string;
    imageUrl: string; // Sekarang menerima URL gambar langsung
  }
): Promise<ActionResponse> {
  try {
    const product = await prisma.produk.create({
      data: {
        nama: formData.name,
        harga: formData.price,
        stok: formData.stock,
        kategori: formData.category,
        image: formData.imageUrl,
      },
    });

    revalidatePath('/dashboard-admin');

    return {
      status: "Success",
      message: "Produk berhasil ditambahkan",
      data: product,
    };
  } catch (error) {
    console.error('Error menambahkan produk:', error);
    return {
      status: "Error",
      message: error instanceof Error ? error.message : "Gagal menambahkan produk",
    };
  }
}
