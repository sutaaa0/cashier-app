import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, LabelList, Tooltip } from "recharts";
import { Users, Crown } from 'lucide-react';
import { getCustomerTransactionsAnalytic } from '@/server/actions';
import CustomerTransactionsLoading from './CustomerTransactionsLoading';

const COLORS = ['#FF6B6B', '#4ECDC4'];

const CustomerTransactionsChart = () => {
  const [isLoading, setIsLoading] = useState(true);
  interface CustomerTransaction {
    name: string;
    value: number;
    transactions: number;
    growth: string;
    icon: React.ForwardRefExoticComponent<React.SVGProps<SVGSVGElement>>;
    growthColor: string;
  }
  
  const [customerTransactions, setCustomerTransactions] = useState<CustomerTransaction[]>([]);
  const [barData, setBarData] = useState<{ name: string; Regular: number; Premium: number }[]>([]);

  useEffect(() => {
    const fetchDataTransactions = async () => {
      try {
        setIsLoading(true);
        const res = await getCustomerTransactionsAnalytic();
        const data = res.map(item => ({
          ...item,
          icon: item.name === 'Regular' ? Users : Crown,
          growthColor: parseFloat(item.growth) >= 0 ? 'text-green-500' : 'text-red-500'
        }));
        setCustomerTransactions(data);
        setBarData([
          { name: "Percentage", Regular: data[0].value, Premium: data[1].value },
          { name: "Transactions", Regular: data[0].transactions, Premium: data[1].transactions },
          { name: "Growth", Regular: parseFloat(data[0].growth), Premium: parseFloat(data[1].growth) }
        ]);
      } catch (error) {
        console.error('Error fetching customer transactions:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDataTransactions();
  }, []);

  if (isLoading) return <CustomerTransactionsLoading />;

  return (
    <div className="relative bg-white border-4 border-black p-6 transition-all duration-300 group">
      <div className="absolute -inset-1 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 rounded-lg blur opacity-0 group-hover:opacity-20 transition duration-1000 group-hover:duration-200" />
      <div className="relative shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-all duration-300 p-4">
        <h2 className="text-2xl font-black tracking-tighter flex items-center gap-2 transform -rotate-2 bg-gradient-to-r from-blue-400 to-purple-400 border-4 border-black p-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <Users size={24} /> CUSTOMER ANALYTICS
        </h2>
        <div className="h-[400px] relative border-4 border-black bg-white p-4 mt-6">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart layout="vertical" data={barData}>
              <XAxis type="number" stroke="#000" strokeWidth={2} tick={{ fill: '#000', fontWeight: 'bold' }} />
              <YAxis dataKey="name" type="category" stroke="#000" strokeWidth={2} tick={{ fill: '#000', fontWeight: 'bold' }} />
              <Tooltip />
              <Bar dataKey="Regular" fill={COLORS[0]} stroke="#000" strokeWidth={2}>
                <LabelList dataKey="Regular" position="right" fill="#000" fontWeight="bold" />
              </Bar>
              <Bar dataKey="Premium" fill={COLORS[1]} stroke="#000" strokeWidth={2}>
                <LabelList dataKey="Premium" position="right" fill="#000" fontWeight="bold" />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-4">
          {customerTransactions.map((customer, index) => (
            <div key={index} className="relative group/item border-3 border-black p-3 transform transition-all duration-300 bg-white hover:-translate-y-1">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 border-2 border-black transform rotate-45 transition-transform group-hover/item:rotate-0" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                <span className="font-bold">{customer.name}</span>
                <span className="ml-auto font-mono bg-white text-black px-2 py-1 border-2 border-black">
                  {customer.transactions}
                </span>
                <span className={`ml-2 font-bold ${customer.growthColor}`}>{customer.growth}</span>
              </div>
              <div className="absolute inset-0 border-2 border-black transform translate-x-1 translate-y-1 -z-10" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CustomerTransactionsChart;
