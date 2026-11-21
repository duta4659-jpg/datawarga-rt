import { AgeCategory } from '../types/models';

export interface AgeResult {
  years: number;
  months: number;
  formatted: string;
  category: AgeCategory;
}

export function getAgeCategory(years: number): AgeCategory {
  if (years <= 2) return 'Batita';
  if (years <= 5) return 'Balita';
  if (years <= 17) return 'Usia Sekolah';
  if (years <= 64) return 'Dewasa';
  return 'Lansia';
}

export function calculateAge(tanggalLahir: string, referenceDate: Date = new Date()): AgeResult {
  if (!tanggalLahir) {
    return {
      years: 0,
      months: 0,
      formatted: '0 Tahun 0 Bulan',
      category: 'Batita',
    };
  }

  const parts = tanggalLahir.split('-').map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) {
    return {
      years: 0,
      months: 0,
      formatted: '0 Tahun 0 Bulan',
      category: 'Batita',
    };
  }

  const [birthYear, birthMonth, birthDay] = parts;
  const birth = new Date(birthYear, birthMonth - 1, birthDay);

  if (isNaN(birth.getTime()) || birth > referenceDate) {
    return {
      years: 0,
      months: 0,
      formatted: '0 Tahun 0 Bulan',
      category: 'Batita',
    };
  }

  let years = referenceDate.getFullYear() - birth.getFullYear();
  let months = referenceDate.getMonth() - birth.getMonth();
  const days = referenceDate.getDate() - birth.getDate();

  if (days < 0) {
    months -= 1;
  }

  if (months < 0) {
    years -= 1;
    months += 12;
  }

  if (years < 0) {
    years = 0;
    months = 0;
  }

  return {
    years,
    months,
    formatted: `${years} Tahun ${months} Bulan`,
    category: getAgeCategory(years),
  };
}

export function isValid16Digits(value: string): boolean {
  return /^\d{16}$/.test(value.trim());
}

export function sanitizeDigits(value: string, maxLength = 16): string {
  return value.replace(/\D/g, '').slice(0, maxLength);
}

export function formatDateIndo(dateStr: string): string {
  if (!dateStr) return '-';
  const parts = dateStr.split('-').map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return dateStr;
  const [y, m, d] = parts;
  const bulan = [
    'Januari',
    'Februari',
    'Maret',
    'April',
    'Mei',
    'Juni',
    'Juli',
    'Agustus',
    'September',
    'Oktober',
    'November',
    'Desember',
  ];
  return `${d} ${bulan[m - 1] ?? ''} ${y}`;
}

export function todayISO(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
