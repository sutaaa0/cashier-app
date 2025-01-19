"use client"

import { useState } from 'react'
import { BarChart, Download, Calendar, TrendingUp, DollarSign, Users } from 'lucide-react'

interface ReportData {
  id: number
  name: string
  period: string
  type: 'sales' | 'inventory' | 'customers'
  generatedDate: string
  summary: string
}

const mockReports: ReportData[] = [
  { 
    id: 1, 
    name: 'Monthly Sales Report', 
    period: 'June 2023', 
    type: 'sales',
    generatedDate: '2023-07-01',
    summary: 'Total Sales: $5,234.50 | Orders: 142'
  },
  { 
    id: 2, 
    name: 'Inventory Status', 
    period: 'Q2 2023', 
    type: 'inventory',
    generatedDate: '2023-07-02',
    summary: 'Items: 45 | Low Stock: 3'
  },
  { 
    id: 3, 
    name: 'Customer Analytics', 
    period: 'May 2023', 
    type: 'customers',
    generatedDate: '2023-06-01',
    summary: 'New Members: 24 | Total Points: 1,250'
  },
]

export function ReportManagement() {
  const [reports, setReports] = useState<ReportData[]>(mockReports)

  const getReportIcon = (type: string) => {
    switch (type) {
      case 'sales':
        return <DollarSign size={24} />
      case 'inventory':
        return <TrendingUp size={24} />
      case 'customers':
        return <Users size={24} />
      default:
        return <BarChart size={24} />
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-black">REPORTS & ANALYTICS</h2>
        <button className="px-4 py-2 bg-[#93B8F3] font-bold border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all flex items-center gap-2">
          <BarChart size={20} />
          Generate Report
        </button>
      </div>
      <div className="grid gap-4">
        {reports.map(report => (
          <div key={report.id} className="bg-white border-[3px] border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-[#93B8F3] border-[3px] border-black">
                  {getReportIcon(report.type)}
                </div>
                <div>
                  <h3 className="font-bold text-lg">{report.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="flex items-center text-sm">
                      <Calendar size={16} className="mr-1" />
                      Period: {report.period}
                    </span>
                  </div>
                  <p className="text-sm mt-1">{report.summary}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="p-2 bg-[#93B8F3] border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all">
                  <Download size={20} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

