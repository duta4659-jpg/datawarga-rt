export type JenisKelamin = 'Laki-laki' | 'Perempuan';

export type GolonganDarah = 'A' | 'B' | 'AB' | 'O' | '-';

export type StatusPerkawinan = 'Belum Kawin' | 'Kawin' | 'Cerai Hidup' | 'Cerai Mati';

export type StatusDalamKeluarga =
  | 'Kepala Keluarga'
  | 'Istri'
  | 'Anak'
  | 'Mertua'
  | 'Orang Tua'
  | 'Famili Lain'
  | string;

export type StatusRumah = 'Milik Sendiri' | 'Kontrak' | 'Numpang' | string;

export type JenisBantuan = 'PKH' | 'BPNT/Sembako' | 'BLT Desa' | 'PBI BPJS' | string;

export type StatusBantuan = 'Aktif' | 'Non-Aktif';

export type AgeCategory = 'Batita' | 'Balita' | 'Usia Sekolah' | 'Dewasa' | 'Lansia';

export interface Keluarga {
  Nomor_KK: string; // 16 digit Primary Key
  Alamat_Lengkap: string;
  Tanggal_Pendataan: string; // YYYY-MM-DD
}

export interface Warga {
  NIK: string; // 16 digit Primary Key
  Nomor_KK: string; // Foreign Key -> Keluarga.Nomor_KK
  Nama_Lengkap: string;
  Tempat_Lahir: string;
  Tanggal_Lahir: string; // YYYY-MM-DD
  Jenis_Kelamin: JenisKelamin;
  Golongan_Darah: GolonganDarah;
  Agama: string;
  Pendidikan_Terakhir: string;
  Pekerjaan: string;
  Status_Perkawinan: StatusPerkawinan;
  Status_Dalam_Keluarga: StatusDalamKeluarga;
  No_Plat_Kendaraan: string | null;
  Status_Rumah: StatusRumah;
  Catatan_Kesehatan: string | null;
}

export interface BantuanSosial {
  ID_Bantuan?: number; // Auto-increment Primary Key
  NIK: string; // Foreign Key -> Warga.NIK
  Jenis_Bantuan: JenisBantuan;
  Tahun_Penerimaan: number;
  Status: StatusBantuan;
}

export interface WargaEnriched extends Warga {
  keluarga?: Keluarga;
  bantuanList: BantuanSosial[];
  usiaTahun: number;
  usiaBulan: number;
  usiaFormatted: string;
  kategoriUsia: AgeCategory;
}

export interface RTProfile {
  namaRT: string;
  namaKetuaRT: string;
  kelurahan: string;
  kecamatan: string;
}

export type ActiveTab = 'dashboard' | 'input' | 'warga' | 'laporan';

export type LaporanFilter =
  | 'SEMUA'
  | 'LANSIA'
  | 'BALITA_BATITA'
  | 'USIA_SEKOLAH'
  | 'DEWASA'
  | 'PKH'
  | 'BPNT/Sembako'
  | 'BLT Desa'
  | 'PBI BPJS'
  | 'SEMUA_BANSOS';

export const JENIS_KELAMIN_OPTIONS: JenisKelamin[] = ['Laki-laki', 'Perempuan'];

export const GOLONGAN_DARAH_OPTIONS: GolonganDarah[] = ['A', 'B', 'AB', 'O', '-'];

export const STATUS_PERKAWINAN_OPTIONS: StatusPerkawinan[] = [
  'Belum Kawin',
  'Kawin',
  'Cerai Hidup',
  'Cerai Mati',
];

export const STATUS_KELUARGA_PRESETS: string[] = [
  'Kepala Keluarga',
  'Istri',
  'Anak',
  'Mertua',
  'Orang Tua',
  'Famili Lain',
];

export const STATUS_RUMAH_PRESETS: string[] = ['Milik Sendiri', 'Kontrak', 'Numpang'];

export const AGAMA_OPTIONS: string[] = [
  'Islam',
  'Kristen',
  'Katolik',
  'Hindu',
  'Buddha',
  'Konghucu',
  'Kepercayaan Lainnya',
];

export const PENDIDIKAN_OPTIONS: string[] = [
  'Belum/Tidak Sekolah',
  'SD/Sederajat',
  'SMP/Sederajat',
  'SMA/SMK/Sederajat',
  'Diploma (D1-D3)',
  'Sarjana (S1/D4)',
  'Magister/Doktor (S2/S3)',
];

export const BANSOS_PRESETS: string[] = [
  'PKH',
  'BPNT/Sembako',
  'BLT Desa',
  'PBI BPJS',
];

export const LAPORAN_FILTER_OPTIONS: { value: LaporanFilter; label: string }[] = [
  { value: 'SEMUA', label: 'Semua Warga' },
  { value: 'LANSIA', label: 'Lansia (>= 65 Tahun)' },
  { value: 'BALITA_BATITA', label: 'Balita & Batita (0 - 5 Tahun)' },
  { value: 'USIA_SEKOLAH', label: 'Usia Sekolah (6 - 17 Tahun)' },
  { value: 'DEWASA', label: 'Dewasa (18 - 64 Tahun)' },
  { value: 'PKH', label: 'Penerima PKH' },
  { value: 'BPNT/Sembako', label: 'Penerima BPNT/Sembako' },
  { value: 'BLT Desa', label: 'Penerima BLT Desa' },
  { value: 'PBI BPJS', label: 'Penerima PBI BPJS' },
  { value: 'SEMUA_BANSOS', label: 'Semua Penerima Bantuan Sosial Aktif' },
];
