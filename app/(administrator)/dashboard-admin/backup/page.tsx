"use client";
import { useEffect, useState } from "react";
import { DownloadIcon, TrashIcon, RefreshCwIcon } from "lucide-react";
import { formatDistance, format } from "date-fns";
import { id } from "date-fns/locale";

// Tipe data untuk file backup
interface BackupFile {
  filename: string;
  size: number;
  created: string;
  path: string;
}

// Tipe data untuk pengaturan backup
interface BackupSettings {
  autoBackup: boolean;
  schedule: string;
  retention: number;
  backupDestination: string;
}

export default function BackupPage() {
  // State untuk pengaturan backup
  const [settings, setSettings] = useState<BackupSettings>({
    autoBackup: true,
    schedule: "0 0 * * *", // Default: setiap hari pada tengah malam
    retention: 7, // Simpan backup selama 7 hari
    backupDestination: "local", // Lokasi: local
  });

  // State untuk daftar file backup
  const [backupFiles, setBackupFiles] = useState<BackupFile[]>([]);

  // State untuk loading
  const [loading, setLoading] = useState({
    manual: false,
    settings: false,
    list: true,
    delete: null as string | null,
  });

  // State untuk pesan
  const [message, setMessage] = useState({
    type: "",
    text: "",
  });

  // State untuk editor jadwal
  const [isAdvancedSchedule, setIsAdvancedSchedule] = useState(false);

  // Memuat pengaturan backup dari server
  const loadSettings = async () => {
    try {
      setLoading({ ...loading, settings: true });
      const res = await fetch("/api/backup/settings");
      if (!res.ok) throw new Error("Gagal memuat pengaturan");

      const data = await res.json();
      setSettings(data);
    } catch (error) {
      console.error("Error loading settings:", error);
      setMessage({ type: "error", text: "Gagal memuat pengaturan backup" });
    } finally {
      setLoading({ ...loading, settings: false });
    }
  };

  // Memuat daftar file backup
  const loadBackupFiles = async () => {
    try {
      setLoading({ ...loading, list: true });
      const res = await fetch("/api/backup/list");
      if (!res.ok) throw new Error("Gagal memuat daftar backup");

      const data = await res.json();
      setBackupFiles(data.files || []);
    } catch (error) {
      console.error("Error loading backup files:", error);
      setMessage({ type: "error", text: "Gagal memuat daftar file backup" });
    } finally {
      setLoading({ ...loading, list: false });
    }
  };

  // Load data saat komponen dimount
  useEffect(() => {
    loadSettings();
    loadBackupFiles();
  }, []);

  // Menyimpan pengaturan backup
  const saveSettings = async () => {
    try {
      setLoading({ ...loading, settings: true });
      const res = await fetch("/api/backup/settings", {
        method: "POST",
        body: JSON.stringify(settings),
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) throw new Error("Gagal menyimpan pengaturan");

      setMessage({ type: "success", text: "Pengaturan backup berhasil disimpan" });

      // Hilangkan pesan setelah 3 detik
      setTimeout(() => setMessage({ type: "", text: "" }), 3000);
    } catch (error) {
      console.error("Error saving settings:", error);
      setMessage({ type: "error", text: "Gagal menyimpan pengaturan backup" });
    } finally {
      setLoading({ ...loading, settings: false });
    }
  };

  // Melakukan backup manual
  const manualBackup = async () => {
    try {
      setLoading({ ...loading, manual: true });
      const res = await fetch("/api/backup");

      if (!res.ok) {
        setMessage({ type: "error", text: "Backup manual gagal" });
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const filename = `backup-${new Date().toISOString().replace(/[:.]/g, "-")}.backup`;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      setMessage({ type: "success", text: "Backup manual berhasil" });
      // Refresh daftar backup setelah 1 detik
      setTimeout(loadBackupFiles, 1000);

      // Hilangkan pesan setelah 3 detik
      setTimeout(() => setMessage({ type: "", text: "" }), 3000);
    } catch (error) {
      console.error("Error running manual backup:", error);
      setMessage({ type: "error", text: "Gagal melakukan backup manual" });
    } finally {
      setLoading({ ...loading, manual: false });
    }
  };

  // Mengunduh file backup
  const downloadBackup = async (filename: string) => {
    try {
      const res = await fetch(`/api/backup/download/${filename}`);

      if (!res.ok) {
        setMessage({ type: "error", text: "Gagal mengunduh file backup" });
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      setMessage({ type: "success", text: "File backup berhasil diunduh" });

      // Hilangkan pesan setelah 3 detik
      setTimeout(() => setMessage({ type: "", text: "" }), 3000);
    } catch (error) {
      console.error("Error downloading backup:", error);
      setMessage({ type: "error", text: "Gagal mengunduh file backup" });
    }
  };

  // Menghapus file backup
  const deleteBackup = async (filename: string) => {
    if (!confirm(`Yakin ingin menghapus backup "${filename}"?`)) return;

    try {
      setLoading({ ...loading, delete: filename });
      const res = await fetch(`/api/backup/delete/${filename}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Gagal menghapus file backup");

      // Refresh daftar backup
      await loadBackupFiles();

      setMessage({ type: "success", text: "File backup berhasil dihapus" });

      // Hilangkan pesan setelah 3 detik
      setTimeout(() => setMessage({ type: "", text: "" }), 3000);
    } catch (error) {
      console.error("Error deleting backup:", error);
      setMessage({ type: "error", text: "Gagal menghapus file backup" });
    } finally {
      setLoading({ ...loading, delete: null });
    }
  };

  // Fungsi untuk memformat ukuran file
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(2)} KB`;
    const mb = kb / 1024;
    return `${mb.toFixed(2)} MB`;
  };

  // Helper untuk menerjemahkan jadwal cron ke bahasa manusia
  const translateCronSchedule = (schedule: string) => {
    const parts = schedule.split(" ");
    if (parts.length !== 5) return schedule;

    const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;

    // Beberapa jadwal umum
    if (schedule === "0 0 * * *") return "Setiap hari pada jam 00:00";
    if (schedule === "0 0 * * 0") return "Setiap hari Minggu pada jam 00:00";
    if (schedule === "0 0 1 * *") return "Setiap tanggal 1 pada jam 00:00";
    if (schedule === "0 0 1 1 *") return "Setiap 1 Januari pada jam 00:00";

    // Jadwal khusus lainnya
    return schedule;
  };

  // Helper untuk memilih jadwal presets
  const schedulePresets = [
    { label: "Setiap hari (00:00)", value: "0 0 * * *" },
    { label: "Setiap hari (08:00)", value: "0 8 * * *" },
    { label: "Setiap minggu (Minggu 00:00)", value: "0 0 * * 0" },
    { label: "Setiap bulan (tanggal 1, 00:00)", value: "0 0 1 * *" },
    { label: "Setiap tahun (1 Januari, 00:00)", value: "0 0 1 1 *" },
  ];

  return (
    <div className="bg-gray-100 min-h-screen p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 bg-black text-white py-3 px-5 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.2)] border-4 border-black">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold tracking-tight uppercase">BACKUP DATABASE</h1>
        </div>
        <div className="text-xl font-mono">
          {new Date().toLocaleDateString('id-ID', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}
        </div>
      </div>

      {/* Pesan status */}
      {message.text && (
        <div 
          className={`p-4 mb-6 rounded-none border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,0.2)] ${
            message.type === "success" 
              ? "bg-green-300" 
              : "bg-red-300"
          }`}
        >
          <p className="font-bold text-black">{message.text}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Panel pengaturan */}
        <div className="bg-yellow-300 p-5 rounded-none border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,0.2)]">
          <h2 className="text-2xl font-bold uppercase mb-6 text-black">PENGATURAN BACKUP</h2>

          <div className="space-y-6">
            {/* Backup otomatis */}
            <div className="flex items-center gap-3 bg-white p-3 border-2 border-black">
              <input 
                type="checkbox" 
                id="autoBackup" 
                checked={settings.autoBackup} 
                onChange={(e) => setSettings({ ...settings, autoBackup: e.target.checked })} 
                className="w-6 h-6 border-2 border-black"
              />
              <label htmlFor="autoBackup" className="font-bold text-lg">
                AKTIFKAN BACKUP OTOMATIS
              </label>
            </div>

            {/* Periode retensi */}
            <div className="bg-white p-4 border-2 border-black">
              <label htmlFor="retention" className="block font-bold text-lg mb-2 uppercase">
                PERIODE RETENSI (HARI)
              </label>
              <input
                type="number"
                id="retention"
                min="1"
                max="365"
                value={settings.retention}
                onChange={(e) => {
                  const value = e.target.value === "" ? 7 : parseInt(e.target.value);
                  setSettings({ ...settings, retention: value });
                }}
                className="border-2 border-black py-2 px-3 w-full font-mono text-xl bg-white"
              />
              <p className="mt-2 text-black">File backup lebih lama dari periode ini akan dihapus otomatis (maks. 365 hari)</p>
            </div>

            {/* Jadwal */}
            <div className="bg-white p-4 border-2 border-black">
              <label className="block font-bold text-lg mb-2 uppercase">JADWAL BACKUP</label>

              {/* Pilihan antara preset atau advanced */}
              <div className="flex items-center gap-2 mb-4">
                <button 
                  onClick={() => setIsAdvancedSchedule(false)} 
                  className={`px-4 py-2 border-2 border-black font-bold ${
                    !isAdvancedSchedule 
                      ? "bg-blue-400 text-black" 
                      : "bg-white text-black"
                  }`}
                >
                  JADWAL UMUM
                </button>
                <button 
                  onClick={() => setIsAdvancedSchedule(true)} 
                  className={`px-4 py-2 border-2 border-black font-bold ${
                    isAdvancedSchedule 
                      ? "bg-blue-400 text-black" 
                      : "bg-white text-black"
                  }`}
                >
                  FORMAT CRON
                </button>
              </div>

              {/* Pilihan presets */}
              {!isAdvancedSchedule ? (
                <select 
                  value={settings.schedule} 
                  onChange={(e) => setSettings({ ...settings, schedule: e.target.value })} 
                  className="border-2 border-black px-3 py-2 w-full font-mono bg-white"
                >
                  {schedulePresets.map((preset) => (
                    <option key={preset.value} value={preset.value}>
                      {preset.label}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="space-y-2">
                  <input 
                    type="text" 
                    value={settings.schedule} 
                    onChange={(e) => setSettings({ ...settings, schedule: e.target.value })} 
                    className="border-2 border-black px-3 py-2 w-full font-mono bg-white"
                    placeholder="0 0 * * *" 
                  />
                  <p className="text-black">
                    Format: menit jam hari-bulan bulan hari-minggu
                    <br />
                    Contoh: 0 0 * * * = setiap hari pada jam 00:00
                  </p>
                </div>
              )}

              <p className="mt-3 text-black font-bold">
                Jadwal saat ini: {translateCronSchedule(settings.schedule)}
              </p>
            </div>

            {/* Tombol simpan */}
            <button 
              onClick={saveSettings} 
              disabled={loading.settings} 
              className="bg-blue-500 text-white border-2 border-black p-3 font-bold text-xl uppercase w-full hover:bg-blue-600 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-transform hover:translate-x-1 hover:translate-y-1 hover:shadow-none"
            >
              {loading.settings ? "MENYIMPAN..." : "SIMPAN PENGATURAN"}
            </button>
          </div>
        </div>

        {/* Panel backup manual */}
        <div className="bg-green-300 p-5 rounded-none border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,0.2)]">
          <h2 className="text-2xl font-bold uppercase mb-6 text-black">BACKUP MANUAL</h2>

          <button
            onClick={manualBackup}
            disabled={loading.manual}
            className="flex items-center justify-center gap-3 bg-black text-white border-2 border-black p-4 font-bold text-xl uppercase w-full hover:bg-black/80 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-transform hover:translate-x-1 hover:translate-y-1 hover:shadow-none mb-6"
          >
            {loading.manual ? (
              <>
                <span className="animate-spin h-6 w-6 border-3 border-white border-t-transparent rounded-full"></span>
                <span>MEMPROSES...</span>
              </>
            ) : (
              <>
                <DownloadIcon size={24} />
                <span>BACKUP & DOWNLOAD SEKARANG</span>
              </>
            )}
          </button>

          <p className="text-black font-bold mb-6">
            Backup manual akan membuat salinan database dan mengunduhnya langsung ke perangkat Anda
          </p>

          {/* Penjelasan format file */}
          <div className="bg-white p-4 border-2 border-black">
            <p className="font-bold text-lg uppercase">FORMAT FILE</p>
            <p className="mt-2 text-black">File backup berformat PostgreSQL custom (.backup) yang dapat dipulihkan menggunakan pg_restore.</p>
          </div>
        </div>
      </div>

      {/* Daftar file backup */}
      <div className="mt-8 bg-blue-300 p-5 rounded-none border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,0.2)]">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold uppercase text-black">DAFTAR FILE BACKUP</h2>

          <button 
            onClick={loadBackupFiles} 
            disabled={loading.list} 
            className="p-2 bg-white border-2 border-black hover:bg-gray-100"
          >
            <RefreshCwIcon size={24} className={loading.list ? "animate-spin text-blue-600" : ""} />
          </button>
        </div>

        {loading.list ? (
          <div className="py-10 text-center text-black">
            <div className="animate-spin h-12 w-12 border-4 border-black border-t-transparent rounded-full mx-auto"></div>
            <p className="mt-4 font-bold text-lg">MEMUAT DAFTAR BACKUP...</p>
          </div>
        ) : backupFiles.length === 0 ? (
          <div className="py-10 bg-white border-2 border-black text-center">
            <p className="font-bold text-lg text-black">BELUM ADA FILE BACKUP TERSIMPAN</p>
          </div>
        ) : (
          <div className="border-2 border-black bg-white overflow-auto">
            <table className="min-w-full">
              <thead className="bg-black text-white">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-bold uppercase">NAMA FILE</th>
                  <th className="px-6 py-3 text-left text-sm font-bold uppercase">UKURAN</th>
                  <th className="px-6 py-3 text-left text-sm font-bold uppercase">DIBUAT</th>
                  <th className="px-6 py-3 text-right text-sm font-bold uppercase">AKSI</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-black">
                {backupFiles.map((file) => (
                  <tr key={file.filename} className="hover:bg-blue-100">
                    <td className="px-6 py-4 text-sm font-mono font-bold">{file.filename}</td>
                    <td className="px-6 py-4 text-sm font-mono">{formatFileSize(file.size)}</td>
                    <td className="px-6 py-4 text-sm font-mono">
                      <span title={format(new Date(file.created), "dd MMM yyyy HH:mm:ss", { locale: id })}>
                        {formatDistance(new Date(file.created), new Date(), {
                          addSuffix: true,
                          locale: id,
                        })}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end space-x-3">
                        <button 
                          onClick={() => downloadBackup(file.filename)} 
                          className="bg-blue-500 text-white px-3 py-2 border-2 border-black hover:bg-blue-600 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-transform hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none"
                        >
                          <DownloadIcon size={18} />
                        </button>
                        <button 
                          onClick={() => deleteBackup(file.filename)} 
                          disabled={loading.delete === file.filename} 
                          className="bg-red-500 text-white px-3 py-2 border-2 border-black hover:bg-red-600 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-transform hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none"
                        >
                          {loading.delete === file.filename ? (
                            <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                          ) : (
                            <TrashIcon size={18} />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Panduan penggunaan */}
      <div className="mt-8 bg-pink-300 p-5 rounded-none border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,0.2)]">
        <h2 className="text-2xl font-bold uppercase mb-4 text-black">PANDUAN BACKUP</h2>

        <div className="bg-white p-4 border-2 border-black">
          <ul className="space-y-3">
            <li className="font-bold text-black">
              <span className="bg-black text-white px-2 py-0.5 mr-2 inline-block">1</span>
              <strong>BACKUP MANUAL</strong> - Buat dan unduh backup database kapan saja
            </li>
            <li className="font-bold text-black">
              <span className="bg-black text-white px-2 py-0.5 mr-2 inline-block">2</span>
              <strong>BACKUP OTOMATIS</strong> - Aktifkan untuk menjadwalkan backup secara otomatis
            </li>
            <li className="font-bold text-black">
              <span className="bg-black text-white px-2 py-0.5 mr-2 inline-block">3</span>
              <strong>PERIODE RETENSI</strong> - File backup lebih lama dari periode ini akan dihapus otomatis
            </li>
            <li className="font-bold text-black">
              <span className="bg-black text-white px-2 py-0.5 mr-2 inline-block">4</span>
              <strong>FORMAT FILE</strong> - File .backup dalam format PostgreSQL Custom yang bisa dipulihkan menggunakan pg_restore
            </li>
          </ul>

          <div className="mt-6 p-3 bg-yellow-200 border-2 border-black">
            <p className="font-bold text-black">
              <strong>CATATAN:</strong> Pastikan service backup (backupCron.js) berjalan untuk menjalankan backup otomatis
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}