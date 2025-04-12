// File: components/ResetDatabasePanel.tsx

"use client";
import { useState, useEffect } from "react";
import { RefreshCwIcon, AlertTriangleIcon, ClockIcon, CheckCircleIcon, DatabaseIcon } from "lucide-react";
import { formatDistance, format } from "date-fns";
import { id } from "date-fns/locale";

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

export default function ResetDatabasePanel() {
  // State untuk pengaturan reset
  const [settings, setSettings] = useState<ResetSettings>({
    confirmationCode: "RESET-DB",
    preserveMasterData: true
  });

  // State untuk daftar log reset
  const [resetLogs, setResetLogs] = useState<ResetLog[]>([]);

  // State untuk loading
  const [loading, setLoading] = useState({
    manual: false,
    settings: false,
    logs: true,
  });

  // State untuk konfirmasi reset manual
  const [confirmationInput, setConfirmationInput] = useState("");
  const [showConfirmation, setShowConfirmation] = useState(false);

  // State untuk pesan
  const [message, setMessage] = useState({
    type: "",
    text: "",
  });

  // Memuat pengaturan reset dari server
  const loadSettings = async () => {
    try {
      setLoading({ ...loading, settings: true });
      const res = await fetch("/api/reset/settings");
      if (!res.ok) throw new Error("Gagal memuat pengaturan reset");

      const data = await res.json();
      setSettings({
        confirmationCode: data.confirmationCode || "RESET-DB",
        preserveMasterData: data.preserveMasterData !== undefined ? data.preserveMasterData : true
      });
    } catch (error) {
      console.error("Error loading reset settings:", error);
      setMessage({ type: "error", text: "Gagal memuat pengaturan reset database" });
    } finally {
      setLoading({ ...loading, settings: false });
    }
  };

  // Memuat daftar log reset
  const loadResetLogs = async () => {
    try {
      setLoading({ ...loading, logs: true });
      const res = await fetch("/api/reset/logs");
      if (!res.ok) throw new Error("Gagal memuat daftar log reset");

      const data = await res.json();
      setResetLogs(data.logs || []);
    } catch (error) {
      console.error("Error loading reset logs:", error);
      setMessage({ type: "error", text: "Gagal memuat daftar log reset" });
    } finally {
      setLoading({ ...loading, logs: false });
    }
  };

  // Load data saat komponen dimount
  useEffect(() => {
    loadSettings();
    loadResetLogs();
  }, []);

  // Menyimpan pengaturan reset
  const saveSettings = async () => {
    try {
      setLoading({ ...loading, settings: true });
      const res = await fetch("/api/reset/settings", {
        method: "POST",
        body: JSON.stringify(settings),
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) throw new Error("Gagal menyimpan pengaturan reset");

      setMessage({ type: "success", text: "Pengaturan reset database berhasil disimpan" });

      // Hilangkan pesan setelah 3 detik
      setTimeout(() => setMessage({ type: "", text: "" }), 3000);
    } catch (error) {
      console.error("Error saving reset settings:", error);
      setMessage({ type: "error", text: "Gagal menyimpan pengaturan reset database" });
    } finally {
      setLoading({ ...loading, settings: false });
    }
  };

  // Melakukan reset manual
  const manualReset = async () => {
    // Tutup dialog konfirmasi
    setShowConfirmation(false);
    
    // Reset input konfirmasi
    setConfirmationInput("");

    try {
      setLoading({ ...loading, manual: true });
      const res = await fetch("/api/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          preserveMasterData: settings.preserveMasterData
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        setMessage({ type: "error", text: `Reset manual gagal: ${errorData.error || 'Terjadi kesalahan'}` });
        return;
      }

      const result = await res.json();
      setMessage({ type: "success", text: `Reset database berhasil. Backup dibuat: ${result.backupFile}` });
      
      // Refresh daftar log setelah 1 detik
      setTimeout(loadResetLogs, 1000);

      // Hilangkan pesan setelah 5 detik
      setTimeout(() => setMessage({ type: "", text: "" }), 5000);
    } catch (error) {
      console.error("Error running manual reset:", error);
      setMessage({ type: "error", text: "Gagal melakukan reset database manual" });
    } finally {
      setLoading({ ...loading, manual: false });
    }
  };

  // Konfirmasi reset database
  const confirmReset = () => {
    if (confirmationInput === settings.confirmationCode) {
      manualReset();
    } else {
      setMessage({ type: "error", text: "Kode konfirmasi tidak sesuai" });
      setTimeout(() => setMessage({ type: "", text: "" }), 3000);
    }
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Reset Database</h1>

      {/* Pesan status */}
      {message.text && <div className={`p-3 mb-4 rounded-md ${message.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>{message.text}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Panel pengaturan reset */}
        <div className="bg-white p-5 rounded-lg shadow-sm border">
          <h2 className="text-lg font-medium mb-4">Pengaturan Reset Database</h2>

          <div className="space-y-4">
            {/* Opsi preservasi data master */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <input 
                  type="checkbox" 
                  id="preserveMasterData" 
                  checked={settings.preserveMasterData} 
                  onChange={(e) => setSettings({ ...settings, preserveMasterData: e.target.checked })} 
                  className="rounded text-blue-600 focus:ring-blue-500" 
                />
                <label htmlFor="preserveMasterData" className="font-medium">
                  Pertahankan Data Master
                </label>
              </div>
              <p className="text-xs text-gray-500 ml-6">
                Jika diaktifkan, data master seperti User, Kategori, dan Produk akan dipertahankan saat reset
              </p>
            </div>

            {/* Kode konfirmasi */}
            <div>
              <label htmlFor="confirmationCode" className="block text-sm font-medium mb-1">
                Kode Konfirmasi Reset
              </label>
              <input
                type="text"
                id="confirmationCode"
                value={settings.confirmationCode}
                onChange={(e) => setSettings({ ...settings, confirmationCode: e.target.value })}
                className="border border-gray-300 rounded-md px-3 py-2 w-full"
                placeholder="RESET-DB"
              />
              <p className="text-xs text-gray-500 mt-1">
                Kode ini diperlukan untuk konfirmasi setiap reset database manual
              </p>
            </div>

            {/* Tombol simpan */}
            <div className="pt-2">
              <button 
                onClick={saveSettings} 
                disabled={loading.settings} 
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 w-full"
              >
                {loading.settings ? "Menyimpan..." : "Simpan Pengaturan"}
              </button>
            </div>
          </div>
        </div>

        {/* Panel reset manual */}
        <div className="bg-white p-5 rounded-lg shadow-sm border">
          <h2 className="text-lg font-medium mb-4">Reset Database Manual</h2>

          <div className="bg-amber-50 p-4 rounded-md border border-amber-200 mb-4">
            <div className="flex items-start space-x-2">
              <AlertTriangleIcon size={20} className="text-amber-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-amber-800 font-medium text-sm">Peringatan</p>
                <p className="text-amber-700 text-sm">
                  Reset database akan menghapus {settings.preserveMasterData ? "data transaksi" : "SEMUA data"} dan membuat database dalam kondisi {settings.preserveMasterData ? "hanya dengan data master" : "kosong"}. 
                  Pastikan Anda telah membuat backup data penting sebelum melanjutkan.
                </p>
              </div>
            </div>
          </div>

          {!showConfirmation ? (
            <button
              onClick={() => setShowConfirmation(true)}
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 w-full flex items-center justify-center gap-2"
            >
              <RefreshCwIcon size={18} />
              <span>Reset Database</span>
            </button>
          ) : (
            <div className="space-y-3 border border-red-200 rounded-md p-3 bg-red-50">
              <p className="text-sm text-red-700 font-medium">
                Konfirmasi reset database dengan memasukkan kode: 
                <span className="font-bold"> {settings.confirmationCode}</span>
              </p>
              
              <input
                type="text"
                value={confirmationInput}
                onChange={(e) => setConfirmationInput(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 w-full"
                placeholder="Masukkan kode konfirmasi"
              />
              
              <div className="flex space-x-2">
                <button
                  onClick={confirmReset}
                  disabled={loading.manual}
                  className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 flex-1"
                >
                  {loading.manual ? (
                    <>
                      <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full inline-block mr-1"></span>
                      <span>Memproses...</span>
                    </>
                  ) : (
                    "Reset Sekarang"
                  )}
                </button>
                
                <button
                  onClick={() => setShowConfirmation(false)}
                  disabled={loading.manual}
                  className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
                >
                  Batal
                </button>
              </div>
            </div>
          )}

          <div className="mt-4 space-y-2">
            <p className="text-sm font-medium">Proses Reset Database:</p>
            <ul className="text-sm space-y-1 text-gray-600">
              <li className="flex items-start space-x-2">
                <CheckCircleIcon size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                <span>Backup otomatis database saat ini</span>
              </li>
              <li className="flex items-start space-x-2">
                <CheckCircleIcon size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                <span>Memutus semua koneksi aktif</span>
              </li>
              <li className="flex items-start space-x-2">
                <CheckCircleIcon size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                <span>Menghapus {settings.preserveMasterData ? "data transaksi" : "struktur dan data"} database</span>
              </li>
              <li className="flex items-start space-x-2">
                <CheckCircleIcon size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                <span>Membuat ulang database {settings.preserveMasterData ? "dengan data master" : "kosong"}</span>
              </li>
              <li className="flex items-start space-x-2">
                <CheckCircleIcon size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                <span>Menginisialisasi dengan schema.sql (jika diperlukan)</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Daftar log reset */}
      <div className="mt-6 bg-white p-5 rounded-lg shadow-sm border">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium">Riwayat Reset Database</h2>

          <button onClick={loadResetLogs} disabled={loading.logs} className="p-2 rounded-md hover:bg-gray-100 focus:outline-none" title="Refresh log">
            <RefreshCwIcon size={18} className={loading.logs ? "animate-spin text-blue-600" : ""} />
          </button>
        </div>

        {loading.logs ? (
          <div className="py-8 text-center text-gray-500">
            <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
            <p className="mt-2">Memuat riwayat reset...</p>
          </div>
        ) : resetLogs.length === 0 ? (
          <div className="py-8 text-center text-gray-500 border rounded-md bg-gray-50">
            <p>Belum ada riwayat reset database</p>
          </div>
        ) : (
          <div className="space-y-4">
            {resetLogs.map((log) => (
              <div key={log.filename} className="border rounded-md p-3 hover:bg-gray-50">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium text-sm flex items-center">
                    <ClockIcon size={16} className="mr-1 text-blue-600" />
                    {format(new Date(log.created), "dd MMM yyyy HH:mm:ss", { locale: id })}
                  </h3>
                  <span className="text-xs text-gray-500">
                    {formatDistance(new Date(log.created), new Date(), {
                      addSuffix: true,
                      locale: id,
                    })}
                  </span>
                </div>
                
                <pre className="text-xs bg-gray-50 p-2 rounded-md border overflow-x-auto">
                  {log.content}
                </pre>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Panduan penggunaan */}
      <div className="mt-6 bg-white p-5 rounded-lg shadow-sm border">
        <h2 className="text-lg font-medium mb-2">Panduan Reset Database</h2>

        <div className="prose prose-sm max-w-none">
          <ul className="space-y-2">
            <li>
              <strong>Reset Manual</strong> - Reset database kapan saja dengan konfirmasi keamanan
            </li>
            <li>
              <strong>Pertahankan Data Master</strong> - Opsi untuk menyimpan User, Kategori, dan Produk saat reset
            </li>
            <li>
              <strong>Backup Otomatis</strong> - Setiap reset selalu membuat backup terlebih dahulu
            </li>
            <li>
              <strong>Inisialisasi Schema</strong> - Otomatis menginisialisasi database setelah reset
            </li>
          </ul>

          <div className="mt-4">
            <h3 className="text-sm font-medium mb-2">Data yang Dipertahankan (Jika Opsi Diaktifkan):</h3>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center p-2 bg-blue-50 rounded-md">
                <DatabaseIcon size={16} className="text-blue-500 mr-2" />
                <span className="text-sm">User (Pengguna)</span>
              </div>
              <div className="flex items-center p-2 bg-blue-50 rounded-md">
                <DatabaseIcon size={16} className="text-blue-500 mr-2" />
                <span className="text-sm">Kategori</span>
              </div>
              <div className="flex items-center p-2 bg-blue-50 rounded-md">
                <DatabaseIcon size={16} className="text-blue-500 mr-2" />
                <span className="text-sm">Produk</span>
              </div>
            </div>
          </div>

          <div className="mt-4 p-3 bg-amber-50 rounded-md text-sm text-amber-700 border border-amber-100">
            <p className="font-medium">Perlu Diperhatikan:</p>
            <p>Reset database adalah operasi yang tidak dapat dibatalkan dan akan menghapus data. Pastikan untuk membuat backup yang diperlukan sebelum melakukan reset.</p>
          </div>
        </div>
      </div>
    </div>
  );
}