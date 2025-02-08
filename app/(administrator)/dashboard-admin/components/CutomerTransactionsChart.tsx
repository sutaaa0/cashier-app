import React, { useState } from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Users, Crown, Sparkles, TrendingUp } from 'lucide-react';

const COLORS = ['#FF6B6B', '#4ECDC4'];

const customerTransactions = [
  { 
    name: "Regular", 
    value: 60,
    transactions: 1200,
    growth: "+8%",
    icon: Users 
  },
  { 
    name: "Member", 
    value: 40,
    transactions: 800,
    growth: "+15%",
    icon: Crown 
  }
];

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: { name: string; value: number }[] }) => {
  if (active && payload && payload.length) {
    return (
      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-pink-600 to-purple-600 rounded-lg blur opacity-25 group-hover:opacity-100 transition duration-1000 group-hover:duration-200" />
        <div className="relative bg-white border-4 border-black p-4 transform -rotate-2 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="text-yellow-400" size={20} />
            <h3 className="font-black text-xl">{payload[0].name}</h3>
          </div>
          <div className="font-mono bg-black text-white p-2 transform rotate-1">
            {payload[0].value}% OF TOTAL
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export default function CustomerTransactionsChart() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [rotation, setRotation] = useState(0);

  return (
    <div className="relative bg-white border-4 border-black p-6 transition-all duration-300 group">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute transform rotate-45 border-2 border-black"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: '20px',
              height: '20px'
            }}
          />
        ))}
      </div>

      {/* Glowing effect on hover */}
      <div className="absolute -inset-1 bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-600 rounded-lg blur opacity-0 group-hover:opacity-20 transition duration-1000 group-hover:duration-200" />

      {/* Main content container */}
      <div className="relative shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-all duration-300">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="transform -rotate-2 bg-gradient-to-r from-yellow-300 to-yellow-400 border-4 border-black p-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex items-center gap-2">
              <Users className="text-black" size={24} />
              <h2 className="text-2xl font-black tracking-tighter">
                CUSTOMERS
              </h2>
            </div>
          </div>
          <div className="bg-black text-white p-3 transform rotate-3 hover:rotate-6 transition-transform">
            <Crown size={28} />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Chart */}
          <div className="bg-white border-4 border-black p-6 flex items-center justify-center">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={customerTransactions}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  startAngle={90 + rotation}
                  endAngle={450 + rotation}
                  onMouseEnter={(_, index) => {
                    setActiveIndex(index);
                    setRotation(index * 180);
                  }}
                  onMouseLeave={() => {
                    setActiveIndex(null);
                    setRotation(0);
                  }}
                >
                  {customerTransactions.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                      stroke="#000"
                      strokeWidth={3}
                      className={`transition-all duration-300 ${
                        activeIndex === index ? 'opacity-100' : 'opacity-80'
                      }`}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Stats */}
          <div className="space-y-4">
            {customerTransactions.map((customer, index) => (
              <div 
                key={`customer-${index}`}
                className={`
                  relative group/item border-3 border-black p-4
                  transform transition-all duration-300 hover:-translate-y-1
                  ${activeIndex === index ? 'bg-black text-white' : 'bg-white'}
                `}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 border-3 border-black transform rotate-45 transition-transform group-hover/item:rotate-0 flex items-center justify-center"
                    style={{ backgroundColor: COLORS[index] }}
                  >
                    {React.createElement(customer.icon, { 
                      size: 20,
                      className: "transform -rotate-45 group-hover/item:rotate-0 transition-transform"
                    })}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg">{customer.name}</h3>
                    <div className="flex items-center gap-4 mt-1">
                      <span className="font-mono bg-white text-black px-2 py-1 border-2 border-black">
                        {customer.value}%
                      </span>
                      <span className="font-mono">
                        {customer.transactions} TRANS
                      </span>
                      <span className="flex items-center text-green-500 font-bold">
                        <TrendingUp size={16} className="mr-1" />
                        {customer.growth}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="absolute inset-0 border-2 border-black transform translate-x-1 translate-y-1 -z-10" />
              </div>
            ))}
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute -top-2 -right-2 bg-yellow-300 border-2 border-black p-1 transform rotate-12">
          <TrendingUp size={20} />
        </div>
        <div className="absolute -bottom-2 -left-2 bg-pink-400 border-2 border-black p-1 transform -rotate-12">
          <Sparkles size={20} />
        </div>
      </div>
    </div>
  );
}