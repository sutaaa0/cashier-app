import React from 'react'
import { Users, Crown, Sparkles, TrendingUp } from 'lucide-react'

const CustomerTransactionsLoading = () => {
  return (
    <div className="relative bg-white border-4 border-black p-6 transition-all duration-300 group">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute transform rotate-45 border-2 border-black animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: '20px',
              height: '20px'
            }}
          />
        ))}
      </div>

      {/* Main content container */}
      <div className="relative shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="transform -rotate-2 bg-gradient-to-r from-yellow-300 to-yellow-400 border-4 border-black p-3">
            <div className="flex items-center gap-2 animate-pulse">
              <Users className="text-black" size={24} />
              <div className="h-8 w-32 bg-black/10 rounded" />
            </div>
          </div>
          <div className="bg-black text-white p-3 transform rotate-3 animate-bounce">
            <Crown size={28} />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Loading Chart */}
          <div className="bg-white border-4 border-black p-6 flex items-center justify-center min-h-[400px]">
            <div className="relative animate-pulse">
              {/* Circular loading animation */}
              <div className="w-40 h-40 border-8 border-black rounded-full relative animate-spin-slow">
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <Crown size={32} className="text-yellow-400" />
                </div>
              </div>
              <div className="mt-4 transform -rotate-2 bg-black text-white p-2 font-bold text-center">
                LOADING DATA...
              </div>
            </div>
          </div>

          {/* Loading Stats */}
          <div className="space-y-4">
            {[...Array(2)].map((_, index) => (
              <div 
                key={`loading-${index}`}
                className="relative border-3 border-black p-4 bg-white animate-pulse"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 border-3 border-black transform rotate-45 bg-gray-200" />
                  <div className="flex-1">
                    <div className="h-6 w-24 bg-gray-200 rounded mb-2" />
                    <div className="flex items-center gap-4">
                      <div className="h-6 w-16 bg-gray-200 rounded" />
                      <div className="h-6 w-24 bg-gray-200 rounded" />
                      <div className="h-6 w-16 bg-gray-200 rounded" />
                    </div>
                  </div>
                </div>
                <div className="absolute inset-0 border-2 border-black transform translate-x-1 translate-y-1 -z-10" />
              </div>
            ))}
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute -top-2 -right-2 bg-yellow-300 border-2 border-black p-1 transform rotate-12 animate-bounce">
          <TrendingUp size={20} />
        </div>
        <div className="absolute -bottom-2 -left-2 bg-pink-400 border-2 border-black p-1 transform -rotate-12 animate-bounce">
          <Sparkles size={20} />
        </div>
      </div>
    </div>
  )
}

export default CustomerTransactionsLoading