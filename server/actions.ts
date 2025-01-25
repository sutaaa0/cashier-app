"use server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import * as jose from "jose";
import { Pelanggan, Produk } from "@prisma/client";
import { CreateOrderDetail, Product } from "@/types/types";
import { revalidatePath } from "next/cache";
import { v2 as cloudinary } from "cloudinary";

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
export async function getProducts(category: string) {
  if (category === "All Menu") {
    const products = await prisma.produk.findMany({
      orderBy: { nama: "asc" },
      where: {
        isDeleted: false,
      },
    });

    return products;
  } else if (category === "Bread") {
    const products = await prisma.produk.findMany({
      orderBy: { nama: "asc" },
      where: {
        isDeleted: false,
        kategori: "Bread",
      },
    });

    return products;
  } else if (category === "Cakes") {
    const products = await prisma.produk.findMany({
      orderBy: { nama: "asc" },
      where: {
        isDeleted: false,
        kategori: "Cakes",
      },
    });
    return products;
  } else if (category === "Donuts") {
    const products = await prisma.produk.findMany({
      orderBy: { nama: "asc" },
      where: {
        isDeleted: false,
        kategori: "Donuts",
      },
    });
    return products;
  } else if (category === "Pastries") {
    const products = await prisma.produk.findMany({
      orderBy: { nama: "asc" },
      where: {
        isDeleted: false,
        kategori: "Pastries",
      },
    });
    return products;
  } else if (category === "Sandwich") {
    const products = await prisma.produk.findMany({
      orderBy: { nama: "asc" },
      where: {
        isDeleted: false,
        kategori: "Sandwich",
      },
    });
    return products;
  }
}

export async function getAdminProduct() {
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

// Server action to add a new product
interface ActionResponse {
  status: "Success" | "Error";
  message: string;
  data?: any;
}

export async function addProduct(formData: {
  name: string;
  price: number;
  stock: number;
  category: string;
  imageUrl: string; // Sekarang menerima URL gambar langsung
}): Promise<ActionResponse> {
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

export async function updateProduct(formData: { id: number; name: string; price: number; stock: number; category: string; imageUrl: string }): Promise<ActionResponse> {
  try {
    const product = await prisma.produk.update({
      where: {
        produkId: formData.id,
      },
      data: {
        nama: formData.name,
        harga: formData.price,
        stok: formData.stock,
        kategori: formData.category,
        image: formData.imageUrl,
      },
    });

    revalidatePath("/dashboard-admin");

    return {
      status: "Success",
      message: "Produk berhasil diupdate",
      data: product,
    };
  } catch (error) {
    console.error("Error mengupdate produk:", error);
    return {
      status: "Error",
      message: error instanceof Error ? error.message : "Gagal mengupdate produk",
    };
  }
}

interface ActionResponse {
  status: "Success" | "Error";
  message: string;
  data?: any;
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

    const updateData: any = {
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
}

interface ApiResponse<T> {
  status: "Success" | "Error";
  data?: T;
  message?: string;
}

export async function getStockItems(): Promise<ApiResponse<StockData[]>> {
  try {
    const products = await prisma.produk.findMany({
      where: {
        isDeleted: false,
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    const stockItems: StockData[] = products.map((product) => ({
      id: product.produkId,
      name: product.nama,
      currentStock: product.stok,
      minStock: 10, // You might want to add this as a column in your Produk model
      category: product.kategori,
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
    const updatedProduct = await prisma.produk.update({
      where: {
        produkId: id,
        isDeleted: false,
      },
      data: {
        stok: newStock,
        updatedAt: new Date(),
      },
    });

    const updatedItem: StockData = {
      id: updatedProduct.produkId,
      name: updatedProduct.nama,
      currentStock: updatedProduct.stok,
      minStock: 10, // Consistent with getStockItems
      category: updatedProduct.kategori,
      lastUpdated: updatedProduct.updatedAt.toISOString(),
    };

    revalidatePath("/stock-management"); // Adjust the path as needed

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

export async function addStockItem(item: Omit<StockData, "id" | "lastUpdated">): Promise<ApiResponse<StockData>> {
  try {
    const newProduct = await prisma.produk.create({
      data: {
        nama: item.name,
        stok: item.currentStock,
        kategori: item.category,
        harga: 0, // You'll need to add price to your form or set a default
        image: "", // You'll need to add image handling or set a default
        isDeleted: false,
      },
    });

    const newItem: StockData = {
      id: newProduct.produkId,
      name: newProduct.nama,
      currentStock: newProduct.stok,
      minStock: item.minStock,
      category: newProduct.kategori,
      lastUpdated: newProduct.updatedAt.toISOString(),
    };

    revalidatePath("/stock-management"); // Adjust the path as needed

    return {
      status: "Success",
      data: newItem,
    };
  } catch (error) {
    console.error("Failed to add stock item:", error);
    return {
      status: "Error",
      message: "Failed to add stock item",
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
  data: any;
}

export async function generateReport(type: string): Promise<ReportData> {
  const currentDate = new Date();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);

  let reportData: any = {};

  switch (type) {
    case "sales":
      const salesData = await prisma.penjualan.findMany({
        where: {
          tanggalPenjualan: {
            gte: firstDayOfMonth,
          },
        },
        include: {
          detailPenjualan: {
            include: {
              produk: true,
            },
          },
        },
      });

      const totalSales = salesData.reduce((sum, sale) => sum + sale.total_harga, 0);
      
      
      reportData = {
        name: "Monthly Sales Report",
        period: currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
        type: "sales",
        summary: `Total Sales: ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(totalSales)} | Orders: ${salesData.length}`,
        data: salesData,
      };
      break;

    case "inventory":
      const products = await prisma.produk.findMany({
        where: {
          isDeleted: false,
        },
      });

      const lowStock = products.filter((p) => p.stok < 10).length;
      reportData = {
        name: "Inventory Status",
        period: `Q${Math.floor(currentDate.getMonth() / 3) + 1} ${currentDate.getFullYear()}`,
        type: "inventory",
        summary: `Items: ${products.length} | Low Stock: ${lowStock}`,
        data: products,
      };
      break;

    case "customers":
      const customers = await prisma.pelanggan.findMany({
        include: {
          penjualan: true,
        },
      });

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

  return {
    ...reportData,
    id: Date.now(),
    generatedDate: new Date().toISOString(),
  };
}
