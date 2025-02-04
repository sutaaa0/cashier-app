import { Users, ShoppingBag, UsersIcon as Customers, FileText, Package, BarChart, Settings, BarChart2, LayoutDashboardIcon, CalendarRange, Tag } from 'lucide-react'

const menuItems = [
  { id: 'users', label: 'Users', icon: Users },
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboardIcon },
  { id: 'products', label: 'Products', icon: ShoppingBag },
  { id: 'categories', label: 'Categories', icon: Tag },
  { id: 'customers', label: 'Customers', icon: Customers },
  { id: 'transactions', label: 'Transactions', icon: FileText },
  { id: 'stock', label: 'Stock', icon: Package },
  { id: 'promotion', label: 'Promotion', icon:  CalendarRange },
  { id: 'reports', label: 'Reports', icon: BarChart },
  { id: 'analytics', label: 'Analytics', icon: BarChart2 },
  { id: 'settings', label: 'Settings', icon: Settings },
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
        </ul>
      </nav>
    </aside>
  )
}

