"use client";

import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { formatRupiah } from "@/lib/formatIdr";
import { Produk } from "@prisma/client";
import { Badge } from "./ui/badge";

interface ProductGridProps {
  products: (Produk & { image: string })[];
  onProductSelect: (product: Produk & { image: string }) => void;
}

export function ProductGrid({ products, onProductSelect }: ProductGridProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-7 p-7">
      {products.map((product) => (
        <Card key={product.produkId} className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => onProductSelect(product)}>
          <CardContent className="p-4">
            <div className="aspect-square relative mb-4">
              <Image src={product.image} alt={product.nama} width={300} height={300} priority className="w-full h-full object-cover rounded-lg" />
            </div>
            <div className="space-y-2">
              <h3 className="font-medium">{product.nama}</h3>
              <div className="flex items-center justify-between">
                <Badge variant="secondary">{product.kategori}</Badge>
                <span className="font-bold">{formatRupiah(product.harga)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
