"use client";

import React, { useEffect, useState, useTransition } from "react";
import {
  Plus,
  Edit,
  Trash2,
  Calendar,
  Tag,
  Percent,
  DollarSign,
} from "lucide-react";
import { formatRupiah } from "@/lib/formatIdr";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PromotionType } from "@prisma/client";
import {
  createPromotion,
  deletePromotion,
  getCategories,
  getProductsForPromotions,
  getPromotions,
} from "@/server/actions";
import { MultiSelect } from "./Multiselect";
import { DeleteConfirmModal } from "./DeleteConfirmModal";
import { toast } from "@/hooks/use-toast";

interface Category {
  kategoriId: number;
  nama: string;
}

interface PromotionFormData {
  title: string;
  description: string;
  type: PromotionType;
  startDate: string;
  endDate: string;
  discountType: "percentage" | "amount";
  discountValue: number;
  minQuantity?: number;
  applicableType: "products" | "categories";
  selectedProductIds: number[];
  selectedCategoryIds: number[];
}

interface ProductsType {
  kategori: {
    nama: string;
  };
  nama: string;
  produkId: number;
  harga: number;
}

interface Promotion {
  promotionId: number;
  title: string;
  description: string | null;
  type:
    | "FLASH_SALE"
    | "SPECIAL_DAY"
    | "WEEKEND"
    | "PRODUCT_SPECIFIC"
    | "QUANTITY_BASED";
  startDate: Date;
  endDate: Date;
  discountPercentage: number | null;
  discountAmount: number | null;
  minQuantity: number | null;
  createdAt: Date;
  updatedAt: Date;
  products: {
    produkId: number;
    nama: string;
    harga: number;
    kategori: {
      nama: string;
    };
  }[];
  categories: {
    kategoriId: number;
    nama: string;
  }[];
}

export function PromotionManagement() {
  // State for the selected promotion (for deletion)
  const [selectedPromosi, setSelectedPromosi] = useState<Promotion | null>(null);
  // Control whether the delete modal is open
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<ProductsType[]>([]);
  const [initialPromotions, setInitialPromotions] = useState<Promotion[]>([]);
  const [isPending, startTransition] = useTransition();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<PromotionFormData>({
    title: "",
    description: "",
    type: PromotionType.PRODUCT_SPECIFIC,
    startDate: "",
    endDate: "",
    discountType: "percentage",
    discountValue: 0,
    minQuantity: 0,
    applicableType: "products",
    selectedProductIds: [],
    selectedCategoryIds: [],
  });

  // Fetch categories
  useEffect(() => {
    const fetchingCategories = async () => {
      const res = await getCategories();
      setCategories(res.data ?? []);
    };
    fetchingCategories();
  }, []);

  // Fetch products
  useEffect(() => {
    const fetchingProduct = async () => {
      const res = await getProductsForPromotions();
      setProducts(res.data ?? []);
    };
    fetchingProduct();
  }, []);

  // Fetch initial promotions
  useEffect(() => {
    const fetchingInitialPromotions = async () => {
      const res = await getPromotions();
      setInitialPromotions(res.data ?? []);
    };
    fetchingInitialPromotions();
  }, []);

  // Submit handler for adding a new promotion
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const input = {
        title: formData.title,
        description: formData.description,
        type: formData.type,
        startDate: new Date(formData.startDate),
        endDate: new Date(formData.endDate),
        discountPercentage:
          formData.discountType === "percentage"
            ? formData.discountValue
            : undefined,
        discountAmount:
          formData.discountType === "amount" ? formData.discountValue : undefined,
        minQuantity:
          formData.type === PromotionType.QUANTITY_BASED ? formData.minQuantity : undefined,
        productIds:
          formData.applicableType === "products" ? formData.selectedProductIds : undefined,
        categoryIds:
          formData.applicableType === "categories" ? formData.selectedCategoryIds : undefined,
      };

      const result = await createPromotion(input);
      if (result.success) {
        setIsModalOpen(false);
        resetForm();
      } else {
        // Handle error
        alert(result.error);
      }
    });
  };

  // When clicking the trash icon: set the selected promotion and open the delete modal
  const handleEditClick = (promosi: Promotion) => {
    setSelectedPromosi(promosi);
    setIsDeleteModalOpen(true);
  };

  // Delete handler called from the modal's "Hapus" button
  const handleDelete = async () => {
    if (selectedPromosi) {
      try {
        const deletePromosi = await deletePromotion(selectedPromosi.promotionId);
        if (deletePromosi) {
          toast({
            title: "Delete Success",
            description: "Delete Promosi Success",
          });
        }
      } catch (error) {
        toast({
          title: "Delete Failed",
          description: "Delete Promotion Failed",
        });
        console.log(error);
      }
      setIsDeleteModalOpen(false);
      setSelectedPromosi(null);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      type: PromotionType.PRODUCT_SPECIFIC,
      startDate: "",
      endDate: "",
      discountType: "percentage",
      discountValue: 0,
      minQuantity: 0,
      applicableType: "products",
      selectedProductIds: [],
      selectedCategoryIds: [],
    });
  };

  const handleEdit = (promo: []) => {
    // Implement your edit functionality here.
    console.log("Edit Promotion:", promo);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-black transform -rotate-2">MANAJEMEN PROMOSI</h2>
        <Button
          onClick={() => setIsModalOpen(true)}
          className="px-6 py-3 bg-[#FFD700] font-bold text-lg border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
                     hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none transition-all flex items-center gap-2"
          disabled={isPending}
        >
          <Plus className="mr-2" />
          Tambah Promosi
        </Button>
      </div>

      {/* Form Modal for adding a new promotion */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white border-4 border-black p-6 max-w-2xl w-full mx-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <h3 className="text-2xl font-bold mb-4 transform -rotate-2 inline-block relative">
              Tambah Promosi Baru
              <div className="absolute -bottom-1 left-0 w-full h-2 bg-[#FFD700] transform -rotate-2 -z-10"></div>
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label className="font-bold">Judul Promosi</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  className="border-2 border-black"
                />
              </div>

              <div>
                <Label className="font-bold">Deskripsi</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="border-2 border-black"
                />
              </div>

              <div>
                <Label className="font-bold">Tipe Promosi</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) =>
                    setFormData({ ...formData, type: value as PromotionType })
                  }
                >
                  <SelectTrigger className="border-2 border-black">
                    <SelectValue placeholder="Pilih tipe promosi" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#fff] border-[3px] border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transform hover:-rotate-1 transition-transform">
                    <SelectItem value={PromotionType.FLASH_SALE}>Flash Sale</SelectItem>
                    <SelectItem value={PromotionType.SPECIAL_DAY}>Special Day</SelectItem>
                    <SelectItem value={PromotionType.WEEKEND}>Weekend</SelectItem>
                    <SelectItem value={PromotionType.PRODUCT_SPECIFIC}>
                      Product Specific
                    </SelectItem>
                    <SelectItem value={PromotionType.QUANTITY_BASED}>
                      Quantity Based
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="font-bold">Tanggal Mulai</Label>
                  <Input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) =>
                      setFormData({ ...formData, startDate: e.target.value })
                    }
                    required
                    className="border-2 border-black"
                  />
                </div>
                <div>
                  <Label className="font-bold">Tanggal Berakhir</Label>
                  <Input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) =>
                      setFormData({ ...formData, endDate: e.target.value })
                    }
                    required
                    className="border-2 border-black"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="font-bold">Tipe Diskon</Label>
                  <Select
                    value={formData.discountType}
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        discountType: value as "percentage" | "amount",
                      })
                    }
                  >
                    <SelectTrigger className="border-2 border-black">
                      <SelectValue placeholder="Pilih tipe diskon" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#fff] border-[3px] border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transform hover:-rotate-1 transition-transform">
                      <SelectItem value="percentage">Persentase</SelectItem>
                      <SelectItem value="amount">Nominal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="font-bold">Nilai Diskon</Label>
                  <Input
                    type="number"
                    value={formData.discountValue}
                    onChange={(e) =>
                      setFormData({ ...formData, discountValue: Number(e.target.value) })
                    }
                    required
                    min="0"
                    className="border-2 border-black"
                  />
                </div>
              </div>

              {formData.type === PromotionType.QUANTITY_BASED && (
                <div>
                  <Label className="font-bold">Minimal Kuantitas</Label>
                  <Input
                    type="number"
                    value={formData.minQuantity}
                    onChange={(e) =>
                      setFormData({ ...formData, minQuantity: Number(e.target.value) })
                    }
                    required
                    min="1"
                    className="border-2 border-black"
                  />
                </div>
              )}

              <div>
                <Label className="font-bold">Berlaku Untuk</Label>
                <Select
                  value={formData.applicableType}
                  onValueChange={(value) =>
                    setFormData({ ...formData, applicableType: value as "products" | "categories" })
                  }
                >
                  <SelectTrigger className="border-2 border-black">
                    <SelectValue placeholder="Pilih tipe aplikasi" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#fff] border-[3px] border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transform hover:-rotate-1 transition-transform">
                    <SelectItem value="products">Produk Tertentu</SelectItem>
                    <SelectItem value="categories">Kategori Tertentu</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.applicableType === "products" && (
                <div>
                  <Label className="font-bold">Pilih Produk</Label>
                  <MultiSelect
                    options={products.map((product) => ({
                      value: product.produkId.toString(),
                      label: `${product.nama} - ${formatRupiah(product.harga)} (${product.kategori.nama})`,
                    }))}
                    value={formData.selectedProductIds.map(String)}
                    onChange={(values) =>
                      setFormData({ ...formData, selectedProductIds: values.map(Number) })
                    }
                    placeholder="Pilih produk yang akan mendapat promosi"
                  />
                </div>
              )}

              {formData.applicableType === "categories" && (
                <div>
                  <Label className="font-bold">Pilih Kategori</Label>
                  <MultiSelect
                    options={categories.map((category) => ({
                      value: category.kategoriId.toString(),
                      label: category.nama,
                    }))}
                    value={formData.selectedCategoryIds.map(String)}
                    onChange={(values) =>
                      setFormData({ ...formData, selectedCategoryIds: values.map(Number) })
                    }
                    placeholder="Pilih kategori yang akan mendapat promosi"
                  />
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="default"
                  onClick={() => {
                    setIsModalOpen(false);
                    resetForm();
                  }}
                  disabled={isPending}
                  className="border-2 bg-white border-black hover:bg-red-500 hover:text-white"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={isPending}
                  className="bg-[#FFD700] text-black hover:bg-black hover:text-[#FFD700] border-2 border-black font-bold"
                >
                  {isPending ? "Menyimpan..." : "Simpan Promosi"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* List of Promotions */}
      <div className="grid gap-4">
        {initialPromotions.map((promo) => (
          <div
            key={promo.promotionId}
            className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]
                       transition-all hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
                       hover:translate-x-[4px] hover:translate-y-[4px]"
          >
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-bold transform -rotate-1">
                    {promo.title}
                  </h3>
                  <span
                    className={`px-2 py-1 text-xs font-black border-2 border-black ${getPromotionStatusColor(
                      promo.startDate,
                      promo.endDate
                    )} transform rotate-2`}
                  >
                    {getPromotionStatus(promo.startDate, promo.endDate)}
                  </span>
                </div>
                <p className="text-gray-600">{promo.description}</p>

                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-1 bg-blue-100 px-3 py-1 border-2 border-black">
                    {promo.discountPercentage ? (
                      <>
                        <Percent size={16} className="text-blue-500" />
                        <span className="font-bold">{promo.discountPercentage}%</span>
                      </>
                    ) : (
                      <>
                        <DollarSign size={16} className="text-green-500" />
                        <span className="font-bold">{formatRupiah(promo.discountAmount || 0)}</span>
                      </>
                    )}
                  </div>

                  <div className="flex items-center gap-1 bg-purple-100 px-3 py-1 border-2 border-black">
                    <Calendar size={16} className="text-purple-500" />
                    <span className="font-bold">
                      {new Date(promo.startDate).toLocaleDateString()} -{" "}
                      {new Date(promo.endDate).toLocaleDateString()}
                    </span>
                  </div>

                  {promo.minQuantity && (
                    <div className="flex items-center gap-1 bg-orange-100 px-3 py-1 border-2 border-black">
                      <Tag size={16} className="text-orange-500" />
                      <span className="font-bold">Min. {promo.minQuantity} items</span>
                    </div>
                  )}
                </div>

                {/* Display related products if any */}
                {promo.products.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm font-bold">Produk:</p>
                    <div className="flex flex-wrap gap-2">
                      {promo.products.map((product) => (
                        <span
                          key={product.produkId}
                          className="px-2 py-1 text-xs bg-gray-100 border-2 border-black font-bold transform -rotate-1"
                        >
                          {product.nama}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Display related categories if any */}
                {promo.categories.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm font-bold">Kategori:</p>
                    <div className="flex flex-wrap gap-2">
                      {promo.categories.map((category) => (
                        <span
                          key={category.kategoriId}
                          className="px-2 py-1 text-xs bg-gray-100 border-2 border-black font-bold transform rotate-1"
                        >
                          {category.nama}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  variant="neutral"
                  size="icon"
                  onClick={() => handleEdit([])}
                  disabled={isPending}
                  className="p-2 bg-[#FFD700] border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
                             hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]
                             active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all transform rotate-2"
                >
                  <Edit size={20} />
                </Button>
                <Button
                  variant="neutral"
                  size="icon"
                  onClick={() => handleEditClick(promo)}
                  disabled={isPending}
                  className="p-2 bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
                             hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]
                             active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all hover:bg-red-500 hover:text-white transform -rotate-2"
                >
                  <Trash2 size={20} />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Delete Confirmation Modal (rendered once) */}
      {selectedPromosi && (
        <DeleteConfirmModal
          isOpen={isDeleteModalOpen}
          itemName={selectedPromosi.title || "Promosi"}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={handleDelete} // Ensure that handleDelete is actually called when confirmed.
          subject="Promosi"
        />
      )}
    </div>
  );
}

// Helper functions
function getPromotionStatus(startDate: string | Date, endDate: string | Date) {
  const now = new Date();
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (now < start) return "AKAN DATANG";
  if (now > end) return "BERAKHIR";
  return "AKTIF";
}

function getPromotionStatusColor(startDate: string | Date, endDate: string | Date) {
  const status = getPromotionStatus(startDate, endDate);
  switch (status) {
    case "AKTIF":
      return "bg-[#4ECDC4] text-black";
    case "AKAN DATANG":
      return "bg-[#FFD93D] text-black";
    case "BERAKHIR":
      return "bg-gray-200 text-black";
    default:
      return "bg-gray-200 text-black";
  }
}
