'use client'

import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { MenuItem } from "@/types/menu"

interface ProductGridProps {
  products: MenuItem[]
  onSelect: (product: MenuItem) => void
}

export function ProductGrid({ products, onSelect }:  ProductGridProps ) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-7 p-7">
      {products.map((product) => (
        <Card 
          key={product.id}
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => onSelect(product)}
        >
          <CardContent className="p-4">
            <div className="aspect-square relative mb-4">
              <Image
                src={product.image}
                alt={product.name}
                fill
                className="object-cover rounded-lg"
              />
            </div>
            <div className="space-y-2">
              <h3 className="font-medium">{product.name}</h3>
              <div className="flex items-center justify-between">
                <Badge variant="secondary">{product.category}</Badge>
                <span className="font-bold">${product.price.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

