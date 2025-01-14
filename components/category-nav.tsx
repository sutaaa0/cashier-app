"use client";

import { Cloud, Cookie, Cake, Coffee, Pizza, Sandwich } from "lucide-react";
import { cn } from "@/lib/utils";

interface Category {
  name: string;
  icon: React.ReactNode;
  count: number;
}

const categories: Category[] = [
  { name: "All Menu", icon: <Cloud className="h-11 w-11" />, count: 110 },
  { name: "Breads", icon: <Cookie className="h-11 w-11" />, count: 20 },
  { name: "Cakes", icon: <Cake className="h-11 w-11" />, count: 20 },
  { name: "Donuts", icon: <Coffee className="h-11 w-11" />, count: 20 },
  { name: "Pastries", icon: <Pizza className="h-11 w-11" />, count: 20 },
  { name: "Sandwich", icon: <Sandwich className="h-11 w-11" />, count: 20 },
];

export function CategoryNav({ selected = "All Menu", onSelect }: { selected: string; onSelect: (category: string) => void }) {
  return (
    <div className="flex gap-x-5 p-3 px-12 overflow-x-auto">
      {categories.map((category) => (
        <button
          key={category.name}
          onClick={() => onSelect(category.name)}
          className={cn("flex flex-col items-center min-w-[100px] p-4 rounded-lg transition-colors", selected === category.name ? "border border-primary" : "bg-background hover:bg-muted")}
        >
          <span>{category.icon}</span>
          <span className="text-xl mt-2">{category.name}</span>
          <span className="text-sm text-muted-foreground mt-3">{category.count} Items</span>
        </button>
      ))}
    </div>
  );
}
