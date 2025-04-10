import BackupBtn from '@/app/(administrator)/dashboard-admin/components/BackupBtn'
import { Users, ShoppingBag, UsersIcon as Customers, FileText, Package, BarChart, BarChart2, LayoutDashboardIcon, CalendarRange, Tag } from 'lucide-react'

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboardIcon },
  { id: 'users', label: 'Pengguna', icon: Users },
  { id: 'products', label: 'Produk', icon: ShoppingBag },
  { id: 'categories', label: 'Kategori', icon: Tag },
  { id: 'member', label: 'Member', icon: Customers },
  { id: 'transactions', label: 'Transaksi', icon: FileText },
  { id: 'stock', label: 'Stok', icon: Package },
  { id: 'promotion', label: 'Promosi', icon:  CalendarRange },
  { id: 'reports', label: 'Laporan', icon: BarChart },
  { id: 'analytics', label: 'Analisis', icon: BarChart2 },
]

interface AdminSidebarProps {
  activeSection: string
  setActiveSection: (section: string) => void
}

export function AdminSidebar({ activeSection, setActiveSection }: AdminSidebarProps) {
  return (
    <aside className="w-64 bg-white border-r-[3px] border-black h-[calc(100vh-72px)]">
      <nav className="p-4">
        <ul className="space-y-3">
          {menuItems.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => setActiveSection(item.id)}
                className={`w-full flex items-center space-x-3 p-3 border-[3px] border-black font-bold transition-all
                  ${activeSection === item.id 
                    ? 'bg-[#93B8F3] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] translate-x-[2px] translate-y-[2px]' 
                    : 'bg-white hover:bg-[#93B8F3] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                  }`}
              >
                <item.icon size={20} />
                <span>{item.label}</span>
              </button>
            </li>
          ))}
          <BackupBtn/>
        </ul>
      </nav>
    </aside>
  )
}

