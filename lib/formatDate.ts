// File: /lib/formatDate.js

/**
 * Memformat tanggal ke format lokal Indonesia
 * @param {Date|string} date - Tanggal yang akan diformat (objek Date atau string tanggal)
 * @param {boolean} includeTime - Opsional, apakah waktu harus disertakan dalam output
 * @returns {string} - Tanggal yang diformat dalam bahasa Indonesia
 */
export function formatDateToLocale(date, includeTime = false) {
    // Pastikan input adalah objek Date
    const dateObj = date instanceof Date ? date : new Date(date);
    
    // Daftar nama bulan dalam bahasa Indonesia
    const bulanIndonesia = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    
    // Daftar nama hari dalam bahasa Indonesia
    const hariIndonesia = [
      'Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'
    ];
  
    // Dapatkan komponen tanggal
    const tanggal = dateObj.getDate();
    const bulan = bulanIndonesia[dateObj.getMonth()];
    const tahun = dateObj.getFullYear();
    const hari = hariIndonesia[dateObj.getDay()];
    
    // Format dasar: "Senin, 18 Maret 2025"
    let formatted = `${hari}, ${tanggal} ${bulan} ${tahun}`;
    
    // Tambahkan waktu jika diminta
    if (includeTime) {
      const jam = String(dateObj.getHours()).padStart(2, '0');
      const menit = String(dateObj.getMinutes()).padStart(2, '0');
      formatted += ` ${jam}:${menit} WIB`;
    }
    
    return formatted;
  }
  
  /**
   * Memformat tanggal ke format singkat (DD/MM/YYYY)
   * @param {Date|string} date - Tanggal yang akan diformat
   * @returns {string} - Tanggal dalam format singkat
   */
  export function formatShortDate(date) {
    // Pastikan input adalah objek Date
    const dateObj = date instanceof Date ? date : new Date(date);
    
    const tanggal = String(dateObj.getDate()).padStart(2, '0');
    const bulan = String(dateObj.getMonth() + 1).padStart(2, '0'); // Bulan dimulai dari 0
    const tahun = dateObj.getFullYear();
    
    return `${tanggal}/${bulan}/${tahun}`;
  }
  
  /**
   * Memformat tanggal ke format untuk input date HTML (YYYY-MM-DD)
   * @param {Date|string} date - Tanggal yang akan diformat
   * @returns {string} - Tanggal dalam format YYYY-MM-DD
   */
  export function formatDateForInput(date) {
    // Pastikan input adalah objek Date
    const dateObj = date instanceof Date ? date : new Date(date);
    
    const tahun = dateObj.getFullYear();
    const bulan = String(dateObj.getMonth() + 1).padStart(2, '0'); // Bulan dimulai dari 0
    const tanggal = String(dateObj.getDate()).padStart(2, '0');
    
    return `${tahun}-${bulan}-${tanggal}`;
  }
  
  /**
   * Mendapatkan rentang waktu relatif (misal: "2 jam yang lalu", "Kemarin")
   * @param {Date|string} date - Tanggal yang akan dihitung
   * @returns {string} - Teks rentang waktu relatif
   */
  export function getRelativeTimeFromNow(date) {
    const dateObj = date instanceof Date ? date : new Date(date);
    const now = new Date();
    
    const diffInMs = now - dateObj;
    const diffInSeconds = Math.floor(diffInMs / 1000);
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);
    
    if (diffInSeconds < 60) {
      return 'Baru saja';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes} menit yang lalu`;
    } else if (diffInHours < 24) {
      return `${diffInHours} jam yang lalu`;
    } else if (diffInDays === 1) {
      return 'Kemarin';
    } else if (diffInDays < 7) {
      return `${diffInDays} hari yang lalu`;
    } else {
      // Lebih dari seminggu, tampilkan format tanggal lengkap
      return formatDateToLocale(dateObj);
    }
  }