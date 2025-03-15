"use server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import * as jose from "jose";
import { DetailPenjualan, Pelanggan, Produk, Prisma } from "@prisma/client";
import { CreateOrderDetail, CustomerTransactionData } from "@/types/types";
import { revalidatePath } from "next/cache";
import { v2 as cloudinary } from "cloudinary";
import { startOfWeek, subWeeks, format, addDays, endOfWeek, endOfMonth, endOfYear, startOfYear, startOfMonth, subDays } from "date-fns";
import { fromZonedTime, toZonedTime, formatInTimeZone } from "date-fns-tz";

export type Penjualan = {
  PenjualanId?: number;
  pelangganId: number | null;
  guestId: number | null;
  userId: number;
  total_harga: number;
  uangMasuk: number | null;
  kembalian: number | null;
  keuntungan: number | null;
  total_modal: number | null;
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
      return { status: "Failed", message: "User not found", code: 404 };
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return { status: "Failed", message: "Incorrect password ", code: 401 };
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
    // Menghapus cookie token dengan mengatur nilai kosong dan maxAge 0
    (await cookies()).set({
      name: "token",
      value: "",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0, // Set maxAge 0 untuk segera menghapus cookie
    });

    return {
      status: "Success",
      message: "Berhasil logout",
      code: 200,
    };
  } catch (error) {
    return {
      status: "Failed",
      message: `${error}`,
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
        promotionProducts: {
          include: {
            promotion: true,
          },
        },
      },
    });
    return products;
  } else {
    const products = await prisma.produk.findMany({
      orderBy: { nama: "asc" },
      where: {
        isDeleted: false,
        kategori: {
          nama: category,
        },
      },
      include: {
        kategori: true,
        promotionProducts: {
          include: {
            promotion: true,
          },
        },
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

export async function createOrder(orderData: Penjualan & { 
  redeemedPoints?: number;
  promotionDiscounts?: { [produkId: number]: number };
  customerName?: string;
  totalBeforePromotionDiscount?: number;
  totalAfterPromotionDiscount?: number;
}): Promise<
  CategoryCount | 
  (Penjualan & {
    detailPenjualan: DetailPenjualan[];
    pointsAwarded: number;
    pointsRedeemed: number;
    originalTotal: number;
    finalTotal: number;
  }) | 
  null
> {
  try {
    console.log("data order :", orderData)
    return await prisma.$transaction(async (tx) => {
      // Jika pembeli bukan member (guest), pastikan guestId ada
      if (!orderData.pelangganId && !orderData.guestId) {
        const guest = await tx.guest.create({ data: {} });
        orderData.guestId = guest.guestId;
      }
      
      // Berikan poin kepada member (berdasarkan total setelah diskon)
      if (orderData.pelangganId) {
        const totalAfterAllDiscounts = orderData.total_harga;
        const poinAfterDiscount = Math.floor(totalAfterAllDiscounts / 200);
        
        await tx.pelanggan.update({
          where: { pelangganId: orderData.pelangganId },
          data: { points: { increment: poinAfterDiscount } },
        });
      }

      // Siapkan detail penjualan dengan informasi promosi
      const detailPenjualanWithPromo = await Promise.all(
        orderData.detailPenjualan.map(async (detail) => {
          // Dapatkan informasi produk beserta promosinya
          const product = await tx.produk.findUnique({
            where: { produkId: detail.produkId },
            include: {
              promotionProducts: {
                include: {
                  promotion: true
                },
                where: {
                  promotion: {
                    startDate: { lte: new Date() },
                    endDate: { gte: new Date() }
                  }
                }
              }
            }
          });

          // Dapatkan diskon promosi untuk produk ini (jika ada)
          const discountAmount = orderData.promotionDiscounts?.[detail.produkId] || 0;
          
          // Cari promosi yang aktif (untuk menyimpan informasi)
          let promotionId = null;
          let promotionTitle = null;
          let discountPercentage = null;
          // let discountAmountValue = null;
          
          if (product?.promotionProducts && product.promotionProducts.length > 0 && discountAmount > 0) {
            // Ambil promosi aktif pertama (yang memberikan diskon)
            const activePromotion = product.promotionProducts[0].promotion;
            promotionId = activePromotion.promotionId;
            promotionTitle = activePromotion.title;
            discountPercentage = activePromotion.discountPercentage;
            // discountAmountValue = activePromotion.discountAmount;
          }

          return {
            produkId: detail.produkId,
            kuantitas: detail.kuantitas,
            subtotal: Math.round(detail.subtotal),
            // Simpan informasi promosi
            promotionId,
            promotionTitle,
            discountPercentage,
            discountAmount: discountAmount > 0 ? discountAmount : null
          };
        })
      );
      
      // Tambah informasi poin yang ditukarkan (akan disimpan di tabel Penjualan)
      const redeemedPoints = orderData.redeemedPoints || 0;
      
      // Siapkan payload pembuatan penjualan
      const penjualanData = {
        tanggalPenjualan: new Date(),
        total_harga: orderData.total_harga,
        // Add total_modal and keuntungan fields
        total_modal: orderData.total_modal,
        keuntungan: orderData.keuntungan,
        userId: orderData.userId,
        diskonPoin: redeemedPoints,
        uangMasuk: orderData.uangMasuk || 0, // Simpan uang masuk
        kembalian: orderData.kembalian || 0, // Simpan kembalian
        pelangganId: orderData.pelangganId !== null ? orderData.pelangganId : undefined,
        guestId: orderData.guestId !== null ? orderData.guestId : undefined,
        // Gunakan detail penjualan dengan informasi promosi
        detailPenjualan: {
          create: detailPenjualanWithPromo,
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

      // Return informasi penjualan dengan tambahan detail poin dan promosi
      return {
        ...penjualan,
        PenjualanId: penjualan.penjualanId,
        pointsAwarded: Math.floor(orderData.total_harga / 200), // Poin yang diberikan
        pointsRedeemed: redeemedPoints, // Poin yang ditukarkan
        originalTotal: orderData.totalBeforePromotionDiscount || orderData.total_harga, // Total sebelum diskon
        finalTotal: orderData.total_harga, // Total setelah semua diskon
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


export async function createCustomer(customerData: { 
  nama: string; 
  alamat: string; 
  nomorTelepon: string 
}) {
  try {
    // Validate that all required fields are present
    if (!customerData.nama || !customerData.alamat || !customerData.nomorTelepon) {
      return { 
        status: "Error", 
        message: "Semua field harus diisi" 
      };
    }

    // Validate phone number format (Indonesian format)
    const phoneRegex = /^(\+62|0)[0-9]{9,12}$/;
    if (!phoneRegex.test(customerData.nomorTelepon)) {
      return { 
        status: "Error", 
        message: "Format nomor telepon tidak valid" 
      };
    }

    // Check if phone number already exists
    const existingCustomer = await prisma.pelanggan.findFirst({
      where: {
        nomorTelepon: customerData.nomorTelepon
      }
    });

    if (existingCustomer) {
      return { 
        status: "Error", 
        message: "duplicate: Nomor telepon sudah terdaftar" 
      };
    }

    // Create customer if validation passes
    const customer = await prisma.pelanggan.create({
      data: customerData,
    });

    return { status: "Success", data: customer };
  } catch (error) {
    console.error("Error creating customer:", error);
    
    // Check for Prisma unique constraint error
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return { 
          status: "Error", 
          message: "duplicate: Nomor telepon sudah terdaftar" 
        };
      }
    }
    
    return { 
      status: "Error", 
      message: "Failed to create customer" 
    };
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

export async function restoreRedeemedPoints(
  pelangganId: number,
  pointsToRestore: number
) {
  const member = await prisma.pelanggan.findUnique({
    where: { pelangganId },
  });

  if (!member) {
    throw new Error("Pelanggan tidak ditemukan");
  }

  await prisma.pelanggan.update({
    where: { pelangganId },
    data: { points: { increment: pointsToRestore } },
  });

  return pointsToRestore;
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


export async function addProduct(formData: {
  name: string;
  harga: number;
  hargaModal: number;
  stock: number;
  minimumStok: number;
  categoryId: number;
  imageUrl: string;
}): Promise<{ status: string; message: string; data?: Produk | null }> {
  try {
    const { name, harga, hargaModal, stock, minimumStok, categoryId, imageUrl } = formData;
    
    if (!name || !harga || !hargaModal || !stock || !minimumStok || !categoryId || !imageUrl) {
      return {
        status: "Error",
        message: "Semua data produk harus diisi",
      };
    }
    
    if (harga <= 0 || hargaModal < 0 || stock < 0 || minimumStok < 0) {
      return {
        status: "Error",
        message: "Harga jual, harga modal, stok, dan minimum stok harus bernilai positif",
      };
    }
    
    let statusStok: "CRITICAL" | "LOW" | "NORMAL";
    if (stock <= minimumStok * 0.5) {
      statusStok = "CRITICAL";
    } else if (stock > minimumStok * 0.5 && stock <= minimumStok) {
      statusStok = "LOW";
    } else {
      statusStok = "NORMAL";
    }
    
    const product = await prisma.produk.create({
      data: {
        nama: name,
        harga: harga,
        hargaModal: hargaModal,
        stok: stock,
        kategoriId: categoryId,
        image: imageUrl,
        minimumStok: minimumStok,
        statusStok: statusStok,
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

export async function fetchCategories(): Promise<{ status: string; data?: Category[]; message?: string }> {
  try {
    const categories = await prisma.kategori.findMany({
      orderBy: { nama: "asc" },
      where: {
        isDeleted: false,
      }
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

interface DeleteCategoryResponse {
  status: "Success" | "Error";
  message: string;
  data?: {
    nama: string;
    kategoriId: number;
    icon: string;

  }
}

export async function deleteCategory(kategoriId: number): Promise<DeleteCategoryResponse> {
  // Cari kategori beserta produk-produk yang terkait
  const category = await prisma.kategori.findUnique({
    where: { kategoriId },
    include: { produk: true },
  });

  if (!category) {
    return { status: "Error", message: "Kategori tidak ditemukan" };
  }

  // Cek apakah ada produk yang masih aktif (isDeleted false)
  const activeProducts = category.produk.filter((produk) => produk.isDeleted === false);
  if (activeProducts.length > 0) {
    return {
      status: "Error",
      message: "Tidak dapat menghapus kategori yang memiliki produk aktif. Silahkan reassign atau hapus produk terkait terlebih dahulu.",
    };
  }

  // Lakukan soft delete pada kategori dengan mengubah flag isDeleted ke true
  const deletedCategory = await prisma.kategori.update({
    where: { kategoriId },
    data: { isDeleted: true },
  });

  return { status: "Success", message: "Kategori berhasil dihapus (soft delete)", data: deletedCategory };
}


export async function updateProduct(formData: { 
  id: number; 
  name: string; 
  price: number; 
  costPrice: number; // Added costPrice (hargaModal)
  stock: number; 
  minimumStok: number; 
  category: string; 
  imageUrl: string 
}): Promise<{ status: string; message: string; data?: Produk }> {
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
        hargaModal: formData.costPrice, // Added hargaModal field
        stok: formData.stock,
        kategori: { connect: { nama: formData.category } },
        image: formData.imageUrl,
        minimumStok: formData.minimumStok,
        statusStok: statusStok,
      },
    });

    // Use the proper revalidatePath with options
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

export async function getUsers(searchTerm?: string) {
  try {
    const users = await prisma.user.findMany({
      where: searchTerm ? {
        OR: [
          { username: { contains: searchTerm, mode: 'insensitive' } },
          { level: { contains: searchTerm, mode: 'insensitive' } }
        ]
      } : {},
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


export async function updatePelanggan(data: Pelanggan) {
  try {
    // Only check for duplicate phone number if one is provided
    if (data.nomorTelepon) {
      const existingPhoneNumber = await prisma.pelanggan.findUnique({
        where: {
          nomorTelepon: data.nomorTelepon
        }
      });
      
      // Check if the found phone number belongs to a different customer
      if (existingPhoneNumber && existingPhoneNumber.pelangganId !== data.pelangganId) {
        return {
          status: "Error",
          message: "duplicate: Nomor telepon sudah terdaftar"
        };
      }
    }
    
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
            produk: true
          }
        },
        // Include refund information
        returns: {
          include: {
            detailRefund: {
              include: {
                produk: true
              }
            }
          }
        }
      },
      orderBy: {
        tanggalPenjualan: "desc"
      }
    });
    
    // Transform transactions to use the stored promotion information
    const transformedTransactions = transactions.map(transaction => ({
      ...transaction,
      detailPenjualan: transaction.detailPenjualan.map(detail => ({
        ...detail,
        // Use the stored promotion information
        promotion: detail.promotionTitle ? {
          title: detail.promotionTitle,
          discountPercentage: detail.discountPercentage,
          discountAmount: detail.discountAmount
        } : undefined
      }))
    }));
    
    return { status: "Success", data: transformedTransactions };
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
  image?:string;
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
      image: product.image,
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

// New interface for profit reports
export interface ProfitReportData {
  id: number;
  name: string;
  period: string;
  periodType: "weekly" | "monthly" | "yearly";
  generatedDate: string;
  totalAmount: number;
  totalProfit: number;
  profitMargin: number;
  data: ProfitPeriodData[];
}

interface ProfitPeriodData {
  periodDate: string;
  periodLabel: string;
  totalSales: number;
  totalModal: number;
  profit: number;
  profitMargin: number;
  totalOrders: number;
}

// Existing generateReport function
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
      const products = await prisma.produk.findMany({ where: { isDeleted: false }, include: { kategori: true }  });
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

// New function for generating profit reports
export async function generateProfitReport(periodType: "weekly" | "monthly" | "yearly"): Promise<ProfitReportData> {
  const currentDate = new Date();
  const endDate: Date = new Date();
  let reportName: string;
  let periodLabel: string;
  const periodSegments: ProfitPeriodData[] = [];

  // Find the first transaction date
  const firstTransaction = await prisma.penjualan.findFirst({
    orderBy: {
      tanggalPenjualan: 'asc'
    }
  });

  // If no transactions exist, use current date minus one period as fallback
  const firstTransactionDate = firstTransaction 
    ? new Date(firstTransaction.tanggalPenjualan) 
    : new Date(currentDate.setMonth(currentDate.getMonth() - 1));

  // Configure date ranges and formats based on period type
  switch (periodType) {
    case "weekly": {
      reportName = "Weekly Profit Report";
      
      // Calculate number of weeks between first transaction and now
      const startDate = startOfWeek(firstTransactionDate);
      const endDateWeek = endOfWeek(endDate);
      
      // Calculate the difference in weeks
      const diffTime = Math.abs(endDateWeek.getTime() - startDate.getTime());
      const diffWeeks = Math.ceil(diffTime / (7 * 24 * 60 * 60 * 1000)) + 1;
      
      periodLabel = `${format(startDate, "dd MMM yyyy")} - ${format(endDate, "dd MMM yyyy")}`;
      
      // Create segments for each week (limit to max 52 weeks/1 year to prevent too many segments)
      const weeksToShow = Math.min(diffWeeks, 52);
      
      for (let i = 0; i < weeksToShow; i++) {
        const weekEnd = new Date(endDateWeek);
        weekEnd.setDate(weekEnd.getDate() - (7 * i));
        const weekStart = startOfWeek(weekEnd);
        
        // Don't go earlier than the first transaction
        if (weekStart < startDate) {
          break;
        }
        
        const weekData = await getProfitDataForRange(
          weekStart,
          i === 0 ? endDate : endOfWeek(weekEnd)
        );
        
        // Skip weeks with no transactions
        if (weekData.totalOrders === 0) {
          continue;
        }
        
        const weekLabel = `Week ${format(weekStart, "w")} (${format(weekStart, "dd MMM")}-${format(endOfWeek(weekEnd), "dd MMM")})`;
        periodSegments.unshift({
          ...weekData,
          periodDate: weekStart.toISOString(),
          periodLabel: weekLabel
        });
      }
      break;
    }
    
    case "monthly": {
      reportName = "Monthly Profit Report";
      
      // Use the start of the month for the first transaction
      const startDate = startOfMonth(firstTransactionDate);
      
      // Calculate number of months between first transaction and now
      const monthDiff = 
        (endDate.getFullYear() - startDate.getFullYear()) * 12 + 
        (endDate.getMonth() - startDate.getMonth()) + 1;
      
      periodLabel = `${format(startDate, "MMM yyyy")} - ${format(endDate, "MMM yyyy")}`;
      
      // Create segments for each month (limit to max 36 months/3 years to prevent too many segments)
      const monthsToShow = Math.min(monthDiff, 36);
      
      for (let i = 0; i < monthsToShow; i++) {
        const monthDate = new Date(endDate);
        monthDate.setMonth(monthDate.getMonth() - i);
        
        const monthStart = startOfMonth(monthDate);
        
        // Don't go earlier than the first transaction month
        if (monthStart < startDate) {
          break;
        }
        
        const monthEnd = i === 0 ? endDate : endOfMonth(monthDate);
        
        const monthData = await getProfitDataForRange(monthStart, monthEnd);
        
        // Skip months with no transactions
        if (monthData.totalOrders === 0) {
          continue;
        }
        
        periodSegments.unshift({
          ...monthData,
          periodDate: monthStart.toISOString(),
          periodLabel: format(monthStart, "MMMM yyyy")
        });
      }
      break;
    }
    
    case "yearly": {
      reportName = "Annual Profit Report";
      
      // Use the start of the year for the first transaction
      const startDate = startOfYear(firstTransactionDate);
      
      // Calculate number of years between first transaction and now
      const yearDiff = endDate.getFullYear() - startDate.getFullYear() + 1;
      
      periodLabel = `${format(startDate, "yyyy")} - ${format(endDate, "yyyy")}`;
      
      // Create segments for each year
      for (let i = 0; i < yearDiff; i++) {
        const yearDate = new Date(endDate);
        yearDate.setFullYear(yearDate.getFullYear() - i);
        
        const yearStart = startOfYear(yearDate);
        
        // Don't go earlier than the first transaction year
        if (yearStart < startDate) {
          break;
        }
        
        const yearEnd = i === 0 ? endDate : endOfYear(yearDate);
        
        const yearData = await getProfitDataForRange(yearStart, yearEnd);
        
        // Skip years with no transactions
        if (yearData.totalOrders === 0) {
          continue;
        }
        
        periodSegments.unshift({
          ...yearData,
          periodDate: yearStart.toISOString(),
          periodLabel: format(yearStart, "yyyy")
        });
      }
      break;
    }
  }

  // Calculate overall totals
  const totalAmount = periodSegments.reduce((sum, segment) => sum + segment.totalSales, 0);
  const totalProfit = periodSegments.reduce((sum, segment) => sum + segment.profit, 0);
  const profitMargin = totalAmount > 0 ? totalProfit / totalAmount : 0;

  return {
    id: Date.now(),
    name: reportName,
    period: periodLabel,
    periodType,
    generatedDate: new Date().toISOString(),
    totalAmount,
    totalProfit,
    profitMargin,
    data: periodSegments,
  };
}

// Helper function to get profit data for a date range
async function getProfitDataForRange(startDate: Date, endDate: Date): Promise<Omit<ProfitPeriodData, "periodDate" | "periodLabel">> {
  const sales = await prisma.penjualan.findMany({
    where: {
      tanggalPenjualan: {
        gte: startDate,
        lte: endDate
      }
    }
  });

  const totalSales = sales.reduce((sum, sale) => sum + sale.total_harga, 0);
  const totalModal = sales.reduce((sum, sale) => sum + (sale.total_modal || 0), 0);
  const profit = totalSales - totalModal;
  const profitMargin = totalSales > 0 ? profit / totalSales : 0;

  return {
    totalSales,
    totalModal,
    profit,
    profitMargin,
    totalOrders: sales.length
  };
}

// Add this type export
export type { ProfitPeriodData };

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
        where: {
          isDeleted: false,
        }
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
                gte: new Date(thirtyDaysAgo.getTime() - 30 * 24 * 60 * 60 * 1000), //>= 30 hari sebelum periode saat ini
                lt: thirtyDaysAgo, // < hari pertama periode saat ini
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

export type TimeRange = "daily" | "weekly" | "monthly" | "yearly";

export type ProfitData = {
  date: string;
  sales: number;
  profit: number;
  transactions: number;
};

export type ProfitStats = {
  totalSales: number;
  totalProfit: number;
  totalTransactions: number;
  salesIncrease: number;
  profitIncrease: number;
  transactionsIncrease: number;
};

// Helper function to create date range based on time range
// Helper function untuk mendapatkan tanggal dalam zona waktu WIB (+7)
function getWIBDate(date: Date): Date {
  // Salin objek Date untuk menghindari modifikasi objek asli
  const wibDate = new Date(date);
  
  // Mendapatkan offset timezone browser lokal dalam menit
  const localTimezoneOffset = date.getTimezoneOffset();
  
  // WIB adalah UTC+7, jadi offsetnya adalah -420 menit (-7 jam)
  const wibOffset = -420;
  
  // Menghitung selisih dalam menit antara timezone lokal dan WIB
  const offsetDiff = localTimezoneOffset - wibOffset;
  
  // Menerapkan selisih waktu ke tanggal
  wibDate.setMinutes(wibDate.getMinutes() + offsetDiff);
  
  return wibDate;
}

// Helper function to create date range based on time range
function getDateRanges(timeRange: TimeRange) {
  // Gunakan tanggal saat ini dalam zona waktu WIB
  const currentDate = new Date();
  const currentDateWIB = getWIBDate(currentDate);
  
  let currentPeriodStart: Date;
  let previousPeriodStart: Date;
  
  switch (timeRange) {
    case "daily":
      // Current: Last 7 days, Previous: 7 days before that
      currentPeriodStart = new Date(currentDateWIB);
      currentPeriodStart.setDate(currentDateWIB.getDate() - 7);
      previousPeriodStart = new Date(currentPeriodStart);
      previousPeriodStart.setDate(previousPeriodStart.getDate() - 7);
      break;
    
    case "weekly":
      // Current: Last 4 weeks, Previous: 4 weeks before that
      currentPeriodStart = new Date(currentDateWIB);
      currentPeriodStart.setDate(currentDateWIB.getDate() - 28);
      previousPeriodStart = new Date(currentPeriodStart);
      previousPeriodStart.setDate(previousPeriodStart.getDate() - 28);
      break;
    
    case "monthly":
      // Current: Last 12 months, Previous: 12 months before that
      currentPeriodStart = new Date(currentDateWIB);
      currentPeriodStart.setMonth(currentDateWIB.getMonth() - 12);
      previousPeriodStart = new Date(currentPeriodStart);
      previousPeriodStart.setMonth(previousPeriodStart.getMonth() - 12);
      break;
    
    case "yearly":
      // Current: Last 5 years, Previous: 5 years before that
      currentPeriodStart = new Date(currentDateWIB);
      currentPeriodStart.setFullYear(currentDateWIB.getFullYear() - 5);
      previousPeriodStart = new Date(currentPeriodStart);
      previousPeriodStart.setFullYear(previousPeriodStart.getFullYear() - 5);
      break;
  }
  
  // Set waktu ke awal hari dalam UTC untuk konsistensi dengan format database
  currentPeriodStart.setHours(0, 0, 0, 0);
  previousPeriodStart.setHours(0, 0, 0, 0);
  
  const currentPeriodEnd = new Date(currentDateWIB);
  currentPeriodEnd.setHours(23, 59, 59, 999); // Set ke akhir hari saat ini
  
  const previousPeriodEnd = new Date(currentPeriodStart);
  previousPeriodEnd.setHours(0, 0, 0, 0);
  previousPeriodEnd.setMilliseconds(-1); // 1 milidetik sebelum currentPeriodStart
  
  return {
    currentPeriodStart,
    currentPeriodEnd,
    previousPeriodStart,
    previousPeriodEnd
  };
}

// Format date for groupBy based on time range with WIB timezone
function getDateFormat(date: Date, timeRange: TimeRange): string {
  // Konversi tanggal database (UTC) ke WIB
  const dateWIB = getWIBDate(date);
  
  switch (timeRange) {
    case "daily":
      return `${dateWIB.getFullYear()}-${String(dateWIB.getMonth() + 1).padStart(2, '0')}-${String(dateWIB.getDate()).padStart(2, '0')}`; // YYYY-MM-DD
    
    case "weekly":
      const firstDayOfWeek = new Date(dateWIB);
      // getDay() mengembalikan 0 untuk Minggu, 1 untuk Senin, dsb.
      firstDayOfWeek.setDate(dateWIB.getDate() - dateWIB.getDay());
      return `${firstDayOfWeek.getFullYear()}-${String(firstDayOfWeek.getMonth() + 1).padStart(2, '0')}-${String(firstDayOfWeek.getDate()).padStart(2, '0')}`;
    
    case "monthly":
      return `${dateWIB.getFullYear()}-${String(dateWIB.getMonth() + 1).padStart(2, '0')}`; // YYYY-MM
    
    case "yearly":
      return dateWIB.getFullYear().toString(); // YYYY
    
    default:
      return `${dateWIB.getFullYear()}-${String(dateWIB.getMonth() + 1).padStart(2, '0')}-${String(dateWIB.getDate()).padStart(2, '0')}`;
  }
}

export async function getProfitData(timeRange: TimeRange): Promise<ProfitData[]> {
  try {
    const { currentPeriodStart, currentPeriodEnd } = getDateRanges(timeRange);
    
    console.log(`Fetching data from ${currentPeriodStart.toISOString()} to ${currentPeriodEnd.toISOString()}`);
    
    // Get sales from database
    const salesData = await prisma.penjualan.findMany({
      where: {
        tanggalPenjualan: {
          gte: currentPeriodStart,
          lte: currentPeriodEnd
        }
      },
      select: {
        tanggalPenjualan: true,
        total_harga: true,
        keuntungan: true,
        penjualanId: true
      },
      orderBy: {
        tanggalPenjualan: 'asc'
      }
    });
    
    console.log(`Found ${salesData.length} transactions`);
    
    // Group by time range
    const groupedData = new Map<string, { sales: number; profit: number; transactions: number }>();
    
    // Process the data
    for (const sale of salesData) {
      const dateKey = getDateFormat(sale.tanggalPenjualan, timeRange);
      
      if (!groupedData.has(dateKey)) {
        groupedData.set(dateKey, { sales: 0, profit: 0, transactions: 0 });
      }
      
      const entry = groupedData.get(dateKey)!;
      entry.sales += sale.total_harga;
      entry.profit += sale.keuntungan || 0; // Use 0 if keuntungan is null
      entry.transactions += 1;
    }
    
    // Convert the map to array
    const result: ProfitData[] = [...groupedData.entries()].map(([date, data]) => ({
      date,
      sales: data.sales,
      profit: data.profit,
      transactions: data.transactions
    }));
    
    // Sort by date to ensure correct order
    result.sort((a, b) => a.date.localeCompare(b.date));
    
    return result;
  } catch (error) {
    console.error(`Error fetching ${timeRange} profit data:`, error);
    return [];
  }
}

export async function getProfitStats(timeRange: TimeRange): Promise<ProfitStats> {
  try {
    const {
      currentPeriodStart,
      currentPeriodEnd,
      previousPeriodStart,
      previousPeriodEnd
    } = getDateRanges(timeRange);
    
    // Get current period data
    const currentData = await prisma.penjualan.aggregate({
      _sum: {
        total_harga: true,
        keuntungan: true
      },
      _count: {
        penjualanId: true
      },
      where: {
        tanggalPenjualan: {
          gte: currentPeriodStart,
          lte: currentPeriodEnd
        }
      }
    });
    
    // Get previous period data
    const previousData = await prisma.penjualan.aggregate({
      _sum: {
        total_harga: true,
        keuntungan: true
      },
      _count: {
        penjualanId: true
      },
      where: {
        tanggalPenjualan: {
          gte: previousPeriodStart,
          lte: previousPeriodEnd
        }
      }
    });
    
    // Extract values
    const currentSales = currentData._sum.total_harga || 0;
    const currentProfit = currentData._sum.keuntungan || 0;
    const currentTransactions = currentData._count.penjualanId;
    
    const previousSales = previousData._sum.total_harga || 0;
    const previousProfit = previousData._sum.keuntungan || 0;
    const previousTransactions = previousData._count.penjualanId;
    
    // Calculate percentage increases
    const calculateIncrease = (current: number, previous: number) => {
      if (previous === 0) return current === 0 ? 0 : 100;
      return ((current - previous) / previous) * 100;
    };
    
    return {
      totalSales: currentSales,
      totalProfit: currentProfit,
      totalTransactions: currentTransactions,
      salesIncrease: calculateIncrease(currentSales, previousSales),
      profitIncrease: calculateIncrease(currentProfit, previousProfit),
      transactionsIncrease: calculateIncrease(currentTransactions, previousTransactions)
    };
  } catch (error) {
    console.error(`Error fetching ${timeRange} profit stats:`, error);
    return {
      totalSales: 0,
      totalProfit: 0,
      totalTransactions: 0,
      salesIncrease: 0,
      profitIncrease: 0,
      transactionsIncrease: 0
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

// return pembelian

export async function getTransactionDetails(penjualanId: number) {
  try {
    const transaction = await prisma.penjualan.findUnique({
      where: { penjualanId },
      include: {
        pelanggan: true,
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
  returnedItems: { 
    produkId: number; 
    kuantitas: number; 
    harga: number; 
    hargaModal?: number;
    discountPercentage: number | null;
    discountAmount: number | null;
  }[];
  replacementItems: { 
    produkId: number; 
    kuantitas: number; 
    promotionTitle: string;
    harga: number; 
    hargaModal?: number;
    discountPercentage: number | null;
    discountAmount: number | null;
  }[];
  totalReturn: number;
  totalReplacement: number;
  additionalPayment: number;
}) {
  const { penjualanId, userId, returnedItems, replacementItems, totalReturn, totalReplacement, additionalPayment } = returnData;
  
  try {
    console.log("Processing return", returnData);
    return await prisma.$transaction(async (tx) => {
      // Get the original transaction to access its details
      const originalTransaction = await tx.penjualan.findUnique({
        where: { penjualanId },
        include: {
          detailPenjualan: {
            include: { produk: true },
          },
          pelanggan: true,
        },
      });

      console.log("hasil query :",originalTransaction)
      
      if (!originalTransaction) {
        throw new Error("Transaction not found");
      }

      // Calculate proportion of points discount (if any) for returned items
      const pointsDiscount = originalTransaction.diskonPoin || 0;
      const originalTotal = originalTransaction.total_harga + pointsDiscount; // Add back point discount to get pre-discount total
      
      // Calculate what proportion of the original transaction is being returned
      let returnProportion = 0;
      if (originalTotal > 0) {
        returnProportion = totalReturn / originalTotal;
      }
      
      // Calculate points discount amount for returned items (proportional)
      const returnedPointsDiscount = Math.round(pointsDiscount * returnProportion);
      
      // Track original and adjusted item details for history
      const returnHistory = [];
      
      // Calculate total modal for returned items
      let returnedModalTotal = 0;
      for (const item of returnedItems) {
        // Find the original product details from transaction
        const originalDetail = originalTransaction.detailPenjualan.find(
          detail => detail.produkId === item.produkId
        );
        
        if (originalDetail) {
          // Store original detail info for history
          const originalItemPrice = originalDetail.produk.harga;
          const discountedPrice = originalDetail.discountPercentage ? 
            originalItemPrice * (1 - (originalDetail.discountPercentage / 100)) : 
            originalItemPrice - (originalDetail.discountAmount || 0);
            
          // Use the product's modal price and quantity to calculate modal value being returned
          const productModal = originalDetail.produk.hargaModal;
          returnedModalTotal += productModal * item.kuantitas;

          // Track return history
          returnHistory.push({
            type: 'return',
            produkId: item.produkId,
            produkName: originalDetail.produk.nama,
            quantity: item.kuantitas,
            originalPrice: originalItemPrice,
            effectivePrice: discountedPrice,
            discount: {
              percentage: originalDetail.discountPercentage,
              amount: originalDetail.discountAmount,
              promotionTitle: originalDetail.promotionTitle
            }
          });
          
          // Update the detailPenjualan record to reflect the actual quantity after return
          const newQuantity = originalDetail.kuantitas - item.kuantitas;
          const newSubtotal = Math.round(newQuantity * discountedPrice);
          
          if (newQuantity <= 0) {
            // If all items are returned, delete the record
            await tx.detailPenjualan.delete({
              where: { detailId: originalDetail.detailId }
            });
          } else {
            // Update the quantity and subtotal in detailPenjualan
            await tx.detailPenjualan.update({
              where: { detailId: originalDetail.detailId },
              data: {
                kuantitas: newQuantity,
                subtotal: newSubtotal
              }
            });
          }
        }
      }
      
      // Process replacement items with current promotions
      let replacementModalTotal = 0;
      for (const item of replacementItems) {
        const product = await tx.produk.findUnique({
          where: { produkId: item.produkId },
        });
        
        if (product) {
          // Check for active promotions for this product
          const currentDate = new Date();
          const activePromotion = await tx.promotionProduct.findFirst({
            where: {
              produkId: item.produkId,
              promotion: {
                startDate: { lte: currentDate },
                endDate: { gte: currentDate }
              }
            },
            include: {
              promotion: true
            }
          });
          
          let discountPercentage = item.discountPercentage;
          let discountAmount = item.discountAmount;
          let promotionTitle = null;
          
          // Apply promotion if it exists and wasn't already specified in item data
          if (activePromotion && !discountPercentage && !discountAmount) {
            discountPercentage = activePromotion.promotion.discountPercentage || null;
            discountAmount = activePromotion.promotion.discountAmount || null;
            promotionTitle = activePromotion.promotion.title;
          }
          
          // Calculate actual price after discount
          let effectivePrice = product.harga;
          if (discountPercentage) {
            effectivePrice = Math.round(effectivePrice * (1 - (discountPercentage / 100)));
          } else if (discountAmount) {
            effectivePrice = Math.round(effectivePrice - discountAmount);
          }
          
          replacementModalTotal += product.hargaModal * item.kuantitas;
          
          // Track replacement history
          returnHistory.push({
            type: 'replacement',
            produkId: item.produkId,
            produkName: product.nama,
            quantity: item.kuantitas,
            originalPrice: product.harga,
            effectivePrice: effectivePrice,
            discount: {
              percentage: discountPercentage,
              amount: discountAmount,
              promotionTitle: promotionTitle
            }
          });
          
          // Check if product already exists in original transaction
          const existingDetail = originalTransaction.detailPenjualan.find(
            detail => detail.produkId === item.produkId
          );
          
          if (existingDetail) {
            // Update existing product quantity and subtotal
            const newQuantity = existingDetail.kuantitas + item.kuantitas;
            const newSubtotal = Math.round(newQuantity * effectivePrice);
            
            await tx.detailPenjualan.update({
              where: { detailId: existingDetail.detailId },
              data: {
                kuantitas: newQuantity,
                subtotal: newSubtotal,
                promotionTitle: promotionTitle,
                discountPercentage: discountPercentage,
                discountAmount: discountAmount
              }
            });
          } else {
            // Add new product to the transaction
            await tx.detailPenjualan.create({
              data: {
                penjualanId,
                produkId: item.produkId,
                kuantitas: item.kuantitas,
                subtotal: Math.round(item.kuantitas * effectivePrice),
                promotionTitle: promotionTitle,
                discountPercentage: discountPercentage,
                discountAmount: discountAmount
              }
            });
          }
        }
      }
      
      // Store detailed return history as JSON in the refund record
      const returnHistoryJSON = JSON.stringify(returnHistory);
      
      // Create return record (stored in Refund model)
      const refund = await tx.refund.create({
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
          // Add new column to store detailed return history
          returnHistoryData: returnHistoryJSON,
        },
      });
      
      // Update stock for returned products
      for (const item of returnedItems) {
        await tx.produk.update({
          where: { produkId: item.produkId },
          data: { stok: { increment: item.kuantitas } },
        });
      }
      
      // Update stock for replacement products
      for (const item of replacementItems) {
        await tx.produk.update({
          where: { produkId: item.produkId },
          data: { stok: { decrement: item.kuantitas } },
        });
      }
      
      // Calculate difference between replacement total and return total
      const difference = totalReplacement - totalReturn;
      
      // Calculate net changes for modal and profit
      const netModalChange = replacementModalTotal - returnedModalTotal;
      const netProfitChange = (totalReplacement - replacementModalTotal) - (totalReturn - returnedModalTotal);
      
      // Get current values
      const currentTotalHarga = originalTransaction.total_harga;
      const currentTotalModal = originalTransaction.total_modal || 0;
      const currentKeuntungan = originalTransaction.keuntungan || 0;
      
      // Calculate updated diskonPoin after removing returned items' proportion
      const updatedDiskonPoin = pointsDiscount - returnedPointsDiscount;
      
      // Update original transaction with return information, including modal and profit adjustments
      await tx.penjualan.update({
        where: { penjualanId },
        data: {
          total_harga: currentTotalHarga + difference,
          total_modal: currentTotalModal + netModalChange,
          keuntungan: currentKeuntungan + netProfitChange,
          diskonPoin: updatedDiskonPoin > 0 ? updatedDiskonPoin : 0,
          uangMasuk: additionalPayment > 0 ? 
            (originalTransaction.uangMasuk || 0) + additionalPayment : 
            undefined,
        },
      });
      
      // If there's additional payment and separate transaction is needed
      if (additionalPayment > 0 && replacementItems.length > 0 && difference > 0) {
        // Calculate modal and profit for the new transaction
        const newTransactionModal = replacementItems.reduce((total, item) => {
          const product = originalTransaction.detailPenjualan.find(
            detail => detail.produkId === item.produkId
          )?.produk;
          
          return total + (product?.hargaModal || 0) * item.kuantitas;
        }, 0);
        
        const newTransactionProfit = additionalPayment - newTransactionModal;
        
        await tx.penjualan.create({
          data: {
            userId,
            total_harga: additionalPayment,
            total_modal: newTransactionModal,
            keuntungan: newTransactionProfit,
            uangMasuk: additionalPayment,
            pelangganId: originalTransaction.pelangganId,
            guestId: originalTransaction.guestId,
            detailPenjualan: {
              create: replacementItems.map((item) => {
                // Calculate effective price with discount
                let effectivePrice = item.harga;
                if (item.discountPercentage) {
                  effectivePrice = Math.round(effectivePrice * (1 - (item.discountPercentage / 100)));
                } else if (item.discountAmount) {
                  effectivePrice = Math.round(effectivePrice - item.discountAmount);
                }
                
                return {
                  produkId: item.produkId,
                  kuantitas: item.kuantitas,
                  subtotal: Math.round(item.kuantitas * effectivePrice),
                  promotionTitle: item.promotionTitle,
                  discountPercentage: item.discountPercentage,
                  discountAmount: item.discountAmount
                };
              }),
            },
          },
        });
      }
      
      return {
        status: "Success",
        message: "Return processed successfully",
        additionalPaymentProcessed: additionalPayment > 0,
        refundId: refund.refundId,
        returnHistory: returnHistory
      };
    });
  } catch (error) {
    console.error("Detailed error:", error);
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
    const {
      title,
      description,
      type,
      startDate,
      endDate,
      discountPercentage,
      discountAmount,
      minQuantity,
      productIds,
    } = input;

    // Basic input validation
    if (!title || !type || !startDate || !endDate) {
      throw new Error("Missing required fields");
    }

    if (!discountPercentage && !discountAmount) {
      throw new Error("Either discount percentage or amount must be provided");
    }

    // Discount type validation
    if (discountPercentage && discountAmount) {
      throw new Error("Cannot provide both discount percentage and amount");
    }

    // Date validation
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (end < start) {
      throw new Error("End date must be after start date");
    }

    // Create transaction to ensure data integrity
    const promotion = await prisma.$transaction(async (prismaClient) => {
      // VALIDATION: Check if selected products already have active promotions
      if (productIds && productIds.length > 0) {
        const productsWithActivePromotions = await prismaClient.promotionProduct.findMany({
          where: {
            produkId: { in: productIds },
            promotion: {
              endDate: { gte: new Date() } // Promotions still active if end date >= today
            }
          },
          include: {
            produk: true,
            promotion: true
          }
        });

        if (productsWithActivePromotions.length > 0) {
          // Some products already have active promotions
          const conflictingProducts = productsWithActivePromotions.map(item => ({
            id: item.produk.produkId,
            nama: item.produk.nama,
            promosi: item.promotion.title,
            berakhir: item.promotion.endDate.toLocaleDateString()
          }));

          throw new Error(`Beberapa produk sudah memiliki promosi aktif: ${JSON.stringify(conflictingProducts)}`);
        }
      }

      // 1. Create the main promotion entry
      const newPromotion = await prismaClient.promotion.create({
        data: {
          title,
          description,
          type,
          startDate: start,
          endDate: end,
          discountPercentage,
          discountAmount,
          minQuantity,
        },
      });

      // 2. If productIds present, create entries in the PromotionProduct join table
      if (productIds && productIds.length > 0) {
        await prismaClient.promotionProduct.createMany({
          data: productIds.map(produkId => ({
            promotionId: newPromotion.promotionId,
            produkId,
            activeUntil: end
          })),
        });
      }

      return newPromotion;
    });

    revalidatePath("/admin/promotions");
    return { success: true, data: promotion };
  } catch (error) {
    console.error("Error creating promotion:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create promotion"
    };
  }
}

export async function updatePromotion(promotionId: number, input: CreatePromotionInput) {
  try {
    const {
      title,
      description,
      type,
      startDate,
      endDate,
      discountPercentage,
      discountAmount,
      minQuantity,
      productIds,
    } = input;

    // Basic validation
    if (!title || !type || !startDate || !endDate) {
      throw new Error("Missing required fields");
    }

    if (!discountPercentage && !discountAmount) {
      throw new Error("Either discount percentage or amount must be provided");
    }

    // Discount type validation
    if (discountPercentage && discountAmount) {
      throw new Error("Cannot provide both discount percentage and amount");
    }

    // Date validation
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (end < start) {
      throw new Error("End date must be after start date");
    }

    // Transaction to ensure data integrity
    const updatedPromotion = await prisma.$transaction(async (prismaClient) => {
      // Get current products associated with this promotion
      const currentPromotionProducts = await prismaClient.promotionProduct.findMany({
        where: { promotionId },
        select: { produkId: true }
      });
      
      const currentProductIds = currentPromotionProducts.map(pp => pp.produkId);
      
      // Identify products to add (new products not in the current list)
      const productsToAdd = productIds 
        ? productIds.filter(id => !currentProductIds.includes(id)) 
        : [];
      
      
      // VALIDATION: Check if products to be added already have active promotions
      if (productsToAdd.length > 0) {
        const productsWithActivePromotions = await prismaClient.promotionProduct.findMany({
          where: {
            produkId: { in: productsToAdd },
            promotionId: { not: promotionId }, // Don't check the promotion being updated
            promotion: {
              endDate: { gte: new Date() } // Still active if end date >= today
            }
          },
          include: {
            produk: true,
            promotion: true
          }
        });

        if (productsWithActivePromotions.length > 0) {
          // Some products already have active promotions
          const conflictingProducts = productsWithActivePromotions.map(item => ({
            id: item.produk.produkId,
            nama: item.produk.nama,
            promosi: item.promotion.title,
            berakhir: item.promotion.endDate.toLocaleDateString()
          }));

          throw new Error(`Beberapa produk sudah memiliki promosi aktif: ${JSON.stringify(conflictingProducts)}`);
        }
      }

      // 1. Update the main promotion
      const promotion = await prismaClient.promotion.update({
        where: { promotionId },
        data: {
          title,
          description,
          type,
          startDate: start,
          endDate: end,
          discountPercentage,
          discountAmount,
          minQuantity,
        },
      });

      // 2. Delete existing product relations
      await prismaClient.promotionProduct.deleteMany({
        where: { promotionId },
      });

      // 3. Create new product relations if productIds provided
      if (productIds && productIds.length > 0) {
        await prismaClient.promotionProduct.createMany({
          data: productIds.map(produkId => ({
            promotionId,
            produkId,
            activeUntil: end
          })),
        });
      }

      return promotion;
    });

    revalidatePath("/admin/promotions");
    return { success: true, data: updatedPromotion };
  } catch (error) {
    console.error("Error updating promotion:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update promotion"
    };
  }
}

// 2. The delete promotion function
export async function deletePromotion(promotionId: number) {
  try {
    // Use transaction to ensure all related data is deleted properly
    await prisma.$transaction(async (prismaClient) => {
      // 1. First delete all product relations
      await prismaClient.promotionProduct.deleteMany({
        where: { promotionId },
      });
      
      // 3. Finally delete the promotion itself
      await prismaClient.promotion.delete({
        where: { promotionId },
      });
    });
    
    revalidatePath("/admin/promotions");
    return { success: true };
  } catch (error) {
    console.error("Error deleting promotion:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete promotion"
    };
  }
}




export async function getPromotions() {
  try {
    const promotions = await prisma.promotion.findMany({
      include: {
        promotionProducts: {
          select: {
            produk: {
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


export async function getProductsForPromotions(promotionIdToEdit = null) {
  try {
    console.log(`Fetching products for promotions, editing promotion ID: ${promotionIdToEdit}`);
    
    // Get all active products
    const allProducts = await prisma.produk.findMany({
      where: {
        isDeleted: false,
        stok: { gt: 0 }
      },
      include: {
        kategori: true,
        // Include promotion associations for these products
        promotionProducts: {
          include: {
            promotion: true
          },
          where: {
            promotion: {
              endDate: { gte: new Date() } // Only active promotions
            }
          }
        }
      }
    });
    
    console.log(`Found ${allProducts.length} active products`);

    // If editing a promotion, get its full details
    let promotionBeingEdited = null;
    if (promotionIdToEdit) {
      promotionBeingEdited = await prisma.promotion.findUnique({
        where: { promotionId: parseInt(promotionIdToEdit) },
        include: {
          promotionProducts: {
            include: {
              produk: {
                include: {
                  kategori: true
                }
              }
            }
          }
        }
      });
      
      console.log(`Found promotion to edit: ${promotionBeingEdited?.title || 'Unknown'}`);
      if (promotionBeingEdited?.promotionProducts) {
        console.log(`Promotion has ${promotionBeingEdited.promotionProducts.length} associated products`);
      }
    }

    // Create a map of products that are part of the promotion being edited
    const productsInEditedPromotion = new Map();
    if (promotionBeingEdited && promotionBeingEdited.promotionProducts) {
      promotionBeingEdited.promotionProducts.forEach(pp => {
        if (pp.produk && pp.produk.produkId) {
          productsInEditedPromotion.set(pp.produk.produkId, pp.produk);
        }
      });
    }
    
    // Process all products with their promotion information
    const processedProducts = allProducts.map(product => {
      // Check if this product is associated with any promotions excluding the one being edited
      const otherActivePromotions = product.promotionProducts
        .filter(pp => !promotionIdToEdit || pp.promotion.promotionId !== parseInt(promotionIdToEdit));
      
      // Check if product has other active promotions
      const hasOtherActivePromotions = otherActivePromotions.length > 0;
      
      // Format product info consistently
      const formattedProduct = {
        produkId: product.produkId,
        nama: product.nama,
        harga: product.harga,
        image: product.image,
        stok: product.stok,
        kategori: product.kategori,
        // Only flag as having active promotions if it's in promotions OTHER than the one being edited
        hasActivePromotion: hasOtherActivePromotions,
        // Include all active promotion details
        activePromotions: product.promotionProducts.map(pp => ({
          promotionId: pp.promotion.promotionId,
          title: pp.promotion.title,
          endDate: pp.promotion.endDate
        }))
      };

      return formattedProduct;
    });

    // Now add any products from the promotion being edited that might not be in the main query
    // (This handles cases where a product might have been deleted or is out of stock)
    if (promotionBeingEdited) {
      const currentProductIds = new Set(processedProducts.map(p => p.produkId));
      
      // Find products that are part of this promotion but missing from our main query
      const missingProducts = [];
      
      for (const [produkId, produk] of productsInEditedPromotion.entries()) {
        if (!currentProductIds.has(produkId)) {
          missingProducts.push({
            produkId: produk.produkId,
            nama: produk.nama,
            harga: produk.harga,
            image: produk.image || '',
            stok: produk.stok,
            kategori: produk.kategori,
            hasActivePromotion: false, // Not important since it's already in this promotion
            activePromotions: [{
              promotionId: promotionIdToEdit !== null ? parseInt(promotionIdToEdit) : -1,
              title: promotionBeingEdited.title,
              endDate: promotionBeingEdited.endDate
            }]
          });
        }
      }
      
      if (missingProducts.length > 0) {
        console.log(`Adding ${missingProducts.length} products that are in the promotion but missing from active products`);
        processedProducts.push(...missingProducts);
      }
    }

    // Prepare the response
    const response = {
      status: "success",
      data: processedProducts,
      // Additional info about the promotion being edited
      editInfo: promotionIdToEdit ? {
        promotionId: parseInt(promotionIdToEdit),
        promotionTitle: promotionBeingEdited?.title || 'Unknown Promotion',
        productIds: Array.from(productsInEditedPromotion.keys())
      } : null
    };
    
    console.log(`Returning ${processedProducts.length} total products`);
    return response;
  } catch (error) {
    console.error("Error fetching products for promotions:", error);
    return {
      status: "error",
      message: "Failed to fetch products for promotion",
      error: error instanceof Error ? error.message : "Unknown error"
    };
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
  profit: number;
  name: string;
  revenue: number;
  transactions: number;
}

export async function getPromotionAnalytics(): Promise<PromotionAnalytics[]> {
  try {
    // Query only detail penjualan that explicitly have a promotionId
    const promotionSales = await prisma.detailPenjualan.findMany({
      where: {
        promotionId: {
          not: null, // Only get sales with a promotion applied
        },
      },
      select: {
        promotionId: true,
        promotionTitle: true,
        kuantitas: true,
        subtotal: true,
        penjualanId: true,
        produk: {
          select: {
            hargaModal: true,
          },
        },
        penjualan: {
          select: {
            penjualanId: true,
          },
        },
      },
    });

    // Group sales by promotion
    const salesByPromotion = promotionSales.reduce((acc, sale) => {
      // Skip if no promotionId or promotionTitle - this should never happen due to our where clause
      if (!sale.promotionId || !sale.promotionTitle) return acc;
      
      const promotionId = sale.promotionId;
      const promotionTitle = sale.promotionTitle;
      
      if (!acc[promotionId]) {
        acc[promotionId] = {
          name: promotionTitle,
          sales: [],
        };
      }
      
      acc[promotionId].sales.push({
        penjualanId: sale.penjualanId,
        kuantitas: sale.kuantitas,
        subtotal: sale.subtotal,
        hargaModal: sale.produk.hargaModal,
      });
      
      return acc;
    }, {} as Record<number, { name: string; sales: Array<{ penjualanId: number; kuantitas: number; subtotal: number; hargaModal: number }> }>);

    // Calculate metrics for each promotion
    const promotionAnalytics: PromotionAnalytics[] = Object.values(salesByPromotion).map((promotion) => {
      const revenue = promotion.sales.reduce((sum, sale) => sum + sale.subtotal, 0);
      
      const profit = promotion.sales.reduce((sum, sale) => {
        const modalForSale = sale.hargaModal * sale.kuantitas;
        return sum + (sale.subtotal - modalForSale);
      }, 0);
      
      // Count unique transactions
      const uniqueTransactionsSet = new Set(
        promotion.sales.map(sale => sale.penjualanId)
      );
      const transactions = uniqueTransactionsSet.size;
      
      return {
        name: promotion.name,
        revenue: revenue,
        profit: profit,
        transactions: transactions,
      };
    });

    // Sort by revenue (highest first)
    return promotionAnalytics.sort((a, b) => b.revenue - a.revenue);
  } catch (error) {
    console.error("Error fetching promotion analytics:", error);
    throw new Error("Failed to fetch promotion analytics");
  }
}



export async function getPetugasById(id: number) {
  try {
    const petugas = await prisma.user.findUnique({
      where: {
        id: id,
        level: "PETUGAS"
      }
    })
    return petugas
  } catch (error) {
    console.error("Error fetching petugas by id:", error);
    throw new Error("Failed to fetch petugas by id")
  }
}


export async function getActivePromotions() {
  try {
    const currentDate = new Date();
    
    // First, get all active promotions
    const activePromotions = await prisma.promotion.findMany({
      where: {
        startDate: { lte: currentDate },
        endDate: { gte: currentDate }
      },
      include: {
        promotionProducts: {
          include: {
            produk: true
          }
        }
      }
    });
    
    // Format the data for frontend use
    return activePromotions.map(promotion => ({
      promotionId: promotion.promotionId,
      title: promotion.title,
      description: promotion.description,
      discountPercentage: promotion.discountPercentage,
      discountAmount: promotion.discountAmount,
      produkIds: promotion.promotionProducts.map(pp => pp.produkId)
    }));
  } catch (error) {
    console.error("Error fetching active promotions:", error);
    throw error;
  }
}

export async function searchProducts(query: string) {
  try {
    const products = await prisma.produk.findMany({
      where: {
        AND: [
          { isDeleted: false },
          { stok: { gt: 0 } },
          {
            OR: [
              { nama: { contains: query, mode: 'insensitive' } },
              // Add additional search fields if needed
            ]
          }
        ]
      },
      take: 10, // Limit results
    });
    
    return products;
  } catch (error) {
    console.error("Error searching products:", error);
    throw error;
  }
}







// Interface for product performance report
export interface ProductPerformanceReportData {
  id: number;
  name: string;
  period: string;
  periodType: "weekly" | "monthly" | "yearly";
  generatedDate: string;
  totalSales: number;
  totalProductsSold: number;
  prevPeriodSales?: number; // Previous period sales
  salesGrowth?: number; // Sales growth in percentage
  totalProfit: number; // Total profit
  avgProfitMargin: number; // Average profit margin
  productsWithNoSales: ProductPerformanceData[]; // Products without sales
  data: ProductPerformanceData[];
  categorySummary: CategorySalesData[];
}

interface ProductPerformanceData {
  produkId: number;
  productName: string;
  category: string;
  quantitySold: number;
  totalSales: number;
  salesContribution: number; // Percentage of total sales
  profitMargin: number;
  profitAmount: number;
  stockLevel: number;
  ranking: number;
  stockTurnover: number; // Stock turnover
  prevPeriodSales?: number; // Previous period sales
  growthPercentage?: number; // Growth percentage
  PriceSale: number; // Add selling price
  PriceCapital: number; // Add modal (cost price)

}

interface CategorySalesData {
  kategoriId: number;
  categoryName: string;
  quantitySold: number;
  totalSales: number;
  salesContribution: number; // Percentage of total sales
  productCount: number;
  bestSellingProduct: string;
  prevPeriodSales?: number; // Previous period sales
  growthPercentage?: number; // Growth percentage
  avgProfitMargin: number; // Average profit margin for category
  productCountWithNoSales: number; // Number of products without sales
}

// Function to generate product performance report
export async function generateProductPerformanceReport(
  periodType: "weekly" | "monthly" | "yearly"
): Promise<ProductPerformanceReportData> {
  const currentDate = new Date();
  let startDate: Date;
  let prevPeriodStartDate: Date;
  let prevPeriodEndDate: Date;
  let periodLabel: string;
  let reportName: string;

  // Determine date range based on period type
  switch (periodType) {
    case "weekly": {
      // Set start date to beginning of this week
      startDate = startOfWeek(currentDate);
      periodLabel = `${format(startDate, "dd MMM yyyy")} - ${format(currentDate, "dd MMM yyyy")}`;
      reportName = "Weekly Product Performance Report";
      
      // Previous period (last week)
      prevPeriodEndDate = subDays(startDate, 1);
      prevPeriodStartDate = startOfWeek(prevPeriodEndDate);
      break;
    }
    case "monthly": {
      // Set start date to beginning of this month
      startDate = startOfMonth(currentDate);
      periodLabel = format(startDate, "MMMM yyyy");
      reportName = "Monthly Product Performance Report";
      
      // Previous period (last month)
      prevPeriodEndDate = subDays(startDate, 1);
      prevPeriodStartDate = startOfMonth(prevPeriodEndDate);
      break;
    }
    case "yearly": {
      // Set start date to beginning of this year
      startDate = startOfYear(currentDate);
      periodLabel = format(startDate, "yyyy");
      reportName = "Yearly Product Performance Report";
      
      // Previous period (last year)
      prevPeriodEndDate = subDays(startDate, 1);
      prevPeriodStartDate = startOfYear(prevPeriodEndDate);
      break;
    }
  }

  // Get sales data for the period
  const sales = await prisma.penjualan.findMany({
    where: {
      tanggalPenjualan: {
        gte: startDate,
        lte: currentDate
      }
    },
    include: {
      detailPenjualan: {
        include: {
          produk: {
            include: {
              kategori: true
            }
          }
        }
      }
    }
  });
  
  // Get sales data for previous period (for comparison)
  const prevPeriodSales = await prisma.penjualan.findMany({
    where: {
      tanggalPenjualan: {
        gte: prevPeriodStartDate,
        lte: prevPeriodEndDate
      }
    },
    include: {
      detailPenjualan: {
        include: {
          produk: {
            include: {
              kategori: true
            }
          }
        }
      }
    }
  });

  // Get current stock data for all products
  const currentProducts = await prisma.produk.findMany({
    where: { isDeleted: false },
    include: { kategori: true }
  });

  // Map current product stocks
  const productStockMap = new Map<number, number>();
  currentProducts.forEach(product => {
    productStockMap.set(product.produkId, product.stok);
  });
  
  // Map to store previous period sales
  const prevPeriodProductMap = new Map<number, { sales: number, quantity: number }>();
  const prevPeriodCategoryMap = new Map<number, { sales: number, quantity: number }>();
  
  // Calculate total sales for previous period
  let prevPeriodTotalSales = 0;
  
  // Process previous period sales data
  prevPeriodSales.forEach(sale => {
    sale.detailPenjualan.forEach(detail => {
      const productId = detail.produkId;
      const categoryId = detail.produk.kategoriId;
      const salesAmount = detail.subtotal;
      const quantity = detail.kuantitas;
      
      prevPeriodTotalSales += salesAmount;
      
      // Update previous period product data
      if (!prevPeriodProductMap.has(productId)) {
        prevPeriodProductMap.set(productId, { sales: 0, quantity: 0 });
      }
      const productData = prevPeriodProductMap.get(productId)!;
      productData.sales += salesAmount;
      productData.quantity += quantity;
      
      // Update previous period category data
      if (!prevPeriodCategoryMap.has(categoryId)) {
        prevPeriodCategoryMap.set(categoryId, { sales: 0, quantity: 0 });
      }
      const categoryData = prevPeriodCategoryMap.get(categoryId)!;
      categoryData.sales += salesAmount;
      categoryData.quantity += quantity;
    });
  });

  // Calculate product performance data
  const productMap = new Map<number, ProductPerformanceData>();
  const categoryMap = new Map<number, CategorySalesData>();
  let totalSales = 0;
  let totalProductsSold = 0;
  let totalProfit = 0;

  // Process sales data
  sales.forEach(sale => {
    sale.detailPenjualan.forEach(detail => {
      const product = detail.produk;
      const category = product.kategori;
      const salesAmount = detail.subtotal;
      const quantity = detail.kuantitas;
      
      totalSales += salesAmount;
      totalProductsSold += quantity;

      // Update product data
      if (!productMap.has(product.produkId)) {
        // Get previous period sales data if available
        const prevProductData = prevPeriodProductMap.get(product.produkId);
        const prevSales = prevProductData?.sales || 0;
        
        // Calculate stock turnover
        // Formula: Sales / Average inventory
        const currentStock = productStockMap.get(product.produkId) || 0;
        // This is just an estimate since we don't have beginning of period stock
        const estimatedStockAtStart = currentStock + quantity;
        const avgStock = (currentStock + estimatedStockAtStart) / 2;
        const stockTurnover = avgStock > 0 ? quantity / avgStock : 0;
        
        productMap.set(product.produkId, {
          produkId: product.produkId,
          productName: product.nama,
          category: category.nama,
          quantitySold: 0,
          totalSales: 0,
          salesContribution: 0,
          profitMargin: 0,
          profitAmount: 0,
          stockLevel: currentStock,
          ranking: 0,
          stockTurnover: stockTurnover,
          prevPeriodSales: prevSales,
          growthPercentage: prevSales > 0 ? ((salesAmount - prevSales) / prevSales) * 100 : undefined,
          PriceSale: product.harga,     // Add the selling price
          PriceCapital: product.hargaModal // Add the modal (cost price)

        });
      }
      
      const productData = productMap.get(product.produkId)!;
      productData.quantitySold += quantity;
      productData.totalSales += salesAmount;
      
      // Calculate profit margin
      const costPerItem = product.hargaModal;
      const revenuePerItem = salesAmount / quantity;
      const profitPerItem = revenuePerItem - costPerItem;
      const profitAmount = profitPerItem * quantity;
      
      productData.profitMargin = ((revenuePerItem - costPerItem) / revenuePerItem) * 100;
      productData.profitAmount += profitAmount;
      
      // Add to total profit
      totalProfit += profitAmount;

      // Update category data
      if (!categoryMap.has(category.kategoriId)) {
        // Get previous period category data if available
        const prevCategoryData = prevPeriodCategoryMap.get(category.kategoriId);
        const prevSales = prevCategoryData?.sales || 0;
        
        categoryMap.set(category.kategoriId, {
          kategoriId: category.kategoriId,
          categoryName: category.nama,
          quantitySold: 0,
          totalSales: 0,
          salesContribution: 0,
          productCount: 0,
          bestSellingProduct: "",
          prevPeriodSales: prevSales,
          growthPercentage: prevSales > 0 ? ((salesAmount - prevSales) / prevSales) * 100 : undefined,
          avgProfitMargin: 0, // Will be calculated later
          productCountWithNoSales: 0 // Will be calculated later
        });
      }
      
      const categoryData = categoryMap.get(category.kategoriId)!;
      categoryData.quantitySold += quantity;
      categoryData.totalSales += salesAmount;
      
      // Increment product count only once per product
      if (productData.quantitySold === quantity) {
        categoryData.productCount++;
      }
    });
  });

  // Calculate sales contribution percentage
  productMap.forEach(product => {
    product.salesContribution = (product.totalSales / totalSales) * 100;
  });
  
  categoryMap.forEach(category => {
    category.salesContribution = (category.totalSales / totalSales) * 100;
  });

  // Add all products with no sales in this period
  const productsWithNoSales: ProductPerformanceData[] = [];
  
  currentProducts.forEach(product => {
    if (!productMap.has(product.produkId)) {
      // Get previous period sales data if available
      const prevProductData = prevPeriodProductMap.get(product.produkId);
      const prevSales = prevProductData?.sales || 0;
      
      const noSalesProduct: ProductPerformanceData = {
        produkId: product.produkId,
        productName: product.nama,
        category: product.kategori.nama,
        quantitySold: 0,
        totalSales: 0,
        salesContribution: 0,
        profitMargin: 0,
        profitAmount: 0,
        stockLevel: product.stok,
        ranking: 0,
        stockTurnover: 0,
        prevPeriodSales: prevSales,
        PriceSale: product.harga,     // Add the selling price
        PriceCapital: product.hargaModal, // Add the modal (cost price)
        growthPercentage: prevSales > 0 ? -100 : 0 // -100% if there were sales previously
      };
      
      productMap.set(product.produkId, noSalesProduct);
      productsWithNoSales.push(noSalesProduct);
      
      // Update category for products with no sales
      if (categoryMap.has(product.kategoriId)) {
        const categoryData = categoryMap.get(product.kategoriId);
        if (categoryData) {
          categoryData.productCountWithNoSales++;
        }
      } else {
        // If category doesn't exist in map yet, add it
        categoryMap.set(product.kategoriId, {
          kategoriId: product.kategoriId,
          categoryName: product.kategori.nama,
          quantitySold: 0,
          totalSales: 0,
          salesContribution: 0,
          productCount: 0,
          productCountWithNoSales: 1,
          bestSellingProduct: "",
          prevPeriodSales: 0,
          growthPercentage: 0,
          avgProfitMargin: 0
        });
      }
    }
  });

  // Sort products by total sales and assign rankings
  const sortedProducts = Array.from(productMap.values())
    .sort((a, b) => b.totalSales - a.totalSales)
    .map((product, index) => {
      product.ranking = index + 1;
      return product;
    });

  // Determine best-selling product for each category and calculate average profit margin
  categoryMap.forEach((category) => {
    const categoryProducts = sortedProducts.filter(
      product => product.category === category.categoryName && product.quantitySold > 0
    );
    
    if (categoryProducts.length > 0) {
      category.bestSellingProduct = categoryProducts[0].productName;
      
      // Calculate average profit margin for category
      const totalMargin = categoryProducts.reduce((sum, product) => sum + product.profitMargin, 0);
      category.avgProfitMargin = totalMargin / categoryProducts.length;
    }
  });

  // Create additional analysis
  const categorySummary = Array.from(categoryMap.values())
    .sort((a, b) => b.totalSales - a.totalSales);
    
  // Calculate average profit margin across all products
  const productsWithSales = sortedProducts.filter(p => p.quantitySold > 0);
  const avgProfitMargin = productsWithSales.length > 0
    ? productsWithSales.reduce((sum, product) => sum + product.profitMargin, 0) / productsWithSales.length
    : 0;

  return {
    id: Date.now(),
    name: reportName,
    period: periodLabel,
    periodType,
    generatedDate: new Date().toISOString(),
    totalSales,
    totalProductsSold,
    prevPeriodSales: prevPeriodTotalSales,
    salesGrowth: prevPeriodTotalSales > 0 
      ? ((totalSales - prevPeriodTotalSales) / prevPeriodTotalSales) * 100 
      : undefined,
    totalProfit,
    avgProfitMargin,
    productsWithNoSales,
    data: sortedProducts,
    categorySummary
  };
};