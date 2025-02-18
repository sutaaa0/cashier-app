import React from 'react';
import { Users, BarChart2, Zap } from 'lucide-react';

const CustomerTransactionsLoading: React.FC = () => {
  return (
    <div className="relative bg-white border-4 border-black p-6 transition-all duration-300 group">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="absolute transform rotate-12 border border-black"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: "30px",
              height: "30px",
              borderRadius: "50%"
            }}
          />
        ))}
      </div>

      {/* Main content container */}
      <div className="relative shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all duration-300">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="transform -rotate-2 bg-gradient-to-r from-blue-300 to-purple-400 border-4 border-black p-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex items-center gap-2">
              <Users className="text-black" size={24} />
              <h2 className="text-2xl font-black tracking-tighter">CUSTOMER ANALYTICS</h2>
            </div>
          </div>
          <div className="bg-black text-white p-3 transform rotate-3 transition-transform">
            <BarChart2 size={28} />
          </div>
        </div>

        {/* Shimmer Total Transactions */}
        <div className="flex items-center justify-center mb-6 bg-white border-4 border-black p-4 transform -rotate-1">
          <div className="h-8 w-24 bg-gray-200 animate-pulse rounded"></div>
          <div className="h-6 w-40 bg-gray-200 animate-pulse rounded ml-4"></div>
        </div>

        {/* Shimmer Chart */}
        <div className="bg-white border-4 border-black p-6">
          <div className="h-[250px] w-full bg-gray-100 relative overflow-hidden">
            <div className="absolute inset-0 flex flex-col justify-end">
              {/* Shimmer bars */}
              <div className="flex items-end h-full w-full justify-around pb-10">
                <div className="h-[40%] w-[15%] bg-gray-200 animate-pulse rounded-t-lg"></div>
                <div className="h-[60%] w-[15%] bg-gray-200 animate-pulse rounded-t-lg"></div>
              </div>
              {/* Shimmer axes */}
              <div className="absolute bottom-0 left-0 right-0 h-2 bg-gray-300"></div>
              <div className="absolute top-0 bottom-0 left-0 w-2 bg-gray-300"></div>
            </div>
          </div>
        </div>

        {/* Shimmer Customer Type List */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {[0, 1].map((index) => (
            <div
              key={`shimmer-${index}`}
              className="relative border-3 border-black p-3 bg-white"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 border-3 border-black bg-gray-200 animate-pulse"></div>
                <div className="h-6 w-24 bg-gray-200 animate-pulse rounded"></div>
                <div className="ml-auto flex items-center gap-2">
                  <div className="h-6 w-20 bg-gray-200 animate-pulse rounded"></div>
                  <div className="h-6 w-12 bg-gray-200 animate-pulse rounded"></div>
                </div>
              </div>
              <div className="absolute inset-0 border-2 border-black transform translate-x-1 translate-y-1 -z-10"></div>
            </div>
          ))}
        </div>

        {/* Decorative elements */}
        <div className="absolute -top-2 -right-2 bg-blue-300 border-2 border-black p-1 transform rotate-12">
          <Zap size={20} />
        </div>
        <div className="absolute -bottom-2 -left-2 bg-purple-400 border-2 border-black p-1 transform -rotate-12">
          <BarChart2 size={20} />
        </div>
      </div>
    </div>
  );
};

export default CustomerTransactionsLoading;