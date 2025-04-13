"use client";
import { useState, useEffect, useRef } from "react";
import { RefreshCwIcon, AlertTriangleIcon, ClockIcon, CheckIcon, XIcon, SaveIcon } from "lucide-react";
import { formatDistance, format } from "date-fns";
import { id } from "date-fns/locale";
import { 
  QueryClient, 
  QueryClientProvider, 
  useQuery, 
  useMutation, 
  useQueryClient 
} from '@tanstack/react-query';
import axios from 'axios';

// Create new QueryClient
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // Data considered stale after 1 minute
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      retry: 3,
    },
  },
});

// Tipe data untuk log reset
interface ResetLog {
  filename: string;
  size: number;
  created: string;
  content: string;
  path: string;
}

// Tipe data untuk pengaturan reset
interface ResetSettings {
  confirmationCode: string;
  preserveMasterData: boolean;
}

// Status message type
interface StatusMessage {
  type: string;
  text: string;
}

// API functions with axios
const api = {
  getSettings: async (): Promise<ResetSettings> => {
    const { data } = await axios.get("/api/reset/settings");
    return data;
  },
  
  saveSettings: async (settings: ResetSettings): Promise<{ success: boolean, settings: ResetSettings, message: string }> => {
    const { data } = await axios.post("/api/reset/settings", {
      confirmationCode: settings.confirmationCode,
      preserveMasterData: settings.preserveMasterData
    });
    return data;
  },
  
  getResetLogs: async (): Promise<{ logs: ResetLog[] }> => {
    const { data } = await axios.get("/api/reset/logs");
    return data;
  },
  
  performReset: async (options: { preserveMasterData: boolean }): Promise<{ success: boolean, backupFile: string, message: string }> => {
    const { data } = await axios.post("/api/reset", options);
    return data;
  }
};

// Wrapper component for QueryClient
function ResetDatabaseWrapper() {
  return (
    <QueryClientProvider client={queryClient}>
      <ResetDatabasePanel />
    </QueryClientProvider>
  );
}

function ResetDatabasePanel() {
  const queryClient = useQueryClient();
  
  // Reference for polling interval
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // State for konfirmasi reset manual
  const [confirmationInput, setConfirmationInput] = useState("");
  const [showConfirmation, setShowConfirmation] = useState(false);
  
  // State for pesan
  const [message, setMessage] = useState<StatusMessage>({
    type: "",
    text: "",
  });

  // Queries and mutations
  const {
    data: serverSettings = {
      confirmationCode: "RESET-DB",
      preserveMasterData: true
    },
    isLoading: isLoadingSettings,
  } = useQuery({
    queryKey: ['resetSettings'],
    queryFn: api.getSettings,
  });
  
  // Local state for form values (separating from server state)
  const [localSettings, setLocalSettings] = useState<ResetSettings>({
    confirmationCode: "RESET-DB",
    preserveMasterData: true,
  });
  
  // Update local state when server data loads
  const [initialSettingsLoaded, setInitialSettingsLoaded] = useState(false);

  useEffect(() => {
    if (serverSettings && !initialSettingsLoaded) {
      setLocalSettings(serverSettings);
      setInitialSettingsLoaded(true);
    }
  }, [serverSettings, initialSettingsLoaded]);
  
  // State to track if form is dirty (has unsaved changes)
  const [formIsDirty, setFormIsDirty] = useState(false);

  const {
    data: resetLogsData = { logs: [] },
    isLoading: isLoadingLogs,
    refetch: refetchLogs,
  } = useQuery({
    queryKey: ['resetLogs'],
    queryFn: api.getResetLogs,
    refetchInterval: 10000, // Poll every 10 seconds
  });

  const resetLogs = resetLogsData.logs || [];

  // Save settings mutation
  const saveSettingsMutation = useMutation({
    mutationFn: api.saveSettings,
    onSuccess: (data) => {
      setMessage({ 
        type: "success", 
        text: data.message || "Pengaturan reset berhasil disimpan" 
      });
      setTimeout(() => setMessage({ type: "", text: "" }), 3000);
      queryClient.invalidateQueries({ queryKey: ['resetSettings'] });
      setFormIsDirty(false);
    },
    onError: (error) => {
      console.error("Error saving settings:", error);
      setMessage({ 
        type: "error", 
        text: "Gagal menyimpan pengaturan reset" 
      });
    },
  });

  // Perform reset mutation
  const resetMutation = useMutation({
    mutationFn: (options: { preserveMasterData: boolean }) => api.performReset(options),
    onSuccess: (data) => {
      setShowConfirmation(false);
      setConfirmationInput("");
      
      setMessage({ 
        type: "success", 
        text: `Reset database berhasil. Backup dibuat: ${data.backupFile}` 
      });
      
      // Refresh reset logs list after 1 second
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['resetLogs'] });
      }, 1000);
      
      setTimeout(() => setMessage({ type: "", text: "" }), 5000);
    },
    onError: (error: any) => {
      setShowConfirmation(false);
      setConfirmationInput("");
      
      console.error("Error performing reset:", error);
      const errorMessage = error.response?.data?.error || "Gagal melakukan reset database manual";
      setMessage({ 
        type: "error", 
        text: `Reset manual gagal: ${errorMessage}` 
      });
    },
  });

  // Setup real-time polling
  useEffect(() => {
    // Clear existing interval
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    // Create new interval for polling every 30 seconds
    pollingIntervalRef.current = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ['resetLogs'] });
    }, 30000);

    // Cleanup on unmount
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [queryClient]);

  // Handle setting changes locally without immediate save
  const handleSettingChange = (name: string, value: any) => {
    setLocalSettings(prev => ({
      ...prev,
      [name]: value
    }));
    setFormIsDirty(true);
  };

  // Handle the form submission to save settings
  const handleSaveSettings = () => {
    saveSettingsMutation.mutate(localSettings);
  };
  
  // Konfirmasi reset database
  const confirmReset = () => {
    if (confirmationInput === localSettings.confirmationCode) {
      resetMutation.mutate({ 
        preserveMasterData: localSettings.preserveMasterData 
      });
    } else {
      setMessage({ type: "error", text: "Kode konfirmasi tidak sesuai" });
      setTimeout(() => setMessage({ type: "", text: "" }), 3000);
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

      {/* Status messages */}
      {message.text && (
        <div 
          className={`p-4 mb-6 rounded-none border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] ${
            message.type === "success" 
              ? "bg-[#6C9BCF]/80" 
              : "bg-[#FF9B9B]/80"
          }`}
        >
          <p className="font-bold text-black flex items-center">
            {message.type === "success" ? <CheckIcon className="mr-2" size={20} /> : <XIcon className="mr-2" size={20} />}
            {message.text}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Panel pengaturan reset */}
        <div className="bg-[#fff] p-5 rounded-none border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]">
          <h2 className="text-2xl font-bold uppercase mb-6 text-black">PENGATURAN RESET</h2>

          <div className="space-y-6">
            {/* Opsi preservasi data master */}
            <div className="bg-white p-4 border-2 border-black">
              <div className="flex items-center gap-3">
                <input 
                  type="checkbox" 
                  id="preserveMasterData" 
                  checked={localSettings.preserveMasterData} 
                  onChange={(e) => handleSettingChange('preserveMasterData', e.target.checked)} 
                  className="w-6 h-6 border-2 border-black"
                  disabled={isLoadingSettings || saveSettingsMutation.isPending}
                />
                <label htmlFor="preserveMasterData" className="font-bold text-lg uppercase">
                  PERTAHANKAN DATA MASTER
                </label>
              </div>
              <p className="mt-2 text-black">
                Jika diaktifkan, data master seperti User, Kategori, dan Produk akan dipertahankan saat reset
              </p>
            </div>

            {/* Kode konfirmasi */}
            <div className="bg-white p-4 border-2 border-black">
              <label htmlFor="confirmationCode" className="block font-bold text-lg uppercase mb-2">
                KODE KONFIRMASI RESET
              </label>
              <input
                type="text"
                id="confirmationCode"
                value={localSettings.confirmationCode}
                onChange={(e) => handleSettingChange('confirmationCode', e.target.value)}
                className="border-2 border-black py-2 px-3 w-full font-mono text-xl bg-white"
                placeholder="RESET-DB"
                disabled={isLoadingSettings || saveSettingsMutation.isPending}
              />
              <p className="mt-2 text-black">
                Kode ini diperlukan untuk konfirmasi setiap reset database manual
              </p>
            </div>

            {/* Tombol simpan */}
            <button 
              onClick={handleSaveSettings} 
              disabled={saveSettingsMutation.isPending || !formIsDirty} 
              className={`flex items-center justify-center gap-2 w-full p-3 text-white font-bold text-lg border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] transition-transform hover:translate-x-1 hover:translate-y-1 hover:shadow-none ${
                formIsDirty 
                  ? "bg-[#6C9BCF] hover:bg-[#6C9BCF]/90" 
                  : "bg-gray-200 text-gray-600 cursor-not-allowed"
              }`}
            >
              {saveSettingsMutation.isPending ? (
                <>
                  <span className="animate-spin h-5 w-5 border-3 border-white border-t-transparent rounded-full"></span>
                  <span>MENYIMPAN...</span>
                </>
              ) : (
                <>
                  <SaveIcon size={20} />
                  <span>SIMPAN PENGATURAN</span>
                </>
              )}
            </button>
            
            {/* Form status */}
            {formIsDirty && !saveSettingsMutation.isPending && (
              <p className="text-sm text-center text-orange-500 font-bold animate-pulse">
                TERDAPAT PERUBAHAN YANG BELUM DISIMPAN
              </p>
            )}
          </div>
        </div>

        {/* Panel reset manual */}
        <div className="bg-[#fff] p-5 rounded-none border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]">
          <h2 className="text-2xl font-bold uppercase mb-6 text-black">RESET MANUAL</h2>

          <div className="bg-[#FFD966] p-4 border-2 border-black mb-6">
            <div className="flex items-start space-x-2">
              <AlertTriangleIcon size={24} className="text-black mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-black font-bold uppercase">Peringatan</p>
                <p className="text-black">
                  Reset database akan menghapus {localSettings.preserveMasterData ? "data transaksi" : "SEMUA data"} dan membuat database dalam kondisi {localSettings.preserveMasterData ? "hanya dengan data master" : "kosong"}. 
                  Pastikan Anda telah membuat backup data penting sebelum melanjutkan.
                </p>
              </div>
            </div>
          </div>

          {!showConfirmation ? (
            <button
              onClick={() => setShowConfirmation(true)}
              className="flex items-center justify-center gap-3 bg-red-500 text-white border-2 border-black p-4 font-bold text-xl uppercase w-full hover:bg-red-600 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-transform hover:translate-x-1 hover:translate-y-1 hover:shadow-none mb-6"
            >
              <RefreshCwIcon size={24} />
              <span>RESET DATABASE</span>
            </button>
          ) : (
            <div className="space-y-3 border-2 border-black p-4 bg-red-50 mb-6">
              <p className="text-lg text-black font-bold">
                Konfirmasi reset database dengan memasukkan kode: 
                <span className="font-mono"> {localSettings.confirmationCode}</span>
              </p>
              
              <input
                type="text"
                value={confirmationInput}
                onChange={(e) => setConfirmationInput(e.target.value)}
                className="border-2 border-black py-2 px-3 w-full font-mono text-xl bg-white"
                placeholder="Masukkan kode konfirmasi"
              />
              
              <div className="flex gap-4">
                <button
                  onClick={confirmReset}
                  disabled={resetMutation.isPending}
                  className="flex items-center justify-center flex-1 bg-red-500 text-white p-3 font-bold border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] transition-transform hover:translate-x-1 hover:translate-y-1 hover:shadow-none"
                >
                  {resetMutation.isPending ? (
                    <>
                      <span className="animate-spin h-5 w-5 border-3 border-white border-t-transparent rounded-full mr-2"></span>
                      <span>MEMPROSES...</span>
                    </>
                  ) : (
                    "RESET SEKARANG"
                  )}
                </button>
                
                <button
                  onClick={() => setShowConfirmation(false)}
                  disabled={resetMutation.isPending}
                  className="bg-white text-black px-6 py-3 font-bold border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] transition-transform hover:translate-x-1 hover:translate-y-1 hover:shadow-none"
                >
                  BATAL
                </button>
              </div>
            </div>
          )}

          <div className="bg-white p-4 border-2 border-black">
            <p className="font-bold text-lg uppercase mb-2">PROSES RESET DATABASE:</p>
            <ul className="space-y-3">
              <li className="flex items-start gap-2">
                <span className="bg-black text-white px-2 py-0.5 inline-block">1</span>
                <span className="font-bold text-black">BACKUP OTOMATIS</span> - Backup database saat ini
              </li>
              <li className="flex items-start gap-2">
                <span className="bg-black text-white px-2 py-0.5 inline-block">2</span>
                <span className="font-bold text-black">PUTUS KONEKSI</span> - Memutus semua koneksi aktif
              </li>
              <li className="flex items-start gap-2">
                <span className="bg-black text-white px-2 py-0.5 inline-block">3</span>
                <span className="font-bold text-black">HAPUS DATA</span> - Menghapus {localSettings.preserveMasterData ? "data transaksi" : "struktur dan data"} database
              </li>
              <li className="flex items-start gap-2">
                <span className="bg-black text-white px-2 py-0.5 inline-block">4</span>
                <span className="font-bold text-black">REKONSTRUKSI</span> - Membuat ulang database {localSettings.preserveMasterData ? "dengan data master" : "kosong"}
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Daftar log reset */}
      <div className="mt-8 bg-[#fff]/80 p-5 rounded-none border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold uppercase text-black">RIWAYAT RESET DATABASE</h2>

          <div className="flex items-center gap-2">
            {/* Real-time update info */}
            <div className="text-xs font-mono bg-white px-2 py-1 border border-black">
              <span className="mr-1">REAL-TIME</span>
              <span className="inline-block h-2 w-2 bg-green-500 rounded-full animate-pulse"></span>
            </div>
            
            <button 
              onClick={() => refetchLogs()} 
              disabled={isLoadingLogs} 
              className="p-2 bg-white border-2 border-black hover:bg-gray-100"
            >
              <RefreshCwIcon size={24} className={isLoadingLogs ? "animate-spin text-[#6C9BCF]" : ""} />
            </button>
          </div>
        </div>

        {isLoadingLogs && resetLogs.length === 0 ? (
          <div className="py-10 text-center text-black">
            <div className="animate-spin h-12 w-12 border-4 border-black border-t-transparent rounded-full mx-auto"></div>
            <p className="mt-4 font-bold text-lg">MEMUAT RIWAYAT RESET...</p>
          </div>
        ) : resetLogs.length === 0 ? (
          <div className="py-10 bg-white border-2 border-black text-center">
            <p className="font-bold text-lg text-black">BELUM ADA RIWAYAT RESET DATABASE</p>
            <p className="text-gray-600 mt-2">Gunakan tombol &nbsp;RESET DATABASE&nbsp; untuk melakukan reset pertama</p>
          </div>
        ) : (
          <div className="border-2 border-black bg-white">
            <div className="max-h-96 overflow-y-auto">
              {resetLogs.map((log) => (
                <div key={log.filename} className="border-b-2 border-gray-200 p-4 hover:bg-[#F1F6F9]">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium flex items-center">
                      <ClockIcon size={18} className="mr-1 text-[#6C9BCF]" />
                      {format(new Date(log.created), "dd MMM yyyy HH:mm:ss", { locale: id })}
                    </h3>
                    <span className="text-xs text-gray-500 bg-white px-2 py-1 border border-black">
                      {formatDistance(new Date(log.created), new Date(), {
                        addSuffix: true,
                        locale: id,
                      })}
                    </span>
                  </div>
                  
                  <pre className="text-sm bg-gray-50 p-3 rounded-none border-2 border-black overflow-x-auto font-mono">
                    {log.content}
                  </pre>
                </div>
              ))}
            </div>

            {/* Scroll indicator */}
            {resetLogs.length > 3 && (
              <div className="text-center text-xs py-1 border-t-2 border-gray-200 bg-gray-50">
                <span>Scroll untuk melihat semua log</span>
              </div>
            )}
          </div>
        )}
        
        {/* Data refresh indicator */}
        {isLoadingLogs && resetLogs.length > 0 && (
          <div className="mt-2 text-xs font-mono flex items-center justify-end gap-2">
            <span className="animate-spin h-3 w-3 border-2 border-[#6C9BCF] border-t-transparent rounded-full"></span>
            <span>MEMPERBARUI DATA...</span>
          </div>
        )}
      </div>

      {/* Panduan penggunaan */}
      <div className="mt-8 bg-[#F1F6F9] p-5 rounded-none border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]">
        <h2 className="text-2xl font-bold uppercase mb-4 text-black">PANDUAN RESET DATABASE</h2>

        <div className="bg-[#FFD966] p-4 border-2 border-black">
          <ul className="space-y-3">
            <li className="font-bold text-black">
              <span className="bg-black text-white px-2 py-0.5 mr-2 inline-block">1</span>
              <strong>RESET MANUAL</strong> - Reset database kapan saja dengan konfirmasi keamanan
            </li>
            <li className="font-bold text-black">
              <span className="bg-black text-white px-2 py-0.5 mr-2 inline-block">2</span>
              <strong>PERTAHANKAN DATA MASTER</strong> - Opsi untuk menyimpan User, Kategori, dan Produk saat reset
            </li>
            <li className="font-bold text-black">
              <span className="bg-black text-white px-2 py-0.5 mr-2 inline-block">3</span>
              <strong>BACKUP OTOMATIS</strong> - Setiap reset selalu membuat backup terlebih dahulu
            </li>
            <li className="font-bold text-black">
              <span className="bg-black text-white px-2 py-0.5 mr-2 inline-block">4</span>
              <strong>INISIALISASI SCHEMA</strong> - Otomatis menginisialisasi database setelah reset
            </li>
          </ul>

          <div className="mt-6 p-4 bg-white text-black border-2 border-white">
            <p className="font-bold uppercase">DATA YANG DIPERTAHANKAN (JIKA OPSI DIAKTIFKAN):</p>
            <div className="grid grid-cols-3 gap-3 mt-2">
              <div className="flex items-center p-2 bg-[#6C9BCF] rounded-none border-2 border-white">
                <span className="text-sm font-bold text-white">USER (PENGGUNA)</span>
              </div>
              <div className="flex items-center p-2 bg-[#6C9BCF] rounded-none border-2 border-white">
                <span className="text-sm font-bold text-white">KATEGORI</span>
              </div>
              <div className="flex items-center p-2 bg-[#6C9BCF] rounded-none border-2 border-white">
                <span className="text-sm font-bold text-white">PRODUK</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ResetDatabaseWrapper;