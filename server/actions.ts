"use server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import * as jose from "jose";
import { DetailPenjualan, Pelanggan, Produk } from "@prisma/client";
import { CreateOrderDetail, CustomerTransactionData } from "@/types/types";
import { revalidatePath } from "next/cache";
import { v2 as cloudinary } from "cloudinary";
import { startOfWeek, subWeeks, format, addDays } from "date-fns";
import { fromZonedTime, toZonedTime, formatInTimeZone } from "date-fns-tz";

export type Penjualan = {
  PenjualanId?: number;
  pelangganId?: number;
  guestId?: number;
  userId: number;
  total_harga: number;
  uangMasuk: number | null;
  kembalian: number | null;
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
  } catch (error: unknown) {
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

// Get all products
export async function getProducts(category: string) {
  if (category === "All Menu") {
    const products = await prisma.produk.findMany({
      orderBy: { nama: "asc" },
      where: {
        isDeleted: false,
      },
      include: {
        kategori: true,
        promotions: true,
      },
    });
    return products;
  } else {
    const products = await prisma.produk.findMany({
      orderBy: { nama: "asc" },
      where: {
        isDeleted: false,
        kategori: {
          nama: category, // filter melalui relasi, bukan field string langsung
        },
      },
      include: {
        kategori: true,
        promotions: true,
      },
    });
    return products;
  }
}

export async function getAdminProduct() {
  try {
    const products = await prisma.produk.findMany({
      orderBy: { nama: "asc" },
      where: { isDeleted: false },
      include: {
        kategori: {
          select: {
            kategoriId: true,
            nama: true,
          },
        },
      },
    });

    console.log("Data produk yang dikirim:", products);
    return products;
  } catch (error) {
    console.error("Error fetching products:", error);
    throw new Error("Failed to fetch products");
  }
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

export async function createOrder(orderData: Penjualan & { redeemedPoints?: number }): Promise<
  | (Penjualan & {
      detailPenjualan: DetailPenjualan[];
      pointsAwarded: number;
      pointsRedeemed: number;
      originalTotal: number;
      finalTotal: number;
    })
  | null
> {
  console.log("Data yang diterima di createOrder:", orderData);
  try {
    return await prisma.$transaction(async (tx) => {
      // Jika pembeli bukan member (guest), pastikan guestId ada
      if (!orderData.pelangganId && !orderData.guestId) {
        const guest = await tx.guest.create({ data: {} });
        orderData.guestId = guest.guestId;
      }

      // Ensure pelangganId is undefined if null
      if (orderData.pelangganId === null) {
        orderData.pelangganId = undefined;
      }

      if (orderData.pelangganId) {
        const poinAfterDiscount = orderData.total_harga / 200;

        await prisma.pelanggan.update({
          where: { pelangganId: orderData.pelangganId },
          data: { points: { increment: poinAfterDiscount } },
        });
      }

      // Siapkan payload pembuatan penjualan
      const penjualanData = {
        tanggalPenjualan: new Date(),
        total_harga: orderData.total_harga,
        userId: orderData.userId,
        uangMasuk: orderData.uangMasuk || 0, // Simpan uang masuk
        kembalian: orderData.kembalian || 0, // Simpan kembalian
        pelangganId: orderData.pelangganId !== null ? orderData.pelangganId : undefined,
        guestId: orderData.guestId !== null ? orderData.guestId : undefined,
        detailPenjualan: {
          create: orderData.detailPenjualan.map((detail) => ({
            produkId: detail.produkId,
            kuantitas: detail.kuantitas,
            subtotal: Math.round(detail.subtotal),
          })),
        },
      };

      console.log("Payload pembuatan penjualan:", penjualanData);

      // Create the sale record
      const penjualan = await tx.penjualan.create({
        data: penjualanData,
        include: {
          detailPenjualan: { include: { produk: true } },
          pelanggan: true,
          guest: true,
          user: true,
        },
      });

      // Update product stock
      for (const detail of orderData.detailPenjualan) {
        await tx.produk.update({
          where: { produkId: detail.produkId },
          data: { stok: { decrement: detail.kuantitas } },
        });
      }

      return {
        ...penjualan,
        PenjualanId: penjualan.penjualanId,
        pointsAwarded: orderData.redeemedPoints,
        pointsRedeemed: orderData.redeemedPoints || 0,
        originalTotal: orderData.total_harga,
        finalTotal: orderData.total_harga,
      } as Penjualan & {
        detailPenjualan: DetailPenjualan[];
        pointsAwarded: number;
        pointsRedeemed: number;
        originalTotal: number;
        finalTotal: number;
      };
    });
  } catch (error) {
    console.error("Error saat membuat penjualan:", error);
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

export async function redeemPoints(
  pelangganId: number, 
  pointsToRedeem: number, 
  harga: number
) {
  const member = await prisma.pelanggan.findUnique({
    where: { pelangganId },
  });

  if (!member) {
    throw new Error("Pelanggan tidak ditemukan");
  }

  // Batasi poin yang diredeem agar tidak melebihi harga transaksi
  const effectiveRedeem = Math.min(pointsToRedeem, harga, member.points);

  await prisma.pelanggan.update({
    where: { pelangganId },
    data: { points: { decrement: effectiveRedeem } },
  });
  
  return effectiveRedeem;
}


// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Server action to add a new product
interface ActionResponse {
  status: "Success" | "Error";
  message: string;
  data?: Record<string, unknown>;
}

// Types
interface Category {
  kategoriId: number;
  nama: string;
}

export async function addProduct(formData: { name: string; price: number; stock: number; minimumStok: number; categoryId: number; imageUrl: string }): Promise<{ status: string; message: string; data?: Produk }> {
  try {
    if (!formData.name || !formData.price || !formData.stock || !formData.minimumStok || !formData.categoryId || !formData.imageUrl) {
      return {
        status: "Error",
        message: "Semua data produk harus diisi",
      };
    }

    if (formData.price <= 0 || formData.stock < 0 || formData.minimumStok < 0) {
      return {
        status: "Error",
        message: "Harga, stok, dan minimum stok harus bernilai positif",
      };
    }

    let statusStok: "CRITICAL" | "LOW" | "NORMAL";
    if (formData.stock <= formData.minimumStok * 0.5) {
      statusStok = "CRITICAL";
    } else if (formData.stock > formData.minimumStok * 0.5 && formData.stock <= formData.minimumStok) {
      statusStok = "LOW";
    } else {
      statusStok = "NORMAL";
    }

    const product = await prisma.produk.create({
      data: {
        nama: formData.name,
        harga: formData.price,
        stok: formData.stock,
        kategoriId: formData.categoryId,
        image: formData.imageUrl,
        minimumStok: formData.minimumStok,
        statusStok: statusStok,
      },
    });

    // Memicu revalidasi path (sesuaikan dengan kebutuhan project Anda)
    revalidatePath("/dashboard-admin");

    return {
      status: "Success",
      message: "Produk berhasil ditambahkan",
      data: product,
    };
  } catch (error) {
    console.error("Error menambahkan produk:", error);
    return {
      status: "Error",
      message: error instanceof Error ? error.message : "Gagal menambahkan produk",
    };
  }
}

export async function fetchCategories(): Promise<{ status: string; data?: Category[]; message?: string }> {
  try {
    const categories = await prisma.kategori.findMany({
      orderBy: { nama: "asc" },
    });

    if (!categories.length) {
      return { status: "Error", message: "No categories found" };
    }

    return { status: "Success", data: categories };
  } catch (error) {
    console.error("Error fetching categories:", error);
    return { status: "Error", message: "Failed to fetch categories" };
  }
}

export async function getCategory() {
  try {
    const res = await prisma.kategori.findMany({
      orderBy: { nama: "asc" },
    });

    return res;
  } catch (error) {
    console.log(error);
  }
}

export async function updateCategory(data: { kategoriId: number; nama: string; icon?: string }) {
  try {
    const updatedCategory = await prisma.kategori.update({
      where: { kategoriId: data.kategoriId },
      data: {
        nama: data.nama,
        icon: data.icon || "",
        // Karena kita tidak menyimpan color, field color bisa dibiarkan atau diabaikan
      },
    });
    return { status: "Success", data: updatedCategory };
  } catch (error) {
    console.error("Error updating category:", error);
    return { status: "Error", message: error instanceof Error ? error.message : "Failed to update category" };
  }
}

export async function addCategory(data: { nama: string; icon?: string; color?: string }) {
  try {
    // Cek apakah kategori dengan nama tersebut sudah ada
    const existingCategory = await prisma.kategori.findUnique({
      where: { nama: data.nama },
    });

    if (existingCategory) {
      return { status: "Error", message: "Category already exists" };
    }

    // Buat kategori baru dengan menyertakan icon dan color jika ada,
    // jika tidak ada, bisa disimpan sebagai string kosong (atau nilai default lainnya)
    const newCategory = await prisma.kategori.create({
      data: {
        nama: data.nama,
        icon: data.icon || "",
      },
    });

    return { status: "Success", data: newCategory };
  } catch (error) {
    console.error("Error adding category:", error);
    return { status: "Error", message: "Failed to add category" };
  }
}

export async function updateProduct(formData: { id: number; name: string; price: number; stock: number; minimumStok: number; category: string; imageUrl: string }): Promise<{ status: string; message: string; data?: Produk }> {
  try {
    let statusStok: "CRITICAL" | "LOW" | "NORMAL";
    if (formData.stock <= formData.minimumStok * 0.5) {
      statusStok = "CRITICAL";
    } else if (formData.stock > formData.minimumStok * 0.5 && formData.stock <= formData.minimumStok) {
      statusStok = "LOW";
    } else {
      statusStok = "NORMAL";
    }

    const product = await prisma.produk.update({
      where: { produkId: formData.id },
      data: {
        nama: formData.name,
        harga: formData.price,
        stok: formData.stock,
        kategori: { connect: { nama: formData.category } },
        image: formData.imageUrl,
        minimumStok: formData.minimumStok,
        statusStok: statusStok,
      },
    });

    revalidatePath("/dashboard-admin");

    return { status: "Success", message: "Product updated successfully", data: product };
  } catch (error) {
    console.error("Error updating product:", error);
    return {
      status: "Error",
      message: error instanceof Error ? error.message : "Failed to update product",
    };
  }
}

interface ActionResponse {
  status: "Success" | "Error";
  message: string;
  data?: Record<string, unknown>;
}

export async function addUser(formData: { username: string; password: string; level: string }): Promise<ActionResponse> {
  try {
    // Cek apakah username sudah ada
    const existingUser = await prisma.user.findUnique({
      where: { username: formData.username },
    });

    if (existingUser) {
      return {
        status: "Error",
        message: "Username sudah digunakan",
      };
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(formData.password, 10);

    const user = await prisma.user.create({
      data: {
        username: formData.username,
        password: hashedPassword,
        level: formData.level,
      },
    });

    revalidatePath("/dashboard-admin");

    return {
      status: "Success",
      message: "User berhasil ditambahkan",
      data: user,
    };
  } catch (error) {
    console.error("Error menambahkan user:", error);
    return {
      status: "Error",
      message: error instanceof Error ? error.message : "Gagal menambahkan user",
    };
  }
}

export async function updateUser(formData: { id: number; username: string; password?: string; level: string }): Promise<ActionResponse> {
  try {
    // Cek apakah username sudah ada (kecuali untuk user yang sedang diupdate)
    const existingUser = await prisma.user.findFirst({
      where: {
        username: formData.username,
        NOT: { id: formData.id },
      },
    });

    if (existingUser) {
      return {
        status: "Error",
        message: "Username sudah digunakan",
      };
    }

    const updateData: { username: string; level: string; password?: string } = {
      username: formData.username,
      level: formData.level,
    };

    // Hanya update password jika ada password baru
    if (formData.password) {
      updateData.password = await bcrypt.hash(formData.password, 10);
    }

    const user = await prisma.user.update({
      where: { id: formData.id },
      data: updateData,
    });

    revalidatePath("/dashboard-admin");

    return {
      status: "Success",
      message: "User berhasil diupdate",
      data: user,
    };
  } catch (error) {
    console.error("Error mengupdate user:", error);
    return {
      status: "Error",
      message: error instanceof Error ? error.message : "Gagal mengupdate user",
    };
  }
}

export async function deleteUser(id: number): Promise<ActionResponse> {
  try {
    await prisma.user.delete({
      where: { id },
    });

    revalidatePath("/dashboard-admin");

    return {
      status: "Success",
      message: "User berhasil dihapus",
    };
  } catch (error) {
    console.error("Error menghapus user:", error);
    return {
      status: "Error",
      message: error instanceof Error ? error.message : "Gagal menghapus user",
    };
  }
}

export async function getUsers() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        level: true,
      },
    });
    return users;
  } catch (error) {
    throw error;
  }
}

export async function getPelanggan() {
  try {
    const pelanggan = await prisma.pelanggan.findMany({
      select: {
        nama: true,
        alamat: true,
        nomorTelepon: true,
        points: true,
        createdAt: true,
        pelangganId: true,
      },
    });
    return pelanggan;
  } catch (error) {
    console.log(error);
  }
}

export async function addPelanggan(data: { nama: string; alamat?: string; nomorTelepon?: string }) {
  try {
    const newPelanggan = await prisma.pelanggan.create({
      data: {
        nama: data.nama,
        alamat: data.alamat,
        nomorTelepon: data.nomorTelepon,
      },
    });
    return { status: "Success", data: newPelanggan };
  } catch (error) {
    console.error("Error adding customer:", error);
    return { status: "Error", message: "Failed to add customer" };
  }
}

export async function updatePelanggan(data: Pelanggan) {
  try {
    const updatedPelanggan = await prisma.pelanggan.update({
      where: { pelangganId: data.pelangganId },
      data: {
        nama: data.nama,
        alamat: data.alamat,
        nomorTelepon: data.nomorTelepon,
        points: data.points,
      },
    });
    return { status: "Success", data: updatedPelanggan };
  } catch (error) {
    console.error("Error updating customer:", error);
    return { status: "Error", message: "Failed to update customer" };
  }
}

export async function deletePelanggan(pelangganId: number) {
  try {
    await prisma.pelanggan.delete({
      where: { pelangganId },
    });
    return { status: "Success" };
  } catch (error) {
    console.error("Error deleting customer:", error);
    return { status: "Error", message: "Failed to delete customer" };
  }
}

export async function getTransactions() {
  try {
    const transactions = await prisma.penjualan.findMany({
      include: {
        pelanggan: true,
        guest: true,
        detailPenjualan: {
          include: {
            produk: true,
          },
        },
      },
      orderBy: {
        tanggalPenjualan: "desc",
      },
    });
    return { status: "Success", data: transactions };
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return { status: "Error", message: "Failed to fetch transactions" };
  }
}

interface StockData {
  id: number;
  name: string;
  currentStock: number;
  minStock: number;
  category: string;
  lastUpdated: string;
  status?: "CRITICAL" | "LOW" | "NORMAL";
}

interface ApiResponse<T> {
  status: "Success" | "Error";
  data?: T;
  message?: string;
}

export async function getStockItemsManagement(): Promise<ApiResponse<StockData[]>> {
  try {
    const products = await prisma.produk.findMany({
      where: {
        isDeleted: false,
      },
      include: {
        kategori: true,
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    const stockItems: StockData[] = products.map((product) => ({
      id: product.produkId,
      name: product.nama,
      currentStock: product.stok,
      minStock: product.minimumStok,
      category: product.kategori.nama,
      lastUpdated: product.updatedAt.toISOString(),
    }));

    return {
      status: "Success",
      data: stockItems,
    };
  } catch (error) {
    console.error("Failed to fetch stock items:", error);
    return {
      status: "Error",
      message: "Failed to fetch stock items",
    };
  }
}



export async function getStockItems(): Promise<ApiResponse<StockData[]>> {
  try {
    const products = await prisma.produk.findMany({
      where: {
        isDeleted: false,
      },
      include: {
        kategori: true,
      },
      orderBy: {
        updatedAt: "desc",
      },
      take: 5,
    });

    const stockItems: StockData[] = products.map((product) => ({
      id: product.produkId,
      name: product.nama,
      currentStock: product.stok,
      minStock: product.minimumStok,
      category: product.kategori.nama,
      lastUpdated: product.updatedAt.toISOString(),
    }));

    return {
      status: "Success",
      data: stockItems,
    };
  } catch (error) {
    console.error("Failed to fetch stock items:", error);
    return {
      status: "Error",
      message: "Failed to fetch stock items",
    };
  }
}

export async function updateStockItem(id: number, newStock: number): Promise<ApiResponse<StockData>> {
  try {
    // Ambil data produk untuk mendapatkan minStock
    const product: { stok: number; minimumStok: number; nama: string; kategori: { nama: string }; updatedAt: Date } | null = await prisma.produk.findUnique({
      where: { produkId: id, isDeleted: false },
      select: { stok: true, minimumStok: true, nama: true, kategori: { select: { nama: true } }, updatedAt: true },
    });

    if (!product) {
      return {
        status: "Error",
        message: "Product not found",
      };
    }

    // Tentukan status stok berdasarkan minStock
    let statusStok: "CRITICAL" | "LOW" | "NORMAL";
    if (newStock <= product.minimumStok * 0.5) {
      statusStok = "CRITICAL";
    } else if (newStock > product.minimumStok * 0.5 && newStock <= product.minimumStok) {
      statusStok = "LOW";
    } else {
      statusStok = "NORMAL";
    }

    // Update produk dengan stok baru dan status yang diperbarui
    const updatedProduct = await prisma.produk.update({
      where: { produkId: id },
      data: {
        stok: newStock,
        statusStok: statusStok, // Update status stok
        updatedAt: new Date(),
      },
      include: {
        kategori: true,
      },
    });

    const updatedItem: StockData = {
      id: updatedProduct.produkId,
      name: updatedProduct.nama,
      currentStock: updatedProduct.stok,
      minStock: product.minimumStok, // Ambil dari data awal
      category: updatedProduct.kategori.nama,
      status: statusStok,
      lastUpdated: updatedProduct.updatedAt.toISOString(),
    };

    revalidatePath("/dashboard-admin"); // Sesuaikan dengan path yang benar

    return {
      status: "Success",
      data: updatedItem,
    };
  } catch (error) {
    console.error("Failed to update stock item:", error);
    return {
      status: "Error",
      message: "Failed to update stock item",
    };
  }
}

export async function deleteStockItem(id: number): Promise<ApiResponse<void>> {
  try {
    await prisma.produk.update({
      where: {
        produkId: id,
      },
      data: {
        isDeleted: true,
      },
    });

    revalidatePath("/stock-management"); // Adjust the path as needed

    return {
      status: "Success",
    };
  } catch (error) {
    console.error("Failed to delete stock item:", error);
    return {
      status: "Error",
      message: "Failed to delete stock item",
    };
  }
}

export interface ReportData {
  id: number;
  name: string;
  period: string;
  type: "sales" | "inventory" | "customers";
  generatedDate: string;
  summary: string;
  data: Record<string, unknown>[];
}

export async function generateReport(type: string): Promise<ReportData> {
  const currentDate = new Date();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  let reportData: Partial<ReportData> = {};

  switch (type) {
    case "sales": {
      const salesData = await prisma.penjualan.findMany({
        where: { tanggalPenjualan: { gte: firstDayOfMonth } },
        include: { detailPenjualan: { include: { produk: true } } },
      });
      const totalSales = salesData.reduce((sum, sale) => sum + sale.total_harga, 0);
      reportData = {
        name: "Monthly Sales Report",
        period: currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
        type: "sales",
        summary: `Total Sales: ${new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(totalSales)} | Orders: ${salesData.length}`,
        data: salesData,
      };
      break;
    }

    case "inventory": {
      const products = await prisma.produk.findMany({ where: { isDeleted: false } });
      const lowStock = products.filter((p) => p.stok < 10).length;
      reportData = {
        name: "Inventory Status",
        period: `Q${Math.floor(currentDate.getMonth() / 3) + 1} ${currentDate.getFullYear()}`,
        type: "inventory",
        summary: `Items: ${products.length} | Low Stock: ${lowStock}`,
        data: products,
      };
      break;
    }

    case "customers": {
      const customers = await prisma.pelanggan.findMany({ include: { penjualan: true } });
      const totalPoints = customers.reduce((sum, customer) => sum + customer.points, 0);
      reportData = {
        name: "Customer Analytics",
        period: currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
        type: "customers",
        summary: `Total Customers: ${customers.length} | Total Points: ${totalPoints}`,
        data: customers,
      };
      break;
    }
  }

  return {
    id: Date.now(),
    name: reportData.name || "",
    period: reportData.period || "",
    type: reportData.type || "sales",
    summary: reportData.summary || "",
    data: reportData.data || [],
    generatedDate: new Date().toISOString(),
  };
}

export const getRevenue = async () => {
  try {
    // Mengambil tanggal saat ini
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisYearStart = new Date(now.getFullYear(), 0, 1);

    // Menghitung tanggal awal untuk periode sebelumnya
    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(todayStart.getDate() - 1);

    const lastWeekStart = new Date(thisWeekStart);
    lastWeekStart.setDate(thisWeekStart.getDate() - 7);

    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    const lastYearStart = new Date(now.getFullYear() - 1, 0, 1);
    const lastYearEnd = new Date(now.getFullYear() - 1, 11, 31);

    // Query untuk menghitung revenue berdasarkan periode
    const todayRevenue = await prisma.penjualan.aggregate({
      where: {
        tanggalPenjualan: {
          gte: todayStart,
        },
      },
      _sum: {
        total_harga: true,
      },
    });

    const yesterdayRevenue = await prisma.penjualan.aggregate({
      where: {
        tanggalPenjualan: {
          gte: yesterdayStart,
          lt: todayStart,
        },
      },
      _sum: {
        total_harga: true,
      },
    });

    const thisWeekRevenue = await prisma.penjualan.aggregate({
      where: {
        tanggalPenjualan: {
          gte: thisWeekStart,
        },
      },
      _sum: {
        total_harga: true,
      },
    });

    const lastWeekRevenue = await prisma.penjualan.aggregate({
      where: {
        tanggalPenjualan: {
          gte: lastWeekStart,
          lt: thisWeekStart,
        },
      },
      _sum: {
        total_harga: true,
      },
    });

    const thisMonthRevenue = await prisma.penjualan.aggregate({
      where: {
        tanggalPenjualan: {
          gte: thisMonthStart,
        },
      },
      _sum: {
        total_harga: true,
      },
    });

    const lastMonthRevenue = await prisma.penjualan.aggregate({
      where: {
        tanggalPenjualan: {
          gte: lastMonthStart,
          lte: lastMonthEnd,
        },
      },
      _sum: {
        total_harga: true,
      },
    });

    const thisYearRevenue = await prisma.penjualan.aggregate({
      where: {
        tanggalPenjualan: {
          gte: thisYearStart,
        },
      },
      _sum: {
        total_harga: true,
      },
    });

    const lastYearRevenue = await prisma.penjualan.aggregate({
      where: {
        tanggalPenjualan: {
          gte: lastYearStart,
          lte: lastYearEnd,
        },
      },
      _sum: {
        total_harga: true,
      },
    });

    // Menghitung persentase perubahan
    const calculatePercentageChange = (current: number, previous: number): number => {
      if (previous === 0) return current !== 0 ? 100 : 0; // Handle division by zero
      return ((current - previous) / previous) * 100;
    };

    const todayChange = calculatePercentageChange(todayRevenue._sum.total_harga || 0, yesterdayRevenue._sum.total_harga || 0);

    const thisWeekChange = calculatePercentageChange(thisWeekRevenue._sum.total_harga || 0, lastWeekRevenue._sum.total_harga || 0);

    const thisMonthChange = calculatePercentageChange(thisMonthRevenue._sum.total_harga || 0, lastMonthRevenue._sum.total_harga || 0);

    const thisYearChange = calculatePercentageChange(thisYearRevenue._sum.total_harga || 0, lastYearRevenue._sum.total_harga || 0);

    // Mengembalikan data revenue
    return {
      today: todayRevenue._sum.total_harga || 0,
      todayChange: todayChange,
      thisWeek: thisWeekRevenue._sum.total_harga || 0,
      thisWeekChange: thisWeekChange,
      thisMonth: thisMonthRevenue._sum.total_harga || 0,
      thisMonthChange: thisMonthChange,
      thisYear: thisYearRevenue._sum.total_harga || 0,
      thisYearChange: thisYearChange,
    };
  } catch (error) {
    console.error("Error fetching revenue data:", error);
    throw error;
  }
};

export async function getTransactionsStats() {
  try {
    // Get today's date at start of day
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get yesterday's date
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Get only today and yesterday counts
    const [todayCount, yesterdayCount] = await Promise.all([
      // Today's transactions
      prisma.penjualan.count({
        where: {
          tanggalPenjualan: {
            gte: today,
          },
        },
      }),
      // Yesterday's transactions
      prisma.penjualan.count({
        where: {
          tanggalPenjualan: {
            gte: yesterday,
            lt: today,
          },
        },
      }),
    ]);

    return {
      today: todayCount,
      yesterday: yesterdayCount,
      difference: todayCount - yesterdayCount,
    };
  } catch (error) {
    console.error("Error fetching transaction stats:", error);
    throw error;
  }
}

// /server/actions.js

export async function getNewCustomersStats() {
  try {
    // Get today's date at start of day
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get yesterday's date
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Get new customers counts for today and yesterday
    const [todayCount, yesterdayCount] = await Promise.all([
      // Today's new customers
      prisma.pelanggan.count({
        where: {
          createdAt: {
            gte: today,
          },
          nama: {
            not: "Guest", // Exclude guests
          },
        },
      }),
      // Yesterday's new customers
      prisma.pelanggan.count({
        where: {
          createdAt: {
            gte: yesterday,
            lt: today,
          },
          nama: {
            not: "Guest", // Exclude guests
          },
        },
      }),
    ]);

    return {
      today: todayCount,
      yesterday: yesterdayCount,
      difference: todayCount - yesterdayCount,
    };
  } catch (error) {
    console.error("Error fetching new customers stats:", error);
    throw error;
  }
}

// /server/actions.js

export async function getRevenueChartData(period: "daily" | "weekly" | "monthly" | "yearly") {
  try {
    const now = new Date();
    let startDate: Date;
    let data: { tanggalPenjualan: Date; total_harga: number }[];

    switch (period) {
      case "daily": {
        // Ambil data transaksi dari awal hari ini (UTC)
        startDate = new Date(now);
        startDate.setHours(0, 0, 0, 0);

        data = await prisma.penjualan.findMany({
          where: { tanggalPenjualan: { gte: startDate } },
          select: { tanggalPenjualan: true, total_harga: true },
        });

        // Inisialisasi array 24 jam dengan default 0
        const dailyData = Array.from({ length: 24 }, (_, i) => ({
          name: `${i.toString().padStart(2, "0")}:00`,
          amount: 0,
        }));

        // Lakukan konversi setiap tanggal transaksi ke zona Asia/Jakarta dan agregasikan total_harga berdasarkan jam
        data.forEach((row) => {
          const zonedDate = toZonedTime(row.tanggalPenjualan, "Asia/Jakarta");
          const hour = zonedDate.getHours();
          dailyData[hour].amount += Number(row.total_harga);
        });

        return dailyData;
      }

      case "weekly": {
        // Ambil data transaksi 7 hari terakhir (mulai dari 6 hari yang lalu sampai hari ini)
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 6);
        startDate.setHours(0, 0, 0, 0);

        data = await prisma.penjualan.findMany({
          where: { tanggalPenjualan: { gte: startDate } },
          select: { tanggalPenjualan: true, total_harga: true },
        });

        // Buat map dengan key berupa string tanggal (format yyyy-MM-dd) di zona Asia/Jakarta
        const weeklyMap: Record<string, { name: string; amount: number }> = {};

        // Inisialisasi selama 7 hari dari startDate
        for (let i = 0; i < 7; i++) {
          const d = new Date(startDate);
          d.setDate(d.getDate() + i);
          const key = format(toZonedTime(d, "Asia/Jakarta"), "yyyy-MM-dd");
          // Gunakan format hari singkat (misalnya: Mon, Tue, dst)
          const dayName = format(toZonedTime(d, "Asia/Jakarta"), "EEE");
          weeklyMap[key] = { name: dayName, amount: 0 };
        }

        // Agregasi total_harga berdasarkan tanggal (setelah konversi ke WIB)
        data.forEach((row) => {
          const zonedDate = toZonedTime(row.tanggalPenjualan, "Asia/Jakarta");
          const key = format(zonedDate, "yyyy-MM-dd");
          if (weeklyMap[key]) {
            weeklyMap[key].amount += Number(row.total_harga);
          }
        });

        return Object.values(weeklyMap);
      }

      case "monthly": {
        // Ambil data transaksi dari awal bulan ini
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);

        data = await prisma.penjualan.findMany({
          where: { tanggalPenjualan: { gte: startDate } },
          select: { tanggalPenjualan: true, total_harga: true },
        });

        const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        const monthlyData = Array.from({ length: daysInMonth }, (_, i) => ({
          name: `${(i + 1).toString().padStart(2, "0")}`,
          amount: 0,
        }));

        data.forEach((row) => {
          const zonedDate = toZonedTime(row.tanggalPenjualan, "Asia/Jakarta");
          const day = zonedDate.getDate(); // 1-based
          monthlyData[day - 1].amount += Number(row.total_harga);
        });

        return monthlyData;
      }

      case "yearly": {
        // Ambil data transaksi dari awal tahun ini
        startDate = new Date(now.getFullYear(), 0, 1);

        data = await prisma.penjualan.findMany({
          where: { tanggalPenjualan: { gte: startDate } },
          select: { tanggalPenjualan: true, total_harga: true },
        });

        // Buat array 12 bulan (0: Jan, 11: Dec)
        const yearlyData = Array.from({ length: 12 }, (_, i) => ({
          name: formatInTimeZone(new Date(now.getFullYear(), i, 1), "Asia/Jakarta", "MMM"),
          amount: 0,
        }));

        data.forEach((row) => {
          const zonedDate = toZonedTime(row.tanggalPenjualan, "Asia/Jakarta");
          const month = zonedDate.getMonth(); // 0-based
          yearlyData[month].amount += Number(row.total_harga);
        });

        return yearlyData;
      }

      default:
        throw new Error("Invalid period");
    }
  } catch (error) {
    console.error("Error fetching revenue chart data:", error);
    throw error;
  }
}

interface CategorySale {
  name: string;
  value: number;
}

export async function getCategorySales() {
  try {
    // Get sales data with category details in a single query
    const salesData = await prisma.detailPenjualan.findMany({
      select: {
        kuantitas: true,
        produk: {
          select: {
            kategori: {
              select: {
                nama: true,
              },
            },
          },
        },
      },
      where: {
        produk: {
          isDeleted: false,
        },
      },
    });

    // Aggregate sales by category
    const categoryTotals = salesData.reduce((acc, sale) => {
      const categoryName = sale.produk.kategori.nama;

      if (!acc[categoryName]) {
        acc[categoryName] = 0;
      }

      acc[categoryName] += sale.kuantitas;
      return acc;
    }, {} as Record<string, number>);

    // Transform to chart format and sort by value
    const formattedData: CategorySale[] = Object.entries(categoryTotals)
      .map(([name, value]) => ({
        name,
        value,
      }))
      .sort((a, b) => b.value - a.value);

    return formattedData;
  } catch (error) {
    console.error("Error fetching category sales:", error);
    throw new Error("Failed to fetch category sales data");
  }
}

// In /server/actions.js
export async function getPeakHours() {
  try {
    const now = new Date();
    // Ambil batas awal dan akhir hari dalam UTC
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    // Ambil semua transaksi hari ini
    const data = await prisma.penjualan.findMany({
      where: {
        tanggalPenjualan: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      select: { tanggalPenjualan: true },
    });

    // Inisialisasi array 24 jam dengan default jumlah 0
    const hourCounts = Array.from({ length: 24 }, (_, i) => ({
      hour: `${i.toString().padStart(2, "0")}:00`,
      customers: 0,
    }));

    // Konversi setiap tanggal ke zona Asia/Jakarta dan kelompokkan berdasarkan jam
    data.forEach((row) => {
      const zonedDate = toZonedTime(row.tanggalPenjualan, "Asia/Jakarta");
      const hour = zonedDate.getHours();
      hourCounts[hour].customers += 1;
    });

    return hourCounts;
  } catch (error) {
    console.error("Error fetching peak hours:", error);
    throw error;
  }
}

interface CategoryCount {
  kategori: string;
  icon: string;
  _count: {
    produkId: number;
  };
}

export async function getCategoryCounts() {
  try {
    // Get all non-deleted products with their categories
    const [categories, totalCount] = await Promise.all([
      // Get all categories with their product counts
      prisma.kategori.findMany({
        select: {
          nama: true,
          icon: true,
          _count: {
            select: {
              produk: {
                where: {
                  isDeleted: false,
                },
              },
            },
          },
        },
        orderBy: {
          nama: "asc",
        },
      }),
      // Get total count of non-deleted products
      prisma.produk.count({
        where: {
          isDeleted: false,
        },
      }),
    ]);

    // Map the categories to the expected format
    const categoryCounts: CategoryCount[] = categories.map((category) => ({
      kategori: category.nama,
      icon: category.icon,
      _count: {
        produkId: category._count.produk,
      },
    }));

    return {
      categoryCounts,
      totalCount,
    };
  } catch (error) {
    console.error("Error in getCategoryCounts:", error);
    throw new Error("Failed to fetch category counts");
  }
}

export async function getSalesTrendData() {
  const TIME_ZONE = "Asia/Jakarta";
  try {
    // Ambil waktu sekarang dalam zona Asia/Jakarta
    const now = toZonedTime(new Date(), TIME_ZONE);

    // Tentukan awal minggu dengan hari Senin sebagai awal minggu
    const thisWeekStartLocal = startOfWeek(now, { weekStartsOn: 1 });
    // Konversi ke UTC agar sesuai dengan penyimpanan di database
    const thisWeekStartUTC = fromZonedTime(thisWeekStartLocal, TIME_ZONE);

    // Tentukan akhir minggu (7 hari kemudian)
    const thisWeekEndLocal = addDays(thisWeekStartLocal, 7);
    const thisWeekEndUTC = fromZonedTime(thisWeekEndLocal, TIME_ZONE);

    // Tentukan minggu sebelumnya
    const lastWeekStartLocal = subWeeks(thisWeekStartLocal, 1);
    const lastWeekStartUTC = fromZonedTime(lastWeekStartLocal, TIME_ZONE);
    const lastWeekEndLocal = addDays(lastWeekStartLocal, 7);
    const lastWeekEndUTC = fromZonedTime(lastWeekEndLocal, TIME_ZONE);

    // Fungsi untuk mendapatkan data penjualan per hari dari tanggal mulai hingga tanggal akhir
    const getDailySales = async (startDate: Date, endDate: Date) => {
      // Ambil data penjualan yang sesuai dengan rentang tanggal (UTC)
      const salesRecords = await prisma.penjualan.findMany({
        where: {
          tanggalPenjualan: {
            gte: startDate,
            lt: endDate,
          },
        },
        select: {
          tanggalPenjualan: true,
          total_harga: true,
        },
      });

      // Inisialisasi array untuk hari Senin sampai Minggu
      const daysData = [
        { day: "Sen", sales: 0 },
        { day: "Sel", sales: 0 },
        { day: "Rab", sales: 0 },
        { day: "Kam", sales: 0 },
        { day: "Jum", sales: 0 },
        { day: "Sab", sales: 0 },
        { day: "Min", sales: 0 },
      ];

      // Lakukan grouping berdasarkan hari (dalam zona waktu Asia/Jakarta)
      salesRecords.forEach((record) => {
        // Konversi tanggalPenjualan dari UTC ke zona Asia/Jakarta
        const localDate = toZonedTime(record.tanggalPenjualan, TIME_ZONE);
        // getDay() mengembalikan 0 untuk Minggu, 1 untuk Senin, ... 6 untuk Sabtu.
        const jsDay = localDate.getDay();
        // Konversi: jika jsDay 0 (Minggu) maka index 6, jika tidak maka jsDay - 1 (Senin index 0)
        const dayIndex = jsDay === 0 ? 6 : jsDay - 1;
        daysData[dayIndex].sales += Number(record.total_harga);
      });

      return daysData;
    };

    // Ambil data penjualan untuk minggu ini dan minggu sebelumnya secara paralel
    const [thisWeekData, lastWeekData] = await Promise.all([getDailySales(thisWeekStartUTC, thisWeekEndUTC), getDailySales(lastWeekStartUTC, lastWeekEndUTC)]);

    return {
      thisWeek: thisWeekData,
      lastWeek: lastWeekData,
    };
  } catch (error) {
    console.error("Error mengambil data trend penjualan:", error);
    throw error;
  }
}

export async function getTopSellingProducts() {
  try {
    // Mengambil data penjualan 30 hari terakhir
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Mengambil data produk terlaris
    const topProducts = await prisma.detailPenjualan.groupBy({
      by: ["produkId"],
      where: {
        penjualan: {
          tanggalPenjualan: {
            gte: thirtyDaysAgo,
          },
        },
      },
      _sum: {
        kuantitas: true,
        subtotal: true,
      },
      orderBy: {
        _sum: {
          kuantitas: "desc", // Menambahkan arah pengurutan
        },
      },
      take: 4,
    });

    // Mengambil detail produk
    const productsWithDetails = await Promise.all(
      topProducts.map(async (item) => {
        const product = await prisma.produk.findUnique({
          where: {
            produkId: item.produkId,
            isDeleted: false, // Memastikan produk masih aktif
          },
        });

        if (!product) return null;

        // Menghitung pertumbuhan
        const previousPeriodSales = await prisma.detailPenjualan.groupBy({
          by: ["produkId"],
          where: {
            produkId: item.produkId,
            penjualan: {
              tanggalPenjualan: {
                gte: new Date(thirtyDaysAgo.getTime() - 30 * 24 * 60 * 60 * 1000),
                lt: thirtyDaysAgo,
              },
            },
          },
          _sum: {
            kuantitas: true,
          },
        });

        const currentSales = item._sum.kuantitas || 0;
        const previousSales = previousPeriodSales[0]?._sum.kuantitas || 0;
        const growth = previousSales === 0 ? 100 : ((currentSales - previousSales) / previousSales) * 100;

        return {
          name: product.nama,
          sold: currentSales,
          revenue: item._sum.subtotal || 0,
          growth: Math.round(growth),
        };
      })
    );

    // Filter out null values and return
    return productsWithDetails.filter((product): product is NonNullable<typeof product> => product !== null);
  } catch (error) {
    console.error("Error fetching top selling products:", error);
    return [];
  }
}

export async function getLowStockProductsDashboard() {
  try {
    // Ambil semua produk yang belum dihapus
    const products = await prisma.produk.findMany({
      where: { isDeleted: false },
      orderBy: { stok: "asc" },
    });

    // Filter produk yang stoknya berada di bawah atau sama dengan minimumStok
    const lowStockProducts = products.filter((product) => product.stok <= product.minimumStok);

    // Map hasilnya dan tentukan status:
    // - "CRITICAL" jika stok <= setengah dari minimumStok,
    // - "LOW" jika stok > setengah dari minimumStok namun <= minimumStok.
    const result = lowStockProducts.map((product) => ({
      nama: product.nama,
      stok: product.stok,
      minimumStok: product.minimumStok,
      status: product.stok <= product.minimumStok / 2 ? "CRITICAL" : "LOW",
    }));

    return result;
  } catch (error) {
    console.error("Error fetching low stock products:", error);
    // Kembalikan array kosong jika terjadi error
    return [];
  }
}

export async function getTopCustomers() {
  try {
    // Mengambil data pelanggan dengan total pembelian tertinggi
    const customers = await prisma.pelanggan.findMany({
      where: {
        NOT: {
          nama: "Guest", // Mengabaikan pelanggan Guest
        },
      },
      select: {
        pelangganId: true,
        nama: true,
        points: true,
        penjualan: {
          select: {
            total_harga: true,
          },
        },
      },
      orderBy: {
        points: "desc",
      },
      take: 5, // Mengambil 5 pelanggan teratas
    });

    // Memproses data untuk mendapatkan total pembelian
    const processedCustomers = customers.map((customer) => ({
      id: customer.pelangganId,
      nama: customer.nama,
      totalSpent: customer.penjualan.reduce((sum, sale) => sum + sale.total_harga, 0),
      points: customer.points,
    }));

    // Mengurutkan berdasarkan total pembelian
    return processedCustomers.sort((a, b) => b.totalSpent - a.totalSpent);
  } catch (error) {
    console.error("Error fetching top customers:", error);
    return [];
  }
}

export async function getCashierPerformance(startDate?: Date, endDate?: Date) {
  try {
    // Default ke 30 hari terakhir jika tanggal tidak dispesifikasi
    const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate || new Date();

    const cashierStats = await prisma.user.findMany({
      where: {
        level: "PETUGAS", // Hanya ambil user dengan level KASIR
      },
      select: {
        username: true,
        penjualan: {
          where: {
            tanggalPenjualan: {
              gte: start,
              lte: end,
            },
          },
          select: {
            total_harga: true,
          },
        },
      },
    });

    return cashierStats
      .map((cashier) => ({
        name: cashier.username,
        transactions: cashier.penjualan.length,
        sales: cashier.penjualan.reduce((sum, sale) => sum + Number(sale.total_harga), 0),
      }))
      .sort((a, b) => b.sales - a.sales);
  } catch (error) {
    console.error("Error fetching cashier performance:", error);
    return [];
  }
}

export async function getCustomerById(id: number) {
  try {
    const customer = await prisma.pelanggan.findUnique({
      where: {
        pelangganId: id,
      },
    });
    return customer; // Mengembalikan data pelanggan atau null jika tidak ditemukan
  } catch (error) {
    console.error("Error fetching customer by ID:", error);
    throw new Error("Gagal mengambil data pelanggan");
  }
}

export type DailySalesData = {
  date: string;
  sales: number;
  traffic: number;
};

export type SalesStats = {
  totalSales: number;
  totalTraffic: number;
  salesIncrease: number;
  trafficIncrease: number;
};

export async function getDailySalesData(): Promise<DailySalesData[]> {
  try {
    const dailySales = await prisma.penjualan.groupBy({
      by: ["tanggalPenjualan"],
      _sum: { total_harga: true },
      _count: { penjualanId: true },
      orderBy: { tanggalPenjualan: "asc" },
    });

    return dailySales.map((sale) => ({
      date: sale.tanggalPenjualan.toISOString().split("T")[0],
      sales: sale._sum.total_harga || 0,
      traffic: sale._count.penjualanId,
    }));
  } catch (error) {
    console.error("Error fetching daily sales:", error);
    return [];
  }
}

export async function getSalesStats(): Promise<SalesStats> {
  try {
    const currentDate = new Date();
    const currentPeriodStart = new Date(currentDate);
    currentPeriodStart.setDate(currentDate.getDate() - 7);
    const currentPeriodEnd = currentDate;

    const previousPeriodStart = new Date(currentPeriodStart);
    previousPeriodStart.setDate(previousPeriodStart.getDate() - 7);
    const previousPeriodEnd = new Date(currentPeriodStart);

    const [currentData, previousData] = await Promise.all([
      prisma.penjualan.aggregate({
        _sum: { total_harga: true },
        _count: { penjualanId: true },
        where: {
          tanggalPenjualan: { gte: currentPeriodStart, lte: currentPeriodEnd },
        },
      }),
      prisma.penjualan.aggregate({
        _sum: { total_harga: true },
        _count: { penjualanId: true },
        where: {
          tanggalPenjualan: { gte: previousPeriodStart, lte: previousPeriodEnd },
        },
      }),
    ]);

    const currentSales = currentData._sum.total_harga || 0;
    const currentTraffic = currentData._count.penjualanId;
    const previousSales = previousData._sum.total_harga || 0;
    const previousTraffic = previousData._count.penjualanId;

    const calculateIncrease = (current: number, previous: number) => {
      if (previous === 0) return current === 0 ? 0 : 100;
      return ((current - previous) / previous) * 100;
    };

    return {
      totalSales: currentSales,
      totalTraffic: currentTraffic,
      salesIncrease: calculateIncrease(currentSales, previousSales),
      trafficIncrease: calculateIncrease(currentTraffic, previousTraffic),
    };
  } catch (error) {
    console.error("Error fetching sales stats:", error);
    return {
      totalSales: 0,
      totalTraffic: 0,
      salesIncrease: 0,
      trafficIncrease: 0,
    };
  }
}

export async function getCustomerTransactions(): Promise<{
  success: boolean;
  data?: CustomerTransactionData[];
  error?: string;
}> {
  try {
    // Get current date and date 30 days ago for comparison
    const currentDate = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get previous period for growth comparison
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    // Get all sales data
    const [currentPeriodSales, previousPeriodSales] = await Promise.all([
      // Current period sales
      prisma.penjualan.findMany({
        where: {
          tanggalPenjualan: {
            gte: thirtyDaysAgo,
            lte: currentDate,
          },
        },
        include: {
          pelanggan: true,
        },
      }),
      // Previous period sales
      prisma.penjualan.findMany({
        where: {
          tanggalPenjualan: {
            gte: sixtyDaysAgo,
            lte: thirtyDaysAgo,
          },
        },
        include: {
          pelanggan: true,
        },
      }),
    ]);

    // Calculate metrics for regular customers (guests)
    const currentRegularSales = currentPeriodSales.filter((sale) => sale.guestId !== null);
    const previousRegularSales = previousPeriodSales.filter((sale) => sale.guestId !== null);

    // Calculate metrics for members (pelanggan)
    const currentMemberSales = currentPeriodSales.filter((sale) => sale.pelangganId !== null);
    const previousMemberSales = previousPeriodSales.filter((sale) => sale.pelangganId !== null);

    // Calculate total transactions
    const totalTransactions = currentPeriodSales.length;

    // Calculate percentages and growth
    const regularTransactions = currentRegularSales.length;
    const memberTransactions = currentMemberSales.length;

    const regularPercentage = (regularTransactions / totalTransactions) * 100;
    const memberPercentage = (memberTransactions / totalTransactions) * 100;

    // Calculate growth rates
    const regularGrowth = previousRegularSales.length > 0 ? ((regularTransactions - previousRegularSales.length) / previousRegularSales.length) * 100 : 0;

    const memberGrowth = previousMemberSales.length > 0 ? ((memberTransactions - previousMemberSales.length) / previousMemberSales.length) * 100 : 0;

    return {
      success: true,
      data: [
        {
          name: "Regular",
          value: Math.round(regularPercentage),
          transactions: regularTransactions,
          growth: `${regularGrowth > 0 ? "+" : ""}${regularGrowth.toFixed(1)}%`,
        },
        {
          name: "Member",
          value: Math.round(memberPercentage),
          transactions: memberTransactions,
          growth: `${memberGrowth > 0 ? "+" : ""}${memberGrowth.toFixed(1)}%`,
        },
      ],
    };
  } catch (error) {
    console.error("Error fetching customer transactions:", error);
    return {
      success: false,
      error: "Failed to fetch customer transactions",
    };
  }
}

// refund pembelian

export async function processRefund(refundData: { penjualanId: number; userId: number; refundedItems: { produkId: number; kuantitas: number }[]; totalRefund: number }) {
  try {
    return await prisma.$transaction(async (tx) => {
      console.log("Properti dalam tx:", Object.keys(tx));

      console.log("Isi tx:", tx);

      // 1. Buat record refund
      const refund = await tx.refund.create({
        data: {
          penjualanId: refundData.penjualanId,
          totalRefund: refundData.totalRefund,
          userId: refundData.userId,
          detailRefund: {
            create: refundData.refundedItems.map((item) => ({
              produkId: item.produkId,
              kuantitas: item.kuantitas,
            })),
          },
        },
      });

      // 2. Update stok produk untuk item yang direfund
      for (const item of refundData.refundedItems) {
        await tx.produk.update({
          where: { produkId: item.produkId },
          data: { stok: { increment: item.kuantitas } },
        });
      }

      return refund;
    });
  } catch (error) {
    console.error("Error processing refund:", error);
    throw new Error("Gagal memproses refund. Silakan coba lagi.");
  }
}

export async function getTransactionDetails(penjualanId: number) {
  try {
    const transaction = await prisma.penjualan.findUnique({
      where: { penjualanId },
      include: {
        detailPenjualan: {
          include: { produk: true },
        },
        user: true,
      },
    });
    return transaction;
  } catch (error) {
    console.error("Error fetching transaction details:", error);
    throw error;
  }
}

export async function processReturn(returnData: {
  penjualanId: number;
  userId: number;
  returnedItems: { produkId: number; kuantitas: number; harga: number }[];
  replacementItems: { produkId: number; kuantitas: number; harga: number }[];
  totalReturn: number;
  totalReplacement: number;
  additionalPayment: number;
}) {
  const { penjualanId, userId, returnedItems, replacementItems, totalReturn, totalReplacement, additionalPayment } = returnData;

  try {
    return await prisma.$transaction(async (tx) => {
      // 1. Buat record return (disimpan pada model Refund)
      await tx.refund.create({
        data: {
          penjualanId,
          userId,
          totalRefund: totalReturn,
          detailRefund: {
            create: returnedItems.map((item) => ({
              produkId: item.produkId,
              kuantitas: item.kuantitas,
            })),
          },
        },
      });

      // 2. Update stok untuk produk yang dikembalikan
      for (const item of returnedItems) {
        await tx.produk.update({
          where: { produkId: item.produkId },
          data: { stok: { increment: item.kuantitas } },
        });
      }

      // 3. Update stok untuk produk pengganti
      for (const item of replacementItems) {
        await tx.produk.update({
          where: { produkId: item.produkId },
          data: { stok: { decrement: item.kuantitas } },
        });
      }

      // 4. Hitung selisih antara total penggantian dan total pengembalian
      const difference = totalReplacement - totalReturn;

      // 5. Update transaksi asli dengan informasi return
      await tx.penjualan.update({
        where: { penjualanId },
        data: {
          total_harga: { increment: difference },
          uangMasuk: additionalPayment > 0 ? { increment: additionalPayment } : undefined,
        },
      });

      // 6. Jika ada pembayaran tambahan, buat transaksi baru untuk produk pengganti
      if (additionalPayment > 0 && replacementItems.length > 0) {
        await tx.penjualan.create({
          data: {
            userId,
            total_harga: additionalPayment,
            uangMasuk: additionalPayment,
            pelangganId: null, // Add default values for required fields
            guestId: null, // Add default values for required fields
            detailPenjualan: {
              create: replacementItems.map((item) => ({
                produkId: item.produkId,
                kuantitas: item.kuantitas,
                subtotal: Math.round(item.harga * item.kuantitas), // Ensure integer value
              })),
            },
          },
        });
      }

      return {
        status: "Success",
        message: "Return processed successfully",
        additionalPaymentProcessed: additionalPayment > 0,
      };
    });
  } catch (error) {
    throw new Error(`Gagal memproses return: ${error}`);
  }
}

export async function getAllProducts() {
  try {
    const products = await prisma.produk.findMany({
      where: { isDeleted: false },
      orderBy: { nama: "asc" },
    });
    return products;
  } catch (error) {
    console.error("Error fetching all products:", error);
    throw error;
  }
}

// types.ts
import { PromotionType } from "@prisma/client";

export interface CreatePromotionInput {
  title: string;
  description?: string;
  type: PromotionType;
  startDate: Date;
  endDate: Date;
  discountPercentage?: number;
  discountAmount?: number;
  minQuantity?: number;
  productIds?: number[];
  categoryIds?: number[];
}

// actions/promotions.ts

export async function createPromotion(input: CreatePromotionInput) {
  try {
    const { title, description, type, startDate, endDate, discountPercentage, discountAmount, minQuantity, productIds, categoryIds } = input;

    // Validasi input
    if (!title || !type || !startDate || !endDate) {
      throw new Error("Missing required fields");
    }

    if (!discountPercentage && !discountAmount) {
      throw new Error("Either discount percentage or amount must be provided");
    }

    // Validasi tanggal
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (end < start) {
      throw new Error("End date must be after start date");
    }

    // Buat promosi
    const promotion = await prisma.promotion.create({
      data: {
        title,
        description,
        type,
        startDate: start,
        endDate: end,
        discountPercentage,
        discountAmount,
        minQuantity,
        // Hubungkan dengan produk jika ada
        products: productIds?.length
          ? {
              connect: productIds.map((id) => ({ produkId: id })),
            }
          : undefined,
        // Hubungkan dengan kategori jika ada
        categories: categoryIds?.length
          ? {
              connect: categoryIds.map((id) => ({ kategoriId: id })),
            }
          : undefined,
      },
    });

    revalidatePath("/admin/promotions");
    return { success: true, data: promotion };
  } catch (error) {
    console.error("Error creating promotion:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to create promotion" };
  }
}


export async function cleanupExpiredPromotions() {
  try {
    const now = new Date();
    
    // Find all expired promotions
    const expiredPromotions = await prisma.promotion.findMany({
      where: {
        endDate: {
          lt: now
        }
      },
      include: {
        products: true,
        categories: true
      }
    });
    
    const results = [];
    
    // Disconnect products and categories for each expired promotion
    for (const promotion of expiredPromotions) {
      // Only disconnect if there are products/categories to disconnect
      if (promotion.products.length > 0 || promotion.categories.length > 0) {
         await prisma.promotion.update({
          where: {
            promotionId: promotion.promotionId
          },
          data: {
            products: {
              disconnect: promotion.products.map(product => ({ 
                produkId: product.produkId 
              }))
            },
            categories: {
              disconnect: promotion.categories.map(category => ({ 
                kategoriId: category.kategoriId 
              }))
            }
          }
        });
        
        results.push({
          promotionId: promotion.promotionId,
          title: promotion.title,
          disconnected: true
        });
      }
    }
    
    // Revalidate the promotions page to reflect changes
    revalidatePath('/admin/promotions');
    
    return { 
      success: true, 
      message: `Disconnected relations for ${results.length} expired promotions`,
      results
    };
  } catch (error) {
    console.error('Error cleaning up expired promotions:', error);
    return { 
      success: false, 
      message: 'Failed to disconnect relations for expired promotions',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}



export async function getPromotions() {
  try {
    const promotions = await prisma.promotion.findMany({
      include: {
        products: {
          select: {
            produkId: true,
            nama: true,
            harga: true,
            kategori: {
              select: {
                nama: true,
              },
            },
          },
        },
        categories: {
          select: {
            kategoriId: true,
            nama: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return { success: true, data: promotions };
  } catch (error) {
    console.error("Error fetching promotions:", error);
    return { success: false, error: "Failed to fetch promotions" };
  }
}

export async function updatePromotion(id: number, input: Partial<CreatePromotionInput>) {
  try {
    const promotion = await prisma.promotion.update({
      where: { promotionId: id },
      data: {
        title: input.title,
        description: input.description,
        type: input.type,
        startDate: input.startDate,
        endDate: input.endDate,
        discountPercentage: input.discountPercentage,
        discountAmount: input.discountAmount,
        minQuantity: input.minQuantity,
        // Update relasi produk
        products: input.productIds
          ? {
              set: input.productIds.map((id) => ({ produkId: id })),
            }
          : undefined,
        // Update relasi kategori
        categories: input.categoryIds
          ? {
              set: input.categoryIds.map((id) => ({ kategoriId: id })),
            }
          : undefined,
      },
    });

    revalidatePath("/admin/promotions");
    return { success: true, data: promotion };
  } catch (error) {
    console.error("Error updating promotion:", error);
    return { success: false, error: "Failed to update promotion" };
  }
}

export async function deletePromotion(id: number) {
  try {
    await prisma.promotion.delete({
      where: { promotionId: id },
    });

    revalidatePath("/admin/promotions");
    return { success: true };
  } catch (error) {
    console.error("Error deleting promotion:", error);
    return { success: false, error: "Failed to delete promotion" };
  }
}

// Fungsi helper untuk mendapatkan daftar produk
export async function getProductsForPromotions() {
  try {
    const products = await prisma.produk.findMany({
      where: {
        isDeleted: false,
      },
      select: {
        produkId: true,
        nama: true,
        harga: true,
        kategori: {
          select: {
            nama: true,
          },
        },
      },
      orderBy: {
        nama: "asc",
      },
    });

    return { success: true, data: products };
  } catch (error) {
    console.error("Error fetching products:", error);
    return { success: false, error: "Failed to fetch products" };
  }
}

// Fungsi helper untuk mendapatkan daftar kategori
export async function getCategories() {
  try {
    const categories = await prisma.kategori.findMany({
      select: {
        kategoriId: true,
        nama: true,
      },
      orderBy: {
        nama: "asc",
      },
    });

    return { success: true, data: categories };
  } catch (error) {
    console.error("Error fetching categories:", error);
    return { success: false, error: "Failed to fetch categories" };
  }
}


export async function getTopProducts() {
  try {
    // Get all sales details grouped by product with total quantity
    const productSales = await prisma.detailPenjualan.groupBy({
      by: ['produkId'],
      _sum: {
        kuantitas: true
      },
      orderBy: {
        _sum: {
          kuantitas: "desc"
        }
      },
      take: 5
    })

    // Get the product details and calculate growth
    const topProducts = await Promise.all(
      productSales.map(async (sale) => {
        const product = await prisma.produk.findUnique({
          where: { produkId: sale.produkId },
          select: { nama: true }
        })

        // Calculate sales growth by comparing with previous period
        const currentPeriodSales = await prisma.detailPenjualan.aggregate({
          where: {
            produkId: sale.produkId,
            penjualan: {
              tanggalPenjualan: {
                gte: new Date(new Date().setMonth(new Date().getMonth() - 1))
              }
            }
          },
          _sum: {
            kuantitas: true
          }
        })

        const previousPeriodSales = await prisma.detailPenjualan.aggregate({
          where: {
            produkId: sale.produkId,
            penjualan: {
              tanggalPenjualan: {
                gte: new Date(new Date().setMonth(new Date().getMonth() - 2)),
                lt: new Date(new Date().setMonth(new Date().getMonth() - 1))
              }
            }
          },
          _sum: {
            kuantitas: true
          }
        })

        const currentSales = currentPeriodSales._sum.kuantitas || 0
        const previousSales = previousPeriodSales._sum.kuantitas || 0
        
        let growthPercentage = 0
        if (previousSales > 0) {
          growthPercentage = ((currentSales - previousSales) / previousSales) * 100
        }

        return {
          name: product?.nama || 'Unknown Product',
          sales: sale._sum.kuantitas || 0,
          growth: `${growthPercentage >= 0 ? '+' : ''}${growthPercentage.toFixed(1)}%`
        }
      })
    )

    return topProducts

  } catch (error) {
    console.error('Error fetching top products:', error)
    throw new Error('Failed to fetch top products')
  }
}

export async function getCustomerTransactionsAnalytic() {
  try {
    // Get current date and date 1 month ago
    const currentDate = new Date();
    const lastMonth = new Date(currentDate);
    lastMonth.setMonth(lastMonth.getMonth() - 1);

    // Create a separate variable for the previous month start date
    const previousMonthStart = new Date(lastMonth);
    previousMonthStart.setMonth(previousMonthStart.getMonth() - 1);

    // Get guest transactions (Regular customers)
    const guestTransactions = await prisma.penjualan.count({
      where: {
        guestId: { not: null },
        tanggalPenjualan: {
          gte: lastMonth
        }
      }
    });

    // Get previous month guest transactions for growth calculation
    const previousGuestTransactions = await prisma.penjualan.count({
      where: {
        guestId: { not: null },
        tanggalPenjualan: {
          gte: previousMonthStart,
          lt: lastMonth
        }
      }
    });

    // Get member transactions (Registered customers)
    const memberTransactions = await prisma.penjualan.count({
      where: {
        pelangganId: { not: null },
        tanggalPenjualan: {
          gte: lastMonth
        }
      }
    });

    // Get previous month member transactions for growth calculation
    const previousMemberTransactions = await prisma.penjualan.count({
      where: {
        pelangganId: { not: null },
        tanggalPenjualan: {
          gte: previousMonthStart,
          lt: lastMonth
        }
      }
    });

    // Calculate total transactions
    const totalTransactions = guestTransactions + memberTransactions;

    // Calculate growth percentages
    const guestGrowth = previousGuestTransactions > 0 
      ? ((guestTransactions - previousGuestTransactions) / previousGuestTransactions) * 100 
      : 0;

    const memberGrowth = previousMemberTransactions > 0 
      ? ((memberTransactions - previousMemberTransactions) / previousMemberTransactions) * 100 
      : 0;

    // Format the response
    return [
      {
        name: "Regular",
        value: totalTransactions > 0 ? Math.round((guestTransactions / totalTransactions) * 100) : 0,
        transactions: guestTransactions,
        growth: `${guestGrowth >= 0 ? '+' : ''}${guestGrowth.toFixed(1)}%`
      },
      {
        name: "Member",
        value: totalTransactions > 0 ? Math.round((memberTransactions / totalTransactions) * 100) : 0,
        transactions: memberTransactions,
        growth: `${memberGrowth >= 0 ? '+' : ''}${memberGrowth.toFixed(1)}%`
      }
    ];

  } catch (error) {
    console.error('Error fetching customer transactions:', error);
    throw new Error('Failed to fetch customer transactions');
  }
}


export async function getLowStockProducts() {
  try {
    // Get all products where stock is below minimum stock level
    // or stock status is not NORMAL, ordered by stock level
    const lowStockProducts = await prisma.produk.findMany({
      where: {
        OR: [
          {
            stok: {
              lte: prisma.produk.fields.minimumStok
            }
          },
          {
            statusStok: {
              not: 'NORMAL'
            }
          }
        ],
        isDeleted: false
      },
      select: {
        nama: true,
        stok: true,
        minimumStok: true,
        statusStok: true
      },
      orderBy: {
        stok: 'asc'
      },
      take: 5 // Limit to 5 products with lowest stock
    })

    // Format the response to match the expected structure
    return lowStockProducts.map(product => ({
      name: product.nama,
      stock: product.stok,
      minimumStock: product.minimumStok,
      status: product.statusStok
    }))

  } catch (error) {
    console.error('Error fetching low stock products:', error)
    throw new Error('Failed to fetch low stock products')
  }
}

export async function getCategoryRevenue() {
  try {
    // Get current date and date 1 month ago for the monthly revenue calculation
    const currentDate = new Date()
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)

    // Calculate revenue by category using joins and aggregation
    const categoryRevenue = await prisma.kategori.findMany({
      select: {
        nama: true,
        produk: {
          where: {
            isDeleted: false,
            detailPenjualan: {
              some: {
                penjualan: {
                  tanggalPenjualan: {
                    gte: startOfMonth
                  }
                }
              }
            }
          },
          select: {
            detailPenjualan: {
              where: {
                penjualan: {
                  tanggalPenjualan: {
                    gte: startOfMonth
                  }
                }
              },
              select: {
                subtotal: true
              }
            }
          }
        }
      }
    })

    // Process and format the data
    const formattedRevenue = categoryRevenue
      .map(category => {
        // Calculate total revenue for the category
        const revenue = category.produk.reduce((total, product) => {
          return total + product.detailPenjualan.reduce((subtotal, detail) => {
            return subtotal + detail.subtotal
          }, 0)
        }, 0)

        return {
          category: category.nama,
          revenue: revenue
        }
      })
      // Filter out categories with no revenue
      .filter(category => category.revenue > 0)
      // Sort by revenue in descending order
      .sort((a, b) => b.revenue - a.revenue)

    return formattedRevenue

  } catch (error) {
    console.error('Error calculating category revenue:', error)
    throw new Error('Failed to calculate category revenue')
  }
}


export async function getRecentTransactions() {
  const transactions = await prisma.penjualan.findMany({
    orderBy: {
      tanggalPenjualan: 'desc'
    },
    take: 10, // Get last 10 transactions
    select: {
      penjualanId: true,
      tanggalPenjualan: true,
      total_harga: true,
      uangMasuk: true,
      kembalian: true
    }
  });
  
  return transactions;
}

interface PromotionAnalytics {
  name: string;
  revenue: number;
  transactions: number;
}

export async function getPromotionAnalytics(): Promise<PromotionAnalytics[]> {
  try {
    // Get all promotions with their related sales details
    const promotionsWithSales = await prisma.promotion.findMany({
      select: {
        title: true,
        products: {
          select: {
            detailPenjualan: {
              select: {
                subtotal: true,
                penjualan: {
                  select: {
                    penjualanId: true,
                    tanggalPenjualan: true
                  }
                }
              }
            }
          }
        }
      }
    });

    // Process and aggregate the data
    const promotionAnalytics: PromotionAnalytics[] = await Promise.all(
      promotionsWithSales.map(async (promotion) => {
        // Flatten all sales details for this promotion
        const allSales = promotion.products.flatMap(product => 
          product.detailPenjualan
        );

        // Calculate total revenue
        const revenue = allSales.reduce((sum, sale) => 
          sum + sale.subtotal, 0
        );

        // Count unique transactions
        const uniqueTransactions = new Set(
          allSales.map(sale => sale.penjualan.penjualanId)
        ).size;

        return {
          name: promotion.title,
          revenue: revenue,
          transactions: uniqueTransactions
        };
      })
    );

    // Sort by revenue in descending order
    return promotionAnalytics.sort((a, b) => b.revenue - a.revenue);

  } catch (error) {
    console.error("Error fetching promotion analytics:", error);
    throw new Error("Failed to fetch promotion analytics");
  }
}
