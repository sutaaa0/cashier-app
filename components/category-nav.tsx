"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { getCategoryCounts } from "@/server/actions";
import Image from "next/image";
import { getDynamicColor } from "@/lib/colors";

// Interface for the category data from server
interface CategoryCount {
  kategori: string;
  icon: string;
  _count: {
    produkId: number;
  };
}

// Interface for processed category with UI properties
interface FetchedCategory {
  name: string;
  icon: string;
  color: string;
  count: number;
}

export function CategoryNav({ 
  selected = "All Menu", 
  onSelect 
}: { 
  selected: string; 
  onSelect: (category: string) => void 
}) {
  const [fetchedCategories, setFetchedCategories] = useState<FetchedCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { categoryCounts, totalCount } = await getCategoryCounts();
        
        // Create categories array starting with All Menu
        const categories: FetchedCategory[] = [
          {
            name: "All Menu",
            icon: "",  // Empty string as we'll use Cloud icon
            color: "#7aa2f7",
            count: totalCount,
          }
        ];

        // Add categories from database
        categoryCounts.forEach((item: CategoryCount) => {
          categories.push({
            name: item.kategori,
            icon: item.icon,
            color: getDynamicColor(item.kategori),
            count: item._count.produkId,
          });
        });

        setFetchedCategories(categories);
      } catch (error) {
        console.error("Error fetching categories:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="flex gap-x-5 p-3 px-12 overflow-x-auto justify-center items-center">
      {fetchedCategories.map((category) => (
        <button
          key={category.name}
          onClick={() => onSelect(category.name)}
          style={{
            backgroundColor: selected === category.name ? category.color : "white",
          }}
          className={cn(
            "flex flex-col items-center min-w-[120px] p-4",
            "border-2 border-black",
            "transition-all duration-200",
            "relative",
            "shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]",
            "hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
            "hover:-translate-y-0.5",
            "active:shadow-none",
            "active:translate-y-1",
            "even:-rotate-1",
            "odd:rotate-1",
            selected === category.name && [
              "transform",
              "-translate-y-0.5",
              "shadow-[2px_2px_0px_0px_rgba(0,0,1)]"
            ]
          )}
        >
          <div 
            className={cn(
              "rounded-full p-3",
              "border-2 border-black",
              "transition-transform",
              "group-hover:scale-110",
              selected === category.name ? "bg-white" : category.color
            )}
          >
            {category.name === "All Menu" ? (
              <Image 
                src={"/allmenu.png"}
                alt="All Menu"
                width={60}
                height={60} 
              />
            ) : (
              <Image 
                src={category.icon}
                alt={category.name}
                width={60}
                height={60}  
                
              />
            )}
          </div>
          <span className="text-xl font-bold mt-3 font-mono">
            {category.name}
          </span>
          <span 
            className={cn(
              "text-sm mt-2 px-2 py-1",
              "border border-black",
              "font-mono",
              selected === category.name ? "bg-black text-white" : "bg-white"
            )}
          >
            {isLoading ? "..." : `${category.count} Items`}
          </span>
        </button>
      ))}
    </div>
  );
}