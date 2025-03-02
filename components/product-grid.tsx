import { Produk, Promotion } from "@prisma/client";
import { NeoProductCard } from "./ProductCard";

interface ProductGridProps {
  products: (Produk & {
    image: string;
    kategori: { 
      nama: string; 
      kategoriId: number 
    };
    // Updated to match database schema
    promotionProducts?: {
      promotionId: number;
      promotion: Promotion;
    }[];
  })[];
  onProductSelect: (product: Produk & {
    image: string;
    kategori: { nama: string, kategoriId: number };
    harga: number;
  }) => void;
}

export function ProductGrid({ products, onProductSelect }: ProductGridProps) {
  console.log("produk", products);
  
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 p-8">
      {products.map((product) => (
        <div key={product.produkId} className="transform odd:rotate-1 even:-rotate-1 hover:z-10">
          <NeoProductCard
            product={product}
            onClick={onProductSelect}
          />
        </div>
      ))}
    </div>
  );
}