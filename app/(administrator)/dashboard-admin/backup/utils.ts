// Tambahkan fungsi utilitas ini ke file dashboard-admin/backup/utils.ts

/**
 * Validasi format jadwal cron
 * @param cronExp Ekspresi cron yang akan divalidasi
 * @returns Hasil validasi beserta pesan error jika tidak valid
 */
export const validateCronSchedule = (cronExp: string): { valid: boolean; error?: string } => {
    // Cek macro yang tidak didukung
    const commonMistakes: Record<string, string> = {
      '@daily': 'Macro "@daily" tidak didukung, gunakan format eksplisit: 0 0 * * *',
      '@weekly': 'Macro "@weekly" tidak didukung, gunakan format eksplisit: 0 0 * * 0',
      '@monthly': 'Macro "@monthly" tidak didukung, gunakan format eksplisit: 0 0 1 * *',
      '@yearly': 'Macro "@yearly" tidak didukung, gunakan format eksplisit: 0 0 1 1 *',
    };
  
    if (commonMistakes[cronExp]) {
      return { valid: false, error: commonMistakes[cronExp] };
    }
  
    // Cek jumlah bagian dalam format cron
    const parts = cronExp.split(' ');
    if (parts.length !== 5) {
      return { 
        valid: false, 
        error: `Format cron harus terdiri dari 5 bagian, bukan ${parts.length}`
      };
    }
  
    // Validasi menggunakan node-cron (jika tersedia di client)
    try {
      // Impor node-cron secara bersyarat (opsional)
      // const cron = require('node-cron');
      // if (cron && !cron.validate(cronExp)) {
      //   return { valid: false, error: 'Format cron tidak valid' };
      // }
      
      // Cek format dasar dengan regex
      const basicPattern = /^[*\/,0-9-]+ [*\/,0-9-]+ [*\/,0-9-]+ [*\/,0-9-]+ [*\/,0-9-]+$/;
      if (!basicPattern.test(cronExp)) {
        return {
          valid: false,
          error: 'Format cron tidak valid. Gunakan: menit jam hari-bulan bulan hari-minggu'
        };
      }
  
      // Validasi masing-masing bagian
      const [minute, hour, dayMonth, month, dayWeek] = parts;
      
      // Validasi menit (0-59)
      if (!isValidCronPart(minute, 0, 59)) {
        return { valid: false, error: 'Menit harus antara 0-59 atau format yang valid (* atau */n)' };
      }
      
      // Validasi jam (0-23)
      if (!isValidCronPart(hour, 0, 23)) {
        return { valid: false, error: 'Jam harus antara 0-23 atau format yang valid (* atau */n)' };
      }
      
      // Validasi hari dalam bulan (1-31)
      if (!isValidCronPart(dayMonth, 1, 31)) {
        return { valid: false, error: 'Hari-bulan harus antara 1-31 atau format yang valid (* atau */n)' };
      }
      
      // Validasi bulan (1-12)
      if (!isValidCronPart(month, 1, 12)) {
        return { valid: false, error: 'Bulan harus antara 1-12 atau format yang valid (* atau */n)' };
      }
      
      // Validasi hari dalam minggu (0-6)
      if (!isValidCronPart(dayWeek, 0, 6)) {
        return { valid: false, error: 'Hari-minggu harus antara 0-6 atau format yang valid (* atau */n)' };
      }
  
      return { valid: true };
    } catch (error) {
      return { valid: false, error: 'Error validasi format cron' };
    }
  };
  
  /**
   * Validasi bagian dari ekspresi cron
   * @param part Bagian dari ekspresi cron
   * @param min Nilai minimum yang diizinkan
   * @param max Nilai maksimum yang diizinkan
   * @returns true jika valid, false jika tidak valid
   */
  const isValidCronPart = (part: string, min: number, max: number): boolean => {
    // Jika wildcard atau step
    if (part === '*' || /^\*\/[0-9]+$/.test(part)) {
      return true;
    }
    
    // Jika berisi koma (daftar nilai)
    if (part.includes(',')) {
      return part.split(',').every(item => {
        const num = parseInt(item, 10);
        return !isNaN(num) && num >= min && num <= max;
      });
    }
    
    // Jika rentang (x-y)
    if (part.includes('-')) {
      const [start, end] = part.split('-').map(v => parseInt(v, 10));
      return !isNaN(start) && !isNaN(end) && 
             start >= min && start <= max && 
             end >= min && end <= max && 
             start <= end;
    }
    
    // Jika nilai tunggal
    const num = parseInt(part, 10);
    return !isNaN(num) && num >= min && num <= max;
  };
  
  /**
   * Validasi pengaturan periode retensi
   * @param days Jumlah hari retensi
   * @returns Hasil validasi beserta pesan error jika tidak valid
   */
  export const validateRetention = (days: any): { valid: boolean; error?: string } => {
    if (typeof days !== 'number') {
      return { valid: false, error: 'Periode retensi harus berupa angka' };
    }
    
    if (isNaN(days)) {
      return { valid: false, error: 'Periode retensi tidak valid' };
    }
    
    if (days < 1) {
      return { valid: false, error: 'Periode retensi minimal 1 hari' };
    }
    
    if (days > 365) {
      return { valid: false, error: 'Periode retensi maksimal 365 hari' };
    }
    
    return { valid: true };
  };
  
