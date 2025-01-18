"use client"

import { useState } from 'react'
import { Save, Store, Globe, Palette } from 'lucide-react'

interface AppSettingsData {
  storeName: string
  currency: string
  language: string
  theme: string
}

const initialSettings: AppSettingsData = {
  storeName: 'My Cafe',
  currency: 'USD',
  language: 'English',
  theme: 'Light',
}

export function AppSettings() {
  const [settings, setSettings] = useState<AppSettingsData>(initialSettings)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setSettings(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Settings saved:', settings)
  }

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-black">APP SETTINGS</h2>
      <form onSubmit={handleSubmit} className="space-y-4 max-w-xl">
        <div className="space-y-4">
          <div className="bg-white border-[3px] border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex items-center gap-2 mb-2">
              <Store size={20} />
              <label className="font-bold">Store Name</label>
            </div>
            <input
              type="text"
              name="storeName"
              value={settings.storeName}
              onChange={handleChange}
              className="w-full p-2 border-[3px] border-black focus:outline-none focus:ring-2 focus:ring-[#93B8F3]"
            />
          </div>

          <div className="bg-white border-[3px] border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex items-center gap-2 mb-2">
              <Globe size={20} />
              <label className="font-bold">Currency & Language</label>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <select
                name="currency"
                value={settings.currency}
                onChange={handleChange}
                className="p-2 border-[3px] border-black focus:outline-none focus:ring-2 focus:ring-[#93B8F3]"
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="JPY">JPY (¥)</option>
              </select>
              <select
                name="language"
                value={settings.language}
                onChange={handleChange}
                className="p-2 border-[3px] border-black focus:outline-none focus:ring-2 focus:ring-[#93B8F3]"
              >
                <option value="English">English</option>
                <option value="Spanish">Spanish</option>
                <option value="French">French</option>
                <option value="Japanese">Japanese</option>
              </select>
            </div>
          </div>

          <div className="bg-white border-[3px] border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex items-center gap-2 mb-2">
              <Palette size={20} />
              <label className="font-bold">Theme</label>
            </div>
            <select
              name="theme"
              value={settings.theme}
              onChange={handleChange}
              className="w-full p-2 border-[3px] border-black focus:outline-none focus:ring-2 focus:ring-[#93B8F3]"
            >
              <option value="Light">Light</option>
              <option value="Dark">Dark</option>
              <option value="System">System</option>
            </select>
          </div>
        </div>

        <button 
          type="submit" 
          className="w-full px-4 py-2 bg-[#93B8F3] font-bold border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all flex items-center justify-center gap-2"
        >
          <Save size={20} />
          Save Settings
        </button>
      </form>
    </div>
  )
}

