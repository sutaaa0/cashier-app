"use client"

import { Cloud, Cookie, Cake, Coffee, Pizza, Sandwich } from 'lucide-react'
import { cn } from "@/lib/utils"

interface Category {
  name: string
  icon: React.ReactNode
  color: string
  count: number
}

const categories: Category[] = [
  { 
    name: "All Menu", 
    icon: <Cloud className="h-11 w-11" />, 
    color: "#7aa2f7",
    count: 110 
  },
  { 
    name: "Bread", 
    icon: <Cookie className="h-11 w-11" />, 
    color: "#f7768e",
    count: 20 
  },
  { 
    name: "Cakes", 
    icon: <Cake className="h-11 w-11" />, 
    color: "#ff9e64",
    count: 20 
  },
  { 
    name: "Donuts", 
    icon: <Coffee className="h-11 w-11" />, 
    color: "#73daca",
    count: 20 
  },
  { 
    name: "Pastries", 
    icon: <Pizza className="h-11 w-11" />, 
    color: "#bb9af7",
    count: 20 
  },
  { 
    name: "Sandwich", 
    icon: <Sandwich className="h-11 w-11" />, 
    color: "#7dcfff",
    count: 20 
  },
]


export function CategoryNav({ 
  selected = "All Menu", 
  onSelect 
}: { 
  selected: string
  onSelect: (category: string) => void 
}) {
  return (
    <div className="flex gap-x-5 p-3 px-12 overflow-x-auto justify-center items-center">
      {categories.map((category) => (
        <button
          key={category.name}
          onClick={() => onSelect(category.name)}
          style={{
            backgroundColor: selected === category.name ? category.color : 'white'
          }}
          className={cn(
            // Base styles
            "flex flex-col items-center min-w-[120px] p-4",
            "border-2 border-black",
            "transition-all duration-200",
            "relative",
            // Shadow and hover effects
            "shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]",
            "hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
            "hover:-translate-y-0.5",
            "active:shadow-none",
            "active:translate-y-1",
            // Random rotation for neo-brutalist feel
            "even:-rotate-1",
            "odd:rotate-1",
            // Selected state
            selected === category.name && [
              "transform",
              "-translate-y-0.5",
              "shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
            ]
          )}
        >
          <div className={cn(
            "rounded-full p-3",
            "border-2 border-black",
            "transition-transform",
            "group-hover:scale-110",
            selected === category.name ? "bg-white" : category.color
          )}>
            {category.icon}
          </div>
          <span className="text-xl font-bold mt-3 font-mono">
            {category.name}
          </span>
          <span className={cn(
            "text-sm mt-2 px-2 py-1",
            "border border-black",
            "font-mono",
            selected === category.name ? "bg-black text-white" : "bg-white"
          )}>
            {category.count} Items
          </span>
        </button>
      ))}
    </div>
  )
}

