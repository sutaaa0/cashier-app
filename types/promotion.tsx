// types.ts
import { PromotionType } from "@prisma/client";

export interface Product {
  produkId: number;
  nama: string;
  harga: number;
  kategori: {
    nama: string;
  };
  // Add other fields as needed
}

export interface PromotionProduct {
  id: number;
  promotionId: number;
  produkId: number;
  activeUntil?: Date;
  produk: Product;
}

export interface Promotion {
  promotionId: number;
  title: string;
  description?: string | null;
  type: PromotionType;
  startDate: Date;
  endDate: Date;
  discountPercentage?: number | null;
  discountAmount?: number | null;
  minQuantity?: number | null;
  createdAt: Date;
  updatedAt: Date;
  promotionProducts: PromotionProduct[];
  products?: Product[]; // Derived field
}

export interface PromotionFormData {
  title: string;
  description: string;
  type: PromotionType;
  startDate: string;
  endDate: string;
  discountType: "percentage" | "amount";
  discountValue: number;
  minQuantity: number;
  selectedProductIds: number[];
  startTime: string;
  endTime: string;
  isEditMode: boolean;
}

export interface CreatePromotionInput {
  title: string;
  description: string;
  type: PromotionType;
  startDate: Date;
  endDate: Date;
  discountPercentage?: number;
  discountAmount?: number;
  minQuantity?: number;
  productIds: number[];
}

// Component Props
export interface PromotionFormProps {
  formData: PromotionFormData;
  setFormData: React.Dispatch<React.SetStateAction<PromotionFormData>>;
  products: Product[];
  isPending: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}

export interface AddPromotionModalProps {
  products: Product[];
  onClose: () => void;
  onSuccess: () => void;
}

export interface EditPromotionModalProps {
  promotion: Promotion;
  products: Product[];
  onClose: () => void;
  onSuccess: () => void;
}

export interface DeleteConfirmModalProps {
  isOpen: boolean;
  itemName: string;
  onClose: () => void;
  onConfirm: () => void;
  subject: string;
}

export interface PromotionCardProps {
  promotion: Promotion;
  onEdit: (promotion: Promotion) => void;
  onDelete: (promotion: Promotion) => void;
  disabled: boolean;
}
  
  export interface Product {
    produkId: number;
    nama: string;
    harga: number;
    hargaModal: number;
    stok: number;
    image: string;
    minimumStok: number;
    statusStok: string;
    kategoriId: number;
    isDeleted: boolean;
  }
  
  export interface PromotionProduct {
    id: number;
    promotionId: number;
    produkId: number;
    activeUntil?: Date;
    produk: Product;
  }
  
  export interface ServerResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
  }