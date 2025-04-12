// FILE: app/(administrator)/dashboard-admin/backup/page.tsx
"use client";
import { useEffect, useState, useRef } from "react";
import { DownloadIcon, TrashIcon, RefreshCwIcon, CheckIcon, XIcon, SaveIcon } from "lucide-react";
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
import { DeleteConfirmModal } from '@/components/DeleteConfirmModal';
import { NeoProgressIndicator } from "./NeoProgresIndicator";

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

// Types for backup file
interface BackupFile {
  filename: string;
  size: number;
  created: string;
  path: string;
}

// Types for backup settings
interface BackupSettings {
  autoBackup: boolean;
  schedule: string;
  retention: number;
  backupDestination: string;
}

// Status message type
interface StatusMessage {
  type: string;
  text: string;
}

// API functions with axios
const api = {
  getSettings: async (): Promise<BackupSettings> => {
    const { data } = await axios.get("/api/backup/settings");
    return data;
  },
  
  saveSettings: async (settings: BackupSettings): Promise<{ success: boolean, settings: BackupSettings, message: string }> => {
    const { data } = await axios.post("/api/backup/settings", settings);
    return data;
  },
  
  getBackupFiles: async (): Promise<{ files: BackupFile[] }> => {
    const { data } = await axios.get("/api/backup/list");
    return data;
  },
  
  createBackup: async (): Promise<Blob> => {
    const response = await axios.get("/api/backup", {
      responseType: 'blob'
    });
    return response.data;
  },
  
  downloadBackup: async (filename: string): Promise<Blob> => {
    const response = await axios.get(`/api/backup/download/${filename}`, {
      responseType: 'blob'
    });
    return response.data;
  },
  
  deleteBackup: async (filename: string): Promise<{ success: boolean, message: string }> => {
    const { data } = await axios.delete(`/api/backup/delete/${filename}`);
    return data;
  }
};

// Wrapper component for QueryClient
function BackupPageWrapper() {
  return (
    <QueryClientProvider client={queryClient}>
      <BackupPage />
    </QueryClientProvider>
  );
}

function BackupPage() {
  const queryClient = useQueryClient();
  
  // Reference for polling interval
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // State for schedule editor mode
  const [isAdvancedSchedule, setIsAdvancedSchedule] = useState(false);
  
  // State for status messages
  const [message, setMessage] = useState<StatusMessage>({
    type: "",
    text: "",
  });

  // State for confirmation modal
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    filename: "",
  });

  // State for progress indicators
  const [showProgressIndicator, setShowProgressIndicator] = useState({
    download: false,
    backup: false,
  });

  // Queries and mutations
  const {
    data: serverSettings = {
      autoBackup: true,
      schedule: "0 0 * * *", // Default: midnight every day
      retention: 7, // Keep backups for 7 days
      backupDestination: "local", // Location: local storage
    },
    isLoading: isLoadingSettings,
  } = useQuery({
    queryKey: ['backupSettings'],
    queryFn: api.getSettings,
  });
  
  // Local state for form values (separating from server state)
  const [localSettings, setLocalSettings] = useState<BackupSettings>({
    autoBackup: true,
    schedule: "0 0 * * *",
    retention: 7,
    backupDestination: "local",
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
    data: backupFilesData = { files: [] },
    isLoading: isLoadingFiles,
    refetch: refetchFiles,
  } = useQuery({
    queryKey: ['backupFiles'],
    queryFn: api.getBackupFiles,
    refetchInterval: 10000, // Poll every 10 seconds
  });

  const backupFiles = backupFilesData.files || [];

  // Save settings mutation
  const saveSettingsMutation = useMutation({
    mutationFn: api.saveSettings,
    onSuccess: (data) => {
      setMessage({ 
        type: "success", 
        text: data.message || "Pengaturan backup berhasil disimpan" 
      });
      setTimeout(() => setMessage({ type: "", text: "" }), 3000);
      queryClient.invalidateQueries({ queryKey: ['backupSettings'] });
      setFormIsDirty(false);
    },
    onError: (error) => {
      console.error("Error saving settings:", error);
      setMessage({ 
        type: "error", 
        text: "Gagal menyimpan pengaturan backup" 
      });
    },
  });

  // Create backup mutation
  const createBackupMutation = useMutation({
    mutationFn: api.createBackup,
    onMutate: () => {
      setShowProgressIndicator({ ...showProgressIndicator, backup: true });
    },
    onSuccess: (blob) => {
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
      
      // Refresh backup list after 1 second
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['backupFiles'] });
      }, 1000);
      
      setTimeout(() => setMessage({ type: "", text: "" }), 3000);
      setShowProgressIndicator({ ...showProgressIndicator, backup: false });
    },
    onError: (error) => {
      console.error("Error running manual backup:", error);
      setMessage({ type: "error", text: "Gagal melakukan backup manual" });
      setShowProgressIndicator({ ...showProgressIndicator, backup: false });
    },
  });

  // Download backup mutation
  const downloadBackupMutation = useMutation({
    mutationFn: (filename: string) => api.downloadBackup(filename),
    onMutate: () => {
      setShowProgressIndicator({ ...showProgressIndicator, download: true });
    },
    onSuccess: (blob, filename) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      setMessage({ type: "success", text: "File backup berhasil diunduh" });
      setTimeout(() => setMessage({ type: "", text: "" }), 3000);
      setShowProgressIndicator({ ...showProgressIndicator, download: false });
    },
    onError: (error) => {
      console.error("Error downloading backup:", error);
      setMessage({ type: "error", text: "Gagal mengunduh file backup" });
      setShowProgressIndicator({ ...showProgressIndicator, download: false });
    },
  });

  // Delete backup mutation
  const deleteBackupMutation = useMutation({
    mutationFn: (filename: string) => api.deleteBackup(filename),
    onSuccess: () => {
      setMessage({ type: "success", text: "File backup berhasil dihapus" });
      setTimeout(() => setMessage({ type: "", text: "" }), 3000);
      queryClient.invalidateQueries({ queryKey: ['backupFiles'] });
    },
    onError: (error) => {
      console.error("Error deleting backup:", error);
      setMessage({ type: "error", text: "Gagal menghapus file backup" });
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
      queryClient.invalidateQueries({ queryKey: ['backupFiles'] });
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

  // Perform manual backup
  const manualBackup = () => {
    createBackupMutation.mutate();
  };

  // Download backup file
  const downloadBackup = (filename: string) => {
    downloadBackupMutation.mutate(filename);
  };

  // Delete backup file
  const openDeleteModal = (filename: string) => {
    setDeleteModal({
      isOpen: true,
      filename,
    });
  };

  const confirmDelete = () => {
    if (deleteModal.filename) {
      deleteBackupMutation.mutate(deleteModal.filename);
      setDeleteModal({ isOpen: false, filename: "" });
    }
  };

  const closeDeleteModal = () => {
    setDeleteModal({ isOpen: false, filename: "" });
  };

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(2)} KB`;
    const mb = kb / 1024;
    return `${mb.toFixed(2)} MB`;
  };

  // Translate cron schedule to human language
  const translateCronSchedule = (schedule: string) => {
    const parts = schedule.split(" ");
    if (parts.length !== 5) return schedule;

    // Common schedules
    if (schedule === "0 0 * * *") return "Setiap hari pada jam 00:00";
    if (schedule === "0 0 * * 0") return "Setiap hari Minggu pada jam 00:00";
    if (schedule === "0 0 1 * *") return "Setiap tanggal 1 pada jam 00:00";
    if (schedule === "0 0 1 1 *") return "Setiap 1 Januari pada jam 00:00";
    if (schedule === "0 8 * * *") return "Setiap hari pada jam 08:00";

    // Other custom schedules
    return schedule;
  };

  // Helper for schedule presets
  const schedulePresets = [
    { label: "Setiap hari (00:00)", value: "0 0 * * *" },
    { label: "Setiap hari (08:00)", value: "0 8 * * *" },
    { label: "Setiap minggu (Minggu 00:00)", value: "0 0 * * 0" },
    { label: "Setiap bulan (tanggal 1, 00:00)", value: "0 0 1 * *" },
    { label: "Setiap tahun (1 Januari, 00:00)", value: "0 0 1 1 *" },
  ];

  return (
    <div className="bg-[#F1F6F9] min-h-screen p-4">
      {/* Progress indicators */}
      <NeoProgressIndicator 
        isLoading={showProgressIndicator.backup} 
        message="Creating Backup..." 
      />
      <NeoProgressIndicator 
        isLoading={showProgressIndicator.download} 
        message="Downloading Backup..." 
      />
      <DeleteConfirmModal 
        isOpen={deleteModal.isOpen}
        onClose={closeDeleteModal}
        onConfirm={confirmDelete}
        itemName={deleteModal.filename}
        subject="File Backup"
      />

      {/* Header */}
      <div className="flex items-center justify-between mb-6 bg-[#6C9BCF] text-white py-3 px-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] border-2 border-black">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold tracking-tight uppercase">BACKUP DATABASE</h1>
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
        {/* Settings panel */}
        <div className="bg-[#fff] p-5 rounded-none border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]">
          <h2 className="text-2xl font-bold uppercase mb-6 text-black">PENGATURAN BACKUP</h2>

          <div className="space-y-6">
            {/* Auto backup */}
            <div className="flex items-center gap-3 bg-white p-3 border-2 border-black">
              <input 
                type="checkbox" 
                id="autoBackup" 
                checked={localSettings.autoBackup} 
                onChange={(e) => handleSettingChange('autoBackup', e.target.checked)} 
                className="w-6 h-6 border-2 border-black"
                disabled={saveSettingsMutation.isPending}
              />
              <label htmlFor="autoBackup" className="font-bold text-lg">
                AKTIFKAN BACKUP OTOMATIS
              </label>
            </div>

            {/* Retention period */}
            <div className="bg-white p-4 border-2 border-black">
              <label htmlFor="retention" className="block font-bold text-lg mb-2 uppercase">
                PERIODE RETENSI (HARI)
              </label>
              <input
                type="number"
                id="retention"
                min="1"
                max="365"
                value={localSettings.retention}
                onChange={(e) => {
                  const value = e.target.value === "" ? 7 : parseInt(e.target.value);
                  handleSettingChange('retention', value);
                }}
                className="border-2 border-black py-2 px-3 w-full font-mono text-xl bg-white"
                disabled={saveSettingsMutation.isPending}
              />
              <p className="mt-2 text-black">File backup lebih lama dari periode ini akan dihapus otomatis (maks. 365 hari)</p>
            </div>

            {/* Schedule */}
            <div className="bg-white p-4 border-2 border-black">
              <label className="block font-bold text-lg mb-2 uppercase">JADWAL BACKUP</label>

              {/* Choice between preset or advanced */}
              <div className="flex items-center gap-2 mb-4">
                <button 
                  onClick={() => setIsAdvancedSchedule(false)} 
                  className={`px-4 py-2 border-2 border-black font-bold ${
                    !isAdvancedSchedule 
                      ? "bg-[#6C9BCF] text-white" 
                      : "bg-white text-black"
                  }`}
                  disabled={saveSettingsMutation.isPending}
                >
                  JADWAL UMUM
                </button>
                <button 
                  onClick={() => setIsAdvancedSchedule(true)} 
                  className={`px-4 py-2 border-2 border-black font-bold ${
                    isAdvancedSchedule 
                      ? "bg-[#6C9BCF] text-white" 
                      : "bg-white text-black"
                  }`}
                  disabled={saveSettingsMutation.isPending}
                >
                  FORMAT CRON
                </button>
              </div>

              {/* Preset selections */}
              {!isAdvancedSchedule ? (
                <select 
                  value={localSettings.schedule} 
                  onChange={(e) => handleSettingChange('schedule', e.target.value)} 
                  className="border-2 border-black px-3 py-2 w-full font-mono bg-white"
                  disabled={saveSettingsMutation.isPending}
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
                    value={localSettings.schedule} 
                    onChange={(e) => handleSettingChange('schedule', e.target.value)} 
                    className="border-2 border-black px-3 py-2 w-full font-mono bg-white"
                    placeholder="0 0 * * *" 
                    disabled={saveSettingsMutation.isPending}
                  />
                  <p className="text-black">
                    Format: menit jam hari-bulan bulan hari-minggu
                    <br />
                    Contoh: 0 0 * * * = setiap hari pada jam 00:00
                  </p>
                </div>
              )}

              <p className="mt-3 text-black font-bold">
                Jadwal saat ini: {translateCronSchedule(localSettings.schedule)}
              </p>
            </div>

            {/* Save settings button */}
            <button
              onClick={handleSaveSettings}
              disabled={saveSettingsMutation.isPending || !formIsDirty}
              className={`flex items-center justify-center gap-2 w-full p-3 font-bold text-lg border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] transition-transform hover:translate-x-1 hover:translate-y-1 hover:shadow-none ${
                formIsDirty 
                  ? "bg-[#6C9BCF] text-white hover:bg-[#6C9BCF]/90" 
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

        {/* Manual backup panel */}
        <div className="bg-[#fff] p-5 rounded-none border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]">
          <h2 className="text-2xl font-bold uppercase mb-6 text-black">BACKUP MANUAL</h2>

          <button
            onClick={manualBackup}
            disabled={createBackupMutation.isPending}
            className="flex items-center justify-center gap-3 bg-green-500 text-white border-2 border-black p-4 font-bold text-xl uppercase w-full hover:bg-green-600 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-transform hover:translate-x-1 hover:translate-y-1 hover:shadow-none mb-6"
          >
            {createBackupMutation.isPending ? (
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

          {/* File format explanation */}
          <div className="bg-white p-4 border-2 border-black">
            <p className="font-bold text-lg uppercase">FORMAT FILE</p>
            <p className="mt-2 text-black">File backup berformat PostgreSQL custom (.backup) yang dapat dipulihkan menggunakan pg_restore.</p>
          </div>
        </div>
      </div>

      {/* Backup file list */}
      <div className="mt-8 bg-[#fff]/80 p-5 rounded-none border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold uppercase text-black">DAFTAR FILE BACKUP</h2>

          <div className="flex items-center gap-2">
            {/* Real-time update info */}
            <div className="text-xs font-mono bg-white px-2 py-1 border border-black">
              <span className="mr-1">REAL-TIME</span>
              <span className="inline-block h-2 w-2 bg-green-500 rounded-full animate-pulse"></span>
            </div>
            
            <button 
              onClick={() => refetchFiles()} 
              disabled={isLoadingFiles}
              className="p-2 bg-white border-2 border-black hover:bg-gray-100"
            >
              <RefreshCwIcon size={24} className={isLoadingFiles ? "animate-spin text-[#6C9BCF]" : ""} />
            </button>
          </div>
        </div>

        {isLoadingFiles && backupFiles.length === 0 ? (
          <div className="py-10 text-center text-black">
            <div className="animate-spin h-12 w-12 border-4 border-black border-t-transparent rounded-full mx-auto"></div>
            <p className="mt-4 font-bold text-lg">MEMUAT DAFTAR BACKUP...</p>
          </div>
        ) : backupFiles.length === 0 ? (
          <div className="py-10 bg-white border-2 border-black text-center">
            <p className="font-bold text-lg text-black">BELUM ADA FILE BACKUP TERSIMPAN</p>
            <p className="text-gray-600 mt-2">Gunakan tombol &quot;BACKUP & DOWNLOAD SEKARANG&quot; untuk membuat backup baru</p>
          </div>
        ) : (
          <div className="border-2 border-black bg-white">
            <div className="max-h-96 overflow-y-auto">
              <table className="min-w-full">
                <thead className="bg-[#6C9BCF] text-white sticky top-0 z-10">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-bold uppercase">NAMA FILE</th>
                    <th className="px-6 py-3 text-left text-sm font-bold uppercase">UKURAN</th>
                    <th className="px-6 py-3 text-left text-sm font-bold uppercase">DIBUAT</th>
                    <th className="px-6 py-3 text-right text-sm font-bold uppercase">AKSI</th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-gray-200">
                  {backupFiles.map((file) => (
                    <tr key={file.filename} className="hover:bg-[#F1F6F9]">
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
                            disabled={downloadBackupMutation.isPending}
                            className="bg-[#6C9BCF] text-white px-3 py-2 border-2 border-black hover:bg-[#6C9BCF]/80 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-transform hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none"
                          >
                            <DownloadIcon size={18} />
                          </button>
                          <button 
                            onClick={() => openDeleteModal(file.filename)} 
                            disabled={deleteBackupMutation.isPending}
                            className="bg-[#fc3a3a] text-white px-3 py-2 border-2 border-black hover:bg-[#FF9B9B]/80 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-transform hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none"
                          >
                            {deleteBackupMutation.isPending && deleteBackupMutation.variables === file.filename ? (
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

            {/* Scroll indicator */}
            {backupFiles.length > 5 && (
              <div className="text-center text-xs py-1 border-t border-gray-200 bg-gray-50">
                <span>Scroll untuk melihat semua file</span>
              </div>
            )}
          </div>
        )}
        
        {/* Data refresh indicator */}
        {isLoadingFiles && backupFiles.length > 0 && (
          <div className="mt-2 text-xs font-mono flex items-center justify-end gap-2">
            <span className="animate-spin h-3 w-3 border-2 border-[#6C9BCF] border-t-transparent rounded-full"></span>
            <span>MEMPERBARUI DATA...</span>
          </div>
        )}
      </div>

      {/* Usage guide */}
      <div className="mt-8 bg-[#F1F6F9] p-5 rounded-none border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]">
        <h2 className="text-2xl font-bold uppercase mb-4 text-black">PANDUAN BACKUP</h2>

        <div className="bg-[#FFD966] p-4 border-2 border-black">
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
         
        </div>
      </div>
    </div>
  );
}

export default BackupPageWrapper;