"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/header";
import { CategoryNav } from "@/components/category-nav";
import { ProductGrid } from "@/components/product-grid";
import { OrderSummary } from "@/components/order-summary";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import type { MenuItem, Order, OrderItem } from "@/types/menu";
import { toast } from "@/hooks/use-toast";

const generateOrderNumber = () => {
  return Math.floor(Math.random() * 900 + 100).toString();
};

const Pos = () => {
  const [selectedCategory, setSelectedCategory] = useState("All Menu");
  const [searchQuery, setSearchQuery] = useState("");
  const [order, setOrder] = useState<Order>({
    id: "000",
    items: [],
    total: 0,
    tax: 0,
  });

  useEffect(() => {
    setOrder(prev => ({
      ...prev,
      id: generateOrderNumber()
    }));
  }, []);

  const products: MenuItem[] = [
    {
      id: "1",
      name: "kue kering",
      price: 5.5,
      category: "Cookie",
      image: "/cookies1.png",
    },
    {
      id: "2",
      name: "Beef Crowich",
      price: 5.5,
      category: "Cookie",
      image: "/cookies1.png",
    },
    {
      id: "3",
      name: "Beef Crowich",
      price: 5.5,
      category: "Cookie",
      image: "/cookies1.png",
    },
  ];

  const addToOrder = (product: MenuItem) => {
    setOrder((prev) => {
      const existingItem = prev.items.find((item) => item.id === product.id);

      let newItems: OrderItem[];
      if (existingItem) {
        newItems = prev.items.map((item) => 
          item.id === product.id 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        );
      } else {
        newItems = [...prev.items, { ...product, quantity: 1 }];
      }

      const total = newItems.reduce((sum, item) => 
        sum + item.price * item.quantity, 0
      );
      const tax = total * 0.1;

      return {
        ...prev,
        items: newItems,
        total,
        tax,
      };
    });
  };

  const handleUpdateQuantity = (itemId: string, newQuantity: number) => {
    setOrder((prevOrder) => {
      const updatedItems = prevOrder.items.map((item) => 
        item.id === itemId 
          ? { ...item, quantity: newQuantity } 
          : item
      );

      const newTotal = updatedItems.reduce((sum, item) => 
        sum + item.price * item.quantity, 0
      );
      const newTax = newTotal * 0.1;

      return {
        ...prevOrder,
        items: updatedItems,
        total: newTotal,
        tax: newTax,
      };
    });
  };

  const handleDeleteItem = (itemId: string) => {
    setOrder((prevOrder) => {
      const updatedItems = prevOrder.items.filter((item) => 
        item.id !== itemId
      );

      const newTotal = updatedItems.reduce((sum, item) => 
        sum + item.price * item.quantity, 0
      );
      const newTax = newTotal * 0.1;

      return {
        ...prevOrder,
        items: updatedItems,
        total: newTotal,
        tax: newTax,
      };
    });
  };

  const handlePlaceOrder = () => {
    if (order.items.length === 0) {
      toast({
        title: "Error",
        description: "Please add items to the order first",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Order Placed",
      description: `Order #${order.id} has been placed successfully. Total: $${order.total.toFixed(2)}`,
    });

    // Reset order with new ID
    setOrder({
      id: generateOrderNumber(),
      items: [],
      total: 0,
      tax: 0,
    });
  };

  const filteredProducts = products.filter((product) => 
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
    (selectedCategory === "All Menu" || product.category === selectedCategory)
  );

  return (
    <div className="h-screen flex flex-col">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 flex flex-col overflow-hidden">
          <CategoryNav selected={selectedCategory} onSelect={setSelectedCategory} />
          <div className="px-4 pb-4">
            <div className="relative">
              <Search className="absolute left-2 top-3 h-6 w-6 text-muted-foreground" />
              <Input
                placeholder="Search something sweet on your mind..."
                className="pl-9 h-12"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="flex-1 overflow-auto">
            <ProductGrid products={filteredProducts} onSelect={addToOrder} />
          </div>
        </div>
        <OrderSummary 
          order={order}
          onUpdateQuantity={handleUpdateQuantity}
          onDeleteItem={handleDeleteItem}
          onPlaceOrder={handlePlaceOrder}
        />
      </div>
    </div>
  );
};

export default Pos;