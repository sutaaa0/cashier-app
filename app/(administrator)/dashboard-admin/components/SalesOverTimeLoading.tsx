import { TrendingUp, Sparkles, LineChart as LineChartIcon } from 'lucide-react';

const SalesOverTimeLoading = () => {
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

      {/* Main Content */}
      <div className="relative shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="transform -rotate-2 bg-gradient-to-r from-yellow-300 to-yellow-400 border-4 border-black p-3">
            <div className="flex items-center gap-2 animate-pulse">
              <LineChartIcon size={24} />
              <div className="h-8 w-48 bg-black/10 rounded" />
            </div>
          </div>
          <div className="bg-black text-white p-3 transform rotate-3 animate-bounce">
            <TrendingUp size={28} />
          </div>
        </div>

        {/* Loading Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {[...Array(2)].map((_, index) => (
            <div key={`stat-${index}`} className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-pink-600 to-purple-600 rounded-lg blur opacity-25 animate-pulse" />
              <div className="relative bg-white border-4 border-black p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                    <div className="h-8 w-32 bg-gray-200 rounded mt-2 animate-pulse" />
                  </div>
                  <div className="p-2 bg-gray-200 border-2 border-black transform rotate-3">
                    <div className="w-6 h-6 bg-black/10 rounded" />
                  </div>
                </div>
                <div className="mt-2 flex items-center">
                  <div className="w-4 h-4 bg-gray-200 rounded animate-pulse" />
                  <div className="ml-1 h-4 w-16 bg-gray-200 rounded animate-pulse" />
                </div>
                <div className="absolute inset-0 border-2 border-black transform translate-x-1 translate-y-1 -z-10" />
              </div>
            </div>
          ))}
        </div>

        {/* Loading Chart */}
        <div className="relative bg-white border-4 border-black p-6">
          <div className="h-[400px] flex items-center justify-center">
            <div className="w-full space-y-4">
              {/* Loading Chart Lines */}
              <div className="relative h-[300px] w-full">
                {[...Array(2)].map((_, index) => (
                  <div 
                    key={`line-${index}`}
                    className="absolute bottom-0 left-0 w-full h-1/2 animate-pulse"
                    style={{
                      height: `${30 + Math.random() * 40}%`,
                      backgroundImage: `linear-gradient(180deg, ${index === 0 ? '#FF6B6B' : '#4ECDC4'}00 70%, ${index === 0 ? '#FF6B6B' : '#4ECDC4'}66)`,
                      animationDelay: `${index * 0.3}s`
                    }}
                  />
                ))}
                
                {/* Fake Data Points */}
                {[...Array(6)].map((_, i) => (
                  <div 
                    key={`data-point-${i}`}
                    className="absolute w-4 h-4 bg-white border-2 border-black rounded-full animate-pulse"
                    style={{
                      left: `${(i * 20) + 3}%`,
                      bottom: `${20 + Math.random() * 60}%`,
                      animationDelay: `${i * 0.2}s`
                    }}
                  />
                ))}
              </div>
              
              {/* Loading X-Axis */}
              <div className="flex justify-between w-full">
                {[...Array(6)].map((_, i) => (
                  <div key={`x-label-${i}`} className="w-20 h-6 bg-gray-200 rounded animate-pulse" />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Loading Metrics */}
        <div className="mt-6 grid grid-cols-2 gap-4">
          {[...Array(2)].map((_, index) => (
            <div
              key={`metric-${index}`}
              className="relative group/item border-3 border-black p-3"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 border-3 border-black transform rotate-45 bg-gray-200 animate-pulse"
                />
                <div className="h-6 w-24 bg-gray-200 rounded animate-pulse" />
                <div className="ml-auto h-6 w-20 bg-gray-200 rounded animate-pulse" />
              </div>
              <div className="absolute inset-0 border-2 border-black transform translate-x-1 translate-y-1 -z-10" />
            </div>
          ))}
        </div>

        {/* Decorative Elements */}
        <div className="absolute -top-2 -right-2 bg-yellow-300 border-2 border-black p-1 transform rotate-12 animate-bounce">
          <TrendingUp size={20} />
        </div>
        <div className="absolute -bottom-2 -left-2 bg-pink-400 border-2 border-black p-1 transform -rotate-12 animate-bounce">
          <Sparkles size={20} />
        </div>
      </div>
    </div>
  );
};

export default SalesOverTimeLoading;