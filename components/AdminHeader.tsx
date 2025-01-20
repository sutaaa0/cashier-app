export function AdminHeader() {
  return (
    <header className="bg-black text-white p-4 flex items-center justify-between border-b-4 border-white">
      <div className="flex items-center space-x-4">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
      </div>
      <button className="px-4 py-2 bg-white text-black font-bold border-2 border-white hover:bg-black hover:text-white transition-colors">
        Logout
      </button>
    </header>
  )
}

