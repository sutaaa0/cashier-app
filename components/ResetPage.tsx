// FILE: app/(administrator)/dashboard-admin/reset/page.tsx
"use client";
import { useEffect, useState } from "react";
import { SaveIcon, RefreshCwIcon, AlertTriangleIcon } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { QueryClientProvider, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DeleteConfirmModal } from '@/components/DeleteConfirmModal';

function ResetPage() {
  const queryClient = useQueryClient();
  
  // State untuk settings
  const [localSettings, setLocalSettings] = useState({
    autoReset: false,
    scheduleType: "YEARLY", // Default: tahunan
    preserveMasterData: true,
  });
  
  // State untuk tracking perubahan
  const [formIsDirty, setFormIsDirty] = useState(false);
  
  // State untuk modal konfirmasi
  const [resetModal, setResetModal] = useState({
    isOpen: false,
  });
  
  // Query dan mutations
  const {
    data: serverSettings = {
      autoReset: false,
      scheduleType: "YEARLY",
      preserveMasterData: true,
      lastResetDate: null,
      resetDate: null,
    },
    isLoading: isLoadingSettings,
  } = useQuery({
    queryKey: ['resetSettings'],
    queryFn: api.getResetSettings,
  });
  
  // Update state lokal ketika data server tersedia
  useEffect(() => {
    if (serverSettings) {
      setLocalSettings({
        autoReset: serverSettings.autoReset,
        scheduleType: serverSettings.scheduleType,
        preserveMasterData: serverSettings.preserveMasterData,
      });
    }
  }, [serverSettings]);
  
  // Handler untuk perubahan setting
  const handleSettingChange = (name, value) => {
    setLocalSettings(prev => ({
      ...prev,
      [name]: value
    }));
    setFormIsDirty(true);
  };
  
  // Handler untuk simpan pengaturan
  const handleSaveSettings = () => {
    saveSettingsMutation.mutate(localSettings);
  };
  
  // Handler untuk reset manual
  const openResetModal = () => {
    setResetModal({ isOpen: true });
  };
  
  const confirmReset = () => {
    resetManualMutation.mutate({
      preserveMasterData: localSettings.preserveMasterData
    });
    setResetModal({ isOpen: false });
  };
  
  // Render jadwal dalam format yang mudah dibaca
  const renderScheduleText = (type) => {
    switch(type) {
      case "MONTHLY": return "Setiap bulan (tanggal 1)";
      case "YEARLY": return "Setiap tahun (1 Januari)";
      case "BIENNIAL": return "Setiap 2 tahun sekali (1 Januari)";
      case "QUINQUENNIAL": return "Setiap 5 tahun sekali (1 Januari)";
      default: return type;
    }
  };
  
  return (
    <div className="bg-[#F1F6F9] min-h-screen p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 bg-[#6C9BCF] text-white py-3 px-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] border-2 border-black">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold tracking-tight uppercase">RESET DATABASE</h1>
        </div>
        <div className="text-xl font-mono">
          {new Date().toLocaleDateString('id-ID', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}
        </div>
      </div>
      
      {/* Grid untuk panel settings dan reset manual */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Panel Settings */}
        <div className="bg-[#fff] p-5 rounded-none border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]">
          <h2 className="text-2xl font-bold uppercase mb-6 text-black">PENGATURAN RESET DATA</h2>
          
          <div className="space-y-6">
            {/* Auto reset toggle */}
            <div className="flex items-center gap-3 bg-white p-3 border-2 border-black">
              <input 
                type="checkbox" 
                id="autoReset" 
                checked={localSettings.autoReset} 
                onChange={(e) => handleSettingChange('autoReset', e.target.checked)} 
                className="w-6 h-6 border-2 border-black"
              />
              <label htmlFor="autoReset" className="font-bold text-lg">
                AKTIFKAN RESET OTOMATIS
              </label>
            </div>
            
            {/* Jadwal reset */}
            <div className="bg-white p-4 border-2 border-black">
              <label className="block font-bold text-lg mb-2 uppercase">JADWAL RESET</label>
              <select 
                value={localSettings.scheduleType} 
                onChange={(e) => handleSettingChange('scheduleType', e.target.value)} 
                className="border-2 border-black px-3 py-2 w-full font-mono bg-white"
              >
                <option value="MONTHLY">Setiap bulan (tanggal 1)</option>
                <option value="YEARLY">Setiap tahun (1 Januari)</option>
                <option value="BIENNIAL">Setiap 2 tahun sekali (1 Januari)</option>
                <option value="QUINQUENNIAL">Setiap 5 tahun sekali (1 Januari)</option>
              </select>
              
              {serverSettings.resetDate && (
                <p className="mt-3 text-black font-bold">
                  Reset berikutnya dijadwalkan pada: {format(new Date(serverSettings.resetDate), "dd MMMM yyyy", { locale: id })}
                </p>
              )}
            </div>
            
            {/* Opsi penyimpanan data master */}
            <div className="bg-white p-4 border-2 border-black">
              <div className="flex items-center gap-3">
                <input 
                  type="checkbox" 
                  id="preserveMasterData" 
                  checked={localSettings.preserveMasterData} 
                  onChange={(e) => handleSettingChange('preserveMasterData', e.target.checked)} 
                  className="w-6 h-6 border-2 border-black"
                />
                <label htmlFor="preserveMasterData" className="font-bold text-lg">
                  SIMPAN DATA MASTER
                </label>
              </div>
              <p className="mt-2 text-black">
                Jika diaktifkan, reset akan mempertahankan data User, Produk, dan Kategori.
                Semua data transaksi akan dihapus.
              </p>
            </div>
            
            {/* Save settings button */}
            <button
              onClick={handleSaveSettings}
              disabled={!formIsDirty}
              className={`flex items-center justify-center gap-2 w-full p-3 font-bold text-lg border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] transition-transform hover:translate-x-1 hover:translate-y-1 hover:shadow-none ${
                formIsDirty 
                  ? "bg-[#6C9BCF] text-white hover:bg-[#6C9BCF]/90" 
                  : "bg-gray-200 text-gray-600 cursor-not-allowed"
              }`}
            >
              <SaveIcon size={20} />
              <span>SIMPAN PENGATURAN</span>
            </button>
          </div>
        </div>
        
        {/* Reset Manual Panel */}
        <div className="bg-[#fff] p-5 rounded-none border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]">
          <h2 className="text-2xl font-bold uppercase mb-6 text-black">RESET MANUAL</h2>
          
          <div className="bg-red-100 border-2 border-red-500 p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertTriangleIcon size={24} className="text-red-500 mt-1" />
              <div>
                <p className="font-bold text-lg text-red-700">PERINGATAN!</p>
                <p className="text-red-700">
                  Reset database akan menghapus data transaksi. Pastikan untuk melakukan backup sebelum melanjutkan.
                  Tindakan ini tidak dapat dibatalkan.
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 border-2 border-black mb-6">
            <p className="font-bold text-lg uppercase">RESET MANUAL</p>
            <p className="mt-2 text-black">
              Reset manual akan menjalankan reset database saat ini juga.
              Backup otomatis akan dibuat sebelum reset dijalankan.
            </p>
            
            {localSettings.preserveMasterData ? (
              <p className="mt-2 text-black font-bold">
                Mode reset: Hanya data transaksi (data master akan dipertahankan)
              </p>
            ) : (
              <p className="mt-2 text-black font-bold">
                Mode reset: Semua data (termasuk data master)
              </p>
            )}
            
            {serverSettings.lastResetDate && (
              <p className="mt-3 text-black">
                Reset terakhir: {format(new Date(serverSettings.lastResetDate), "dd MMMM yyyy", { locale: id })}
              </p>
            )}
          </div>
          
          <button
            onClick={openResetModal}
            className="flex items-center justify-center gap-3 bg-red-500 text-white border-2 border-black p-4 font-bold text-xl uppercase w-full hover:bg-red-600 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-transform hover:translate-x-1 hover:translate-y-1 hover:shadow-none"
          >
            <RefreshCwIcon size={24} />
            <span>RESET DATABASE SEKARANG</span>
          </button>
        </div>
      </div>
      
      {/* Panduan Reset */}
      <div className="mt-8 bg-[#F1F6F9] p-5 rounded-none border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]">
        <h2 className="text-2xl font-bold uppercase mb-4 text-black">PANDUAN RESET DATABASE</h2>
        
        <div className="bg-[#FFD966] p-4 border-2 border-black">
          <ul className="space-y-3">
            <li className="font-bold text-black">
              <span className="bg-black text-white px-2 py-0.5 mr-2 inline-block">1</span>
              <strong>BACKUP TERLEBIH DAHULU</strong> - Selalu buat backup sebelum melakukan reset
            </li>
            <li className="font-bold text-black">
              <span className="bg-black text-white px-2 py-0.5 mr-2 inline-block">2</span>
              <strong>RESET OTOMATIS</strong> - Aktifkan untuk reset database secara otomatis berdasarkan jadwal
            </li>
            <li className="font-bold text-black">
              <span className="bg-black text-white px-2 py-0.5 mr-2 inline-block">3</span>
              <strong>DATA MASTER</strong> - Pilih apakah data master (User, Produk, Kategori) dipertahankan
            </li>
            <li className="font-bold text-black">
              <span className="bg-black text-white px-2 py-0.5 mr-2 inline-block">4</span>
              <strong>PERIODE TRANSAKSI</strong> - Reset berguna untuk membersihkan data lama dan memulai periode transaksi baru
            </li>
          </ul>
        </div>
      </div>
      
      {/* Modal Konfirmasi */}
      <DeleteConfirmModal 
        isOpen={resetModal.isOpen}
        onClose={() => setResetModal({ isOpen: false })}
        onConfirm={confirmReset}
        subject="Database"
        itemName={localSettings.preserveMasterData ? "data transaksi" : "SEMUA data"}
        customMessage="Tindakan ini tidak dapat dibatalkan. Backup otomatis akan dibuat sebelum reset."
      />
    </div>
  );
}

export default ResetPage;