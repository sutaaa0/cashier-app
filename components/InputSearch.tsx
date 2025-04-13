"use client"

import { Search } from 'lucide-react'
import { useState } from "react"

interface NeoSearchInputProps {
  onSearch: (query: string) => void
}

export function NeoSearchInput({ onSearch }: NeoSearchInputProps) {
  const [searchQuery, setSearchQuery] = useState("")

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    onSearch(searchQuery)
  }

  return (
    <form onSubmit={handleSearch} className="relative w-full max-w-md mx-auto mt-4">
      <input
        type="text"
        placeholder="Cari produk..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-full px-4 py-3 pl-12 pr-10 text-black placeholder-gray-500
                   bg-white border-2 border-black
                   focus:outline-none focus:ring-2 focus:ring-black
                   shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
                   transition-all duration-300
                   hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]
                   font-mono text-lg"
      />
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-6 w-6 text-black" />
      <button
        type="submit"
        className="absolute right-3 top-1/2 transform -translate-y-1/2
                   bg-black text-white px-2 py-1
                   border-2 border-black
                   hover:bg-white hover:text-black
                   transition-colors duration-300
                   font-mono text-sm"
      >
        Search
      </button>
    </form>
  )
}

