"use client"

import { useState } from 'react'
import { User, Trash2, Edit, Plus, Star } from 'lucide-react'

interface CustomerData {
  id: number
  name: string
  email: string
  points: number
  joinDate: string
}

const mockCustomers: CustomerData[] = [
  { id: 1, name: 'Alice Johnson', email: 'alice@example.com', points: 150, joinDate: '2023-01-15' },
  { id: 2, name: 'Bob Williams', email: 'bob@example.com', points: 75, joinDate: '2023-02-20' },
  { id: 3, name: 'Charlie Brown', email: 'charlie@example.com', points: 200, joinDate: '2023-03-10' },
]

export function CustomerManagement() {
  const [customers, setCustomers] = useState<CustomerData[]>(mockCustomers)

  const handleDeleteCustomer = (id: number) => {
    setCustomers(customers.filter(customer => customer.id !== id))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-black">CUSTOMER MANAGEMENT</h2>
        <button className="px-4 py-2 bg-[#93B8F3] font-bold border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all flex items-center gap-2">
          <Plus size={20} />
          Add New Customer
        </button>
      </div>
      <div className="grid gap-4">
        {customers.map(customer => (
          <div key={customer.id} className="bg-white border-[3px] border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-[#93B8F3] border-[3px] border-black">
                  <User size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-lg">{customer.name}</h3>
                  <p className="text-sm">{customer.email}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="inline-block px-2 py-1 bg-black text-white text-sm">
                      Join: {customer.joinDate}
                    </span>
                    <span className="inline-flex items-center px-2 py-1 bg-[#93B8F3] border-[3px] border-black text-sm font-bold">
                      <Star size={16} className="mr-1" />
                      {customer.points} points
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="p-2 bg-[#93B8F3] border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all">
                  <Edit size={20} />
                </button>
                <button 
                  onClick={() => handleDeleteCustomer(customer.id)}
                  className="p-2 bg-white border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all hover:bg-red-500 hover:text-white"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

