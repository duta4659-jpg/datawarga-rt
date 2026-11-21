import { createWorker } from 'tesseract.js';
import {
  GolonganDarah,
  JenisKelamin,
  StatusPerkawinan,
} from '../types/models';

export interface ParsedWargaDraft {
  NIK: string;
  Nama_Lengkap: string;
  Tempat_Lahir: string;
  Tanggal_Lahir: string;
  Jenis_Kelamin: JenisKelamin;
  Golongan_Darah: GolonganDarah;
  Agama: string;
  Pendidikan_Terakhir: string;
  Pekerjaan: string;
  Status_Perkawinan: StatusPerkawinan;
  Status_Dalam_Keluarga: string;
}

export interface ParsedKKResult {
  Nomor_KK: string;
  Alamat_Lengkap: string;
  anggota: ParsedWargaDraft[];
  rawText: string;
}

function normalizeOCRDigits(token: string): string {
  return token
    .replace(/[OoQD]/g, '0')
    .replace(/[Il|!]/g, '1')
    .replace(/[Zz]/g, '2')
    .replace(/[Ss]/g, '5')
    .replace(/[Bb]/g, '8')
    .replace(/\D/g, '');
}

function parseDateDDMMYYYY(raw: string): string {
  const match = raw.match(/(\d{2})[-/.](\d{2})[-/.](\d{4})/);
  if (!match) return '';
  const [, dd, mm, yyyy] = match;
  const day = Number(dd);
  const month = Number(mm);
  const year = Number(yyyy);
  if (day < 1 || day > 31 || month < 1 || month > 12 || year < 1900 || year > 2100) {
    return '';
  }
  return `${yyyy}-${mm}-${dd}`;
}

function detectAgama(text: string): string {
  const upper = text.toUpperCase();
  if (upper.includes('ISLAM')) return 'Islam';
  if (upper.includes('KRISTEN') || upper.includes('PROTESTAN')) return 'Kristen';
  if (upper.includes('KATOLIK')) return 'Katolik';
  if (upper.includes('HINDU')) return 'Hindu';
  if (upper.includes('BUDDHA') || upper.includes('BUDHA')) return 'Buddha';
  if (upper.includes('KONGHUCU')) return 'Konghucu';
  return 'Islam';
}

function detectStatusPerkawinan(text: string): StatusPerkawinan {
  const upper = text.toUpperCase();
  if (upper.includes('BELUM KAWIN')) return 'Belum Kawin';
  if (upper.includes('CERAI HIDUP')) return 'Cerai Hidup';
  if (upper.includes('CERAI MATI')) return 'Cerai Mati';
  if (upper.includes('KAWIN')) return 'Kawin';
  return 'Belum Kawin';
}

function detectStatusKeluarga(text: string): string {
  const upper = text.toUpperCase();
  if (upper.includes('KEPALA KELUARGA')) return 'Kepala Keluarga';
  if (upper.includes('ISTRI')) return 'Istri';
  if (upper.includes('ANAK')) return 'Anak';
  if (upper.includes('MERTUA')) return 'Mertua';
  if (upper.includes('ORANG TUA')) return 'Orang Tua';
  if (upper.includes('FAMILI')) return 'Famili Lain';
  return 'Kepala Keluarga';
}

function detectPendidikan(text: string): string {
  const upper = text.toUpperCase();
  if (upper.includes('STRATA II') || upper.includes('S2') || upper.includes('S3')) {
    return 'Magister/Doktor (S2/S3)';
  }
  if (upper.includes('STRATA I') || upper.includes('DIPLOMA IV') || upper.includes('S1')) {
    return 'Sarjana (S1/D4)';
  }
  if (upper.includes('DIPLOMA') || upper.includes('AKADEMI')) return 'Diploma (D1-D3)';
  if (upper.includes('SLTA') || upper.includes('SMA') || upper.includes('SMK')) {
    return 'SMA/SMK/Sederajat';
  }
  if (upper.includes('SLTP') || upper.includes('SMP')) return 'SMP/Sederajat';
  if (upper.includes('TAMAT SD') || /\bSD\b/.test(upper)) return 'SD/Sederajat';
  if (upper.includes('BELUM SEKOLAH') || upper.includes('TIDAK/BELUM')) {
    return 'Belum/Tidak Sekolah';
  }
  return 'SMA/SMK/Sederajat';
}

function extractNameBeforeNikOrFromLine(line: string, nikRaw: string): string {
  const cleaned = line
    .replace(nikRaw, ' ')
    .replace(/^\s*\d{1,2}[.)]?\s*/, '')
    .replace(/LAKI[-\s]*LAKI|PEREMPUAN/gi, ' ')
    .replace(/\d{2}[-/.]\d{2}[-/.]\d{4}/g, ' ')
    .replace(/[^A-Za-z\s.'-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Take first 2-4 title-cased words that look like a name
  const words = cleaned
    .split(' ')
    .filter((w) => w.length >= 2 && !['NO', 'NIK', 'NAMA', 'LENGKAP'].includes(w.toUpperCase()));
  if (words.length === 0) return '';
  return words
    .slice(0, 4)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

export function parseKKText(rawText: string): ParsedKKResult {
  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  let nomorKK = '';
  const allSixteenDigits: string[] = [];

  // Look for "No." line first for Nomor KK
  for (const line of lines) {
    const tokens = line.match(/[0-9OoQDIl|!ZzSsBb]{14,18}/g) ?? [];
    for (const t of tokens) {
      const normalized = normalizeOCRDigits(t);
      if (normalized.length === 16) {
        allSixteenDigits.push(normalized);
        if (!nomorKK && (/NO\.?\s*[:\-]?/i.test(line) || /KARTU\s*KELUARGA/i.test(line) || allSixteenDigits.length === 1)) {
          nomorKK = normalized;
        }
      }
    }
  }

  // Extract Alamat
  let alamat = '';
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/ALAMAT\s*[:\-]?/i.test(line)) {
      const afterColon = line.replace(/.*ALAMAT\s*[:\-]?\s*/i, '').trim();
      const extraParts: string[] = [];
      if (afterColon) extraParts.push(afterColon);
      for (let j = i + 1; j < Math.min(lines.length, i + 4); j++) {
        if (/RT\s*\/?\s*RW|DESA|KELURAHAN|KECAMATAN/i.test(lines[j])) {
          extraParts.push(lines[j].replace(/^(RT\/RW|DESA\/KELURAHAN|KECAMATAN)\s*[:\-]?\s*/i, ''));
        }
      }
      alamat = extraParts.join(', ').replace(/\s+/g, ' ').trim();
      break;
    }
  }

  // Extract family member rows by scanning lines containing a 16-digit NIK (excluding Nomor KK if repeated on header)
  const nikSet = new Set<string>();
  const anggota: ParsedWargaDraft[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const tokens = line.match(/[0-9OoQDIl|!ZzSsBb]{15,18}/g) ?? [];
    for (const token of tokens) {
      const nik = normalizeOCRDigits(token);
      if (nik.length === 16 && nik !== nomorKK && !nikSet.has(nik)) {
        nikSet.add(nik);
        const contextWindow = [lines[i], lines[i + 1] ?? '', lines[i + 2] ?? ''].join(' ');
        const isPerempuan = /PEREMPUAN/i.test(contextWindow) || Number(nik.slice(6, 8)) > 40;
        const tglLahirFromText = parseDateDDMMYYYY(contextWindow);

        // Fallback birth date from Indonesian NIK digits 7..12 (DDMMYY) if OCR missed the date column
        let tglLahir = tglLahirFromText;
        if (!tglLahir) {
          let dd = Number(nik.slice(6, 8));
          const mm = Number(nik.slice(8, 10));
          const yy = Number(nik.slice(10, 12));
          if (dd > 40) dd -= 40;
          if (dd >= 1 && dd <= 31 && mm >= 1 && mm <= 12) {
            const currentYY = new Date().getFullYear() % 100;
            const fullYear = yy <= currentYY ? 2000 + yy : 1900 + yy;
            tglLahir = `${fullYear}-${String(mm).padStart(2, '0')}-${String(dd).padStart(2, '0')}`;
          }
        }

        // Blood type detection
        let golDarah: GolonganDarah = '-';
        const gdMatch = contextWindow.match(/\b(AB|A|B|O)\b/);
        if (gdMatch && ['A', 'B', 'AB', 'O'].includes(gdMatch[1])) {
          golDarah = gdMatch[1] as GolonganDarah;
        }

        // Place of birth heuristic: word right before DD-MM-YYYY
        let tempatLahir = '';
        const birthMatch = contextWindow.match(/([A-Z]{3,})\s+\d{2}[-/.]\d{2}[-/.]\d{4}/);
        if (birthMatch) {
          const w = birthMatch[1];
          tempatLahir = w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
        }

        anggota.push({
          NIK: nik,
          Nama_Lengkap: extractNameBeforeNikOrFromLine(line, token),
          Tempat_Lahir: tempatLahir,
          Tanggal_Lahir: tglLahir,
          Jenis_Kelamin: isPerempuan ? 'Perempuan' : 'Laki-laki',
          Golongan_Darah: golDarah,
          Agama: detectAgama(contextWindow),
          Pendidikan_Terakhir: detectPendidikan(contextWindow),
          Pekerjaan: '',
          Status_Perkawinan: detectStatusPerkawinan(contextWindow),
          Status_Dalam_Keluarga: anggota.length === 0 ? 'Kepala Keluarga' : detectStatusKeluarga(contextWindow),
        });
      }
    }
  }

  return {
    Nomor_KK: nomorKK,
    Alamat_Lengkap: alamat,
    anggota,
    rawText,
  };
}

export async function runKKOcr(
  imageFile: File | Blob,
  onProgress?: (progress: number, statusLabel: string) => void
): Promise<ParsedKKResult> {
  onProgress?.(5, 'Menyiapkan mesin OCR lokal...');
  let worker: Awaited<ReturnType<typeof createWorker>> | null = null;
  try {
    // Prefer Indonesian + English, fallback to English if Indonesian pack unavailable offline
    try {
      worker = await createWorker('ind+eng', 1, {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            onProgress?.(Math.round(20 + m.progress * 75), 'Membaca teks Kartu Keluarga...');
          } else if (m.status) {
            onProgress?.(15, 'Memuat model OCR...');
          }
        },
      });
    } catch {
      worker = await createWorker('eng', 1, {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            onProgress?.(Math.round(20 + m.progress * 75), 'Membaca teks Kartu Keluarga...');
          }
        },
      });
    }

    const result = await worker.recognize(imageFile);
    onProgress?.(100, 'Ekstraksi selesai');
    return parseKKText(result.data.text || '');
  } finally {
    if (worker) {
      await worker.terminate();
    }
  }
}
