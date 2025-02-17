import { DollarSign, TrendingUp, Sparkles, BarChartIcon } from 'lucide-react';

const RevenueByCategoryLoading = () => {
  return (
    <div className="relative bg-white border-4 border-black p-6 transition-all duration-300 group md:col-span-2">
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
          <div className="transform -rotate-2 bg-gradient-to-r from-green-400 to-blue-400 border-4 border-black p-3">
            <div className="flex items-center gap-2 animate-pulse">
              <BarChartIcon size={24} />
              <div className="h-8 w-48 bg-black/10 rounded" />
            </div>
          </div>
          <div className="bg-black text-white p-3 transform rotate-3 animate-bounce">
            <TrendingUp size={28} />
          </div>
        </div>

        {/* Subtitle */}
        <div className="mb-6 transform -rotate-1 inline-block bg-black text-white px-4 py-2 animate-pulse">
          <div className="h-4 w-64 bg-white/20 rounded" />
        </div>

        {/* Loading Chart */}
        <div className="h-[400px] relative border-4 border-black bg-white p-4">
          <div className="h-full w-full flex items-center justify-center">
            <div className="space-y-4 w-full">
              {/* Loading Bars Animation */}
              <div className="flex items-end justify-around w-full h-[300px] gap-4">
                {[...Array(4)].map((_, index) => (
                  <div key={index} className="w-1/5 relative">
                    <div 
                      className="w-full bg-gray-200 border-2 border-black animate-pulse"
                      style={{ 
                        height: `${Math.max(30, Math.random() * 100)}%`,
                        animationDelay: `${index * 0.2}s`
                      }}
                    />
                  </div>
                ))}
              </div>
              {/* Loading X-Axis */}
              <div className="flex justify-around w-full">
                {[...Array(4)].map((_, index) => (
                  <div key={index} className="w-20 h-4 bg-gray-200 rounded animate-pulse" />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Loading Legend */}
        <div className="mt-6 grid grid-cols-2 gap-4">
          {[...Array(4)].map((_, index) => (
            <div
              key={`loading-legend-${index}`}
              className="relative border-3 border-black p-3 bg-white animate-pulse"
            >
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 border-2 border-black transform rotate-45 bg-gray-200" />
                <div className="h-4 w-24 bg-gray-200 rounded" />
                <div className="ml-auto h-4 w-20 bg-gray-200 rounded" />
              </div>
              <div className="absolute inset-0 border-2 border-black transform translate-x-1 translate-y-1 -z-10" />
            </div>
          ))}
        </div>

        {/* Decorative Elements */}
        <div className="absolute -top-2 -right-2 bg-green-400 border-2 border-black p-1 transform rotate-12 animate-bounce">
          <DollarSign size={20} />
        </div>
        <div className="absolute -bottom-2 -left-2 bg-blue-400 border-2 border-black p-1 transform -rotate-12 animate-bounce">
          <Sparkles size={20} />
        </div>
      </div>
    </div>
  );
};

export default RevenueByCategoryLoading;