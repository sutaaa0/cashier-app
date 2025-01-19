"use client"

import { useState } from 'react'
import { User, Trash2, Edit } from 'lucide-react'

interface UserData {
  id: number
  name: string
  role: string
}

const mockUsers: UserData[] = [
  { id: 1, name: 'John Doe', role: 'Cashier' },
  { id: 2, name: 'Jane Smith', role: 'Manager' },
  { id: 3, name: 'Bob Johnson', role: 'Cashier' },
]

export function UserManagement() {
  const [users, setUsers] = useState<UserData[]>(mockUsers)

  const handleDeleteUser = (id: number) => {
    setUsers(users.filter(user => user.id !== id))
  }

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold">User Management</h2>
      <button className="px-4 py-2 bg-black text-white font-bold border-2 border-black hover:bg-white hover:text-black transition-colors">
        Add New User
      </button>
      <div className="grid gap-4">
        {users.map(user => (
          <div key={user.id} className="flex items-center justify-between p-4 bg-white border-2 border-black">
            <div className="flex items-center space-x-4">
              <User size={24} />
              <div>
                <h3 className="font-bold">{user.name}</h3>
                <p>{user.role}</p>
              </div>
            </div>
            <div className="space-x-2">
              <button className="p-2 bg-black text-white hover:bg-white hover:text-black border-2 border-black transition-colors">
                <Edit size={20} />
              </button>
              <button 
                className="p-2 bg-white text-black hover:bg-black hover:text-white border-2 border-black transition-colors"
                onClick={() => handleDeleteUser(user.id)}
              >
                <Trash2 size={20} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

