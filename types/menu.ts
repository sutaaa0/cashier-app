export interface Produk {
    id: string
    name: string
    price: number
    category: 'Sandwich' | 'Pastry' | 'Bread' | 'Cake' | 'Donut' | 'Tart' | 'Cookie'
    image: string
  }
  
  export interface OrderItem extends Produk {
    quantity: number
  }
  
  export interface Order {
    id: string
    items: OrderItem[]
    tableNumber?: string
    orderType?: string
    total: number
    tax: number
  }
  
  