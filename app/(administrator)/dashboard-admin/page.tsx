"use client"

import { useState } from 'react'
import { TransactionManagement } from './components/TransactionManagement'
import { StockManagement } from './components/StockManagement'
import { AppSettings } from './components/AppSettings'
import { AnalyticsPage } from './components/AnalyticsPage'
import { UserManagement } from '@/components/UserManagement'
import { CustomerManagement } from '@/components/CustomerManagement'
import { ReportManagement } from './components/RepostManagement'
import { AdminHeader } from '@/components/AdminHeader'
import { AdminSidebar } from '@/components/AdminSidebar'
import { ProductManagement } from '@/components/ProductManagement'

export default function AdminDashboard() {
  const [activeSection, setActiveSection] = useState('users')

  const renderSection = () => {
    switch (activeSection) {
      case 'users':
        return <UserManagement />
      case 'products':
        return <ProductManagement />
      case 'customers':
        return <CustomerManagement />
      case 'transactions':
        return <TransactionManagement />
      case 'stock':
        return <StockManagement />
      case 'reports':
        return <ReportManagement />
      case 'analytics':
        return <AnalyticsPage />
      case 'settings':
        return <AppSettings />
      default:
        return <UserManagement />
    }
  }

  return (
    <div className="min-h-screen bg-[#E8F1FE] font-mono">
      <AdminHeader />
      <div className="flex">
        <AdminSidebar activeSection={activeSection} setActiveSection={setActiveSection} />
        <main className="flex-1 p-8">
          {renderSection()}
        </main>
      </div>
    </div>
  )
}

