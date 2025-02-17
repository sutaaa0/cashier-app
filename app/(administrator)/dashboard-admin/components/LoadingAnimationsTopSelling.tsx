import { Coffee } from 'lucide-react'

const LoadingAnimationsTopSelling = () => {
  return (
    <div className="relative bg-white border-4 border-black p-6">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        {[...Array(10)].map((_, i) => (
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
              <Coffee className="text-black" size={24} />
              <div className="h-8 w-32 bg-black/10 rounded" />
            </div>
          </div>
          <div className="bg-black text-white p-3 transform rotate-3 animate-bounce">
            <Coffee size={28} />
          </div>
        </div>

        {/* Loading Chart Skeleton */}
        <div className="bg-white border-4 border-black p-6">
          <div className="h-[300px] w-full flex items-center justify-center">
            <div className="relative">
              {/* Animated Coffee Cup */}
              <div className="animate-spin-slow">
                <Coffee size={48} className="text-yellow-400" />
              </div>
              {/* Loading Text */}
              <div className="mt-4 transform -rotate-2 bg-black text-white p-2 font-bold animate-pulse">
                BREWING DATA...
              </div>
            </div>
          </div>
        </div>

        {/* Loading Product List */}
        <div className="mt-6 space-y-4">
          {[...Array(5)].map((_, index) => (
            <div 
              key={index}
              className="relative border-3 border-black p-3 bg-white animate-pulse"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 border-3 border-black transform rotate-45"
                />
                <div className="h-6 w-32 bg-black/10 rounded" />
                <div className="ml-auto flex items-center gap-2">
                  <div className="h-6 w-24 bg-black/10 rounded" />
                  <div className="h-6 w-16 bg-black/10 rounded" />
                </div>
              </div>
              <div className="absolute inset-0 border-2 border-black transform translate-x-1 translate-y-1 -z-10" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default LoadingAnimationsTopSelling