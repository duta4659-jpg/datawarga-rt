import Dexie, { Table } from 'dexie';
import {
  BantuanSosial,
  Keluarga,
  RTProfile,
  Warga,
  WargaEnriched,
} from '../types/models';
import { calculateAge } from '../utils/age';

export class DataWargaRTDatabase extends Dexie {
  keluarga!: Table<Keluarga, string>;
  warga!: Table<Warga, string>;
  bantuan_sosial!: Table<BantuanSosial, number>;

  constructor() {
    super('DataWargaRT_LocalDB');
    this.version(1).stores({
      keluarga: '&Nomor_KK, Tanggal_Pendataan',
      warga: '&NIK, Nomor_KK, Nama_Lengkap, Tanggal_Lahir, Jenis_Kelamin',
      bantuan_sosial: '++ID_Bantuan, NIK, Jenis_Bantuan, Tahun_Penerimaan, Status',
    });
  }
}

export const db = new DataWargaRTDatabase();

const INIT_FLAG_KEY = 'datawarga_rt_seeded_v1';
const RT_PROFILE_KEY = 'datawarga_rt_profile_v1';

export const DEFAULT_RT_PROFILE: RTProfile = {
  namaRT: 'RT 004 / RW 002',
  namaKetuaRT: 'Bapak H. Hendra Wijaya',
  kelurahan: 'Kelurahan Sukamaju',
  kecamatan: 'Kecamatan Sukaraja',
};

export function getRTProfile(): RTProfile {
  try {
    const raw = localStorage.getItem(RT_PROFILE_KEY);
    if (!raw) return DEFAULT_RT_PROFILE;
    return { ...DEFAULT_RT_PROFILE, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_RT_PROFILE;
  }
}

export function saveRTProfile(profile: RTProfile): void {
  localStorage.setItem(RT_PROFILE_KEY, JSON.stringify(profile));
}

export async function ensureInitialSampleData(): Promise<void> {
  const alreadySeeded = localStorage.getItem(INIT_FLAG_KEY);
  const existingCount = await db.warga.count();
  if (alreadySeeded || existingCount > 0) {
    localStorage.setItem(INIT_FLAG_KEY, '1');
    return;
  }

  await seedSampleData();
  localStorage.setItem(INIT_FLAG_KEY, '1');
}

export async function seedSampleData(): Promise<void> {
  const now = new Date();
  const yr = now.getFullYear();

  const makeBirthDate = (yearsAgo: number, monthsAgo: number, day = 12): string => {
    const d = new Date(now.getFullYear() - yearsAgo, now.getMonth() - monthsAgo, day);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${dd}`;
  };

  const today = makeBirthDate(0, 0, now.getDate());

  const sampleKeluarga: Keluarga[] = [
    {
      Nomor_KK: '3273011204100001',
      Alamat_Lengkap: 'Jl. Melati No. 14, RT 004 / RW 002, Kel. Sukamaju',
      Tanggal_Pendataan: today,
    },
    {
      Nomor_KK: '3273012508150002',
      Alamat_Lengkap: 'Jl. Kenanga Gang II No. 7, RT 004 / RW 002, Kel. Sukamaju',
      Tanggal_Pendataan: today,
    },
    {
      Nomor_KK: '3273010311050003',
      Alamat_Lengkap: 'Jl. Flamboyan No. 22, RT 004 / RW 002, Kel. Sukamaju',
      Tanggal_Pendataan: today,
    },
  ];

  const sampleWarga: Warga[] = [
    {
      NIK: '3273011405780001',
      Nomor_KK: '3273011204100001',
      Nama_Lengkap: 'Ahmad Suryadi',
      Tempat_Lahir: 'Bandung',
      Tanggal_Lahir: makeBirthDate(48, 2, 14),
      Jenis_Kelamin: 'Laki-laki',
      Golongan_Darah: 'O',
      Agama: 'Islam',
      Pendidikan_Terakhir: 'SMA/SMK/Sederajat',
      Pekerjaan: 'Wiraswasta',
      Status_Perkawinan: 'Kawin',
      Status_Dalam_Keluarga: 'Kepala Keluarga',
      No_Plat_Kendaraan: 'D 4521 KJL',
      Status_Rumah: 'Milik Sendiri',
      Catatan_Kesehatan: null,
    },
    {
      NIK: '3273015209820002',
      Nomor_KK: '3273011204100001',
      Nama_Lengkap: 'Siti Aminah',
      Tempat_Lahir: 'Garut',
      Tanggal_Lahir: makeBirthDate(44, 5, 22),
      Jenis_Kelamin: 'Perempuan',
      Golongan_Darah: 'A',
      Agama: 'Islam',
      Pendidikan_Terakhir: 'SMA/SMK/Sederajat',
      Pekerjaan: 'Mengurus Rumah Tangga',
      Status_Perkawinan: 'Kawin',
      Status_Dalam_Keluarga: 'Istri',
      No_Plat_Kendaraan: null,
      Status_Rumah: 'Milik Sendiri',
      Catatan_Kesehatan: null,
    },
    {
      NIK: '3273011801140003',
      Nomor_KK: '3273011204100001',
      Nama_Lengkap: 'Rizky Pratama Suryadi',
      Tempat_Lahir: 'Bandung',
      Tanggal_Lahir: makeBirthDate(12, 4, 18),
      Jenis_Kelamin: 'Laki-laki',
      Golongan_Darah: 'O',
      Agama: 'Islam',
      Pendidikan_Terakhir: 'SD/Sederajat',
      Pekerjaan: 'Pelajar/Mahasiswa',
      Status_Perkawinan: 'Belum Kawin',
      Status_Dalam_Keluarga: 'Anak',
      No_Plat_Kendaraan: null,
      Status_Rumah: 'Milik Sendiri',
      Catatan_Kesehatan: null,
    },
    {
      NIK: '3273014407240004',
      Nomor_KK: '3273011204100001',
      Nama_Lengkap: 'Nadia Azzahra Suryadi',
      Tempat_Lahir: 'Bandung',
      Tanggal_Lahir: makeBirthDate(1, 7, 4),
      Jenis_Kelamin: 'Perempuan',
      Golongan_Darah: '-',
      Agama: 'Islam',
      Pendidikan_Terakhir: 'Belum/Tidak Sekolah',
      Pekerjaan: 'Belum/Tidak Bekerja',
      Status_Perkawinan: 'Belum Kawin',
      Status_Dalam_Keluarga: 'Anak',
      No_Plat_Kendaraan: null,
      Status_Rumah: 'Milik Sendiri',
      Catatan_Kesehatan: 'Imunisasi Posyandu lengkap',
    },
    {
      NIK: '3273010903560001',
      Nomor_KK: '3273012508150002',
      Nama_Lengkap: 'H. Slamet Raharjo',
      Tempat_Lahir: 'Solo',
      Tanggal_Lahir: makeBirthDate(70, 3, 9),
      Jenis_Kelamin: 'Laki-laki',
      Golongan_Darah: 'B',
      Agama: 'Islam',
      Pendidikan_Terakhir: 'SMP/Sederajat',
      Pekerjaan: 'Pensiunan',
      Status_Perkawinan: 'Kawin',
      Status_Dalam_Keluarga: 'Kepala Keluarga',
      No_Plat_Kendaraan: 'D 1189 ABC',
      Status_Rumah: 'Milik Sendiri',
      Catatan_Kesehatan: 'Hipertensi ringan, kontrol rutin Puskesmas',
    },
    {
      NIK: '3273015511590002',
      Nomor_KK: '3273012508150002',
      Nama_Lengkap: 'Hj. Kartini',
      Tempat_Lahir: 'Yogyakarta',
      Tanggal_Lahir: makeBirthDate(66, 11, 15),
      Jenis_Kelamin: 'Perempuan',
      Golongan_Darah: 'AB',
      Agama: 'Islam',
      Pendidikan_Terakhir: 'SD/Sederajat',
      Pekerjaan: 'Mengurus Rumah Tangga',
      Status_Perkawinan: 'Kawin',
      Status_Dalam_Keluarga: 'Istri',
      No_Plat_Kendaraan: null,
      Status_Rumah: 'Milik Sendiri',
      Catatan_Kesehatan: 'Pemeriksaan lansia rutin',
    },
    {
      NIK: '3273012008940001',
      Nomor_KK: '3273010311050003',
      Nama_Lengkap: 'Budi Santoso',
      Tempat_Lahir: 'Cimahi',
      Tanggal_Lahir: makeBirthDate(32, 1, 20),
      Jenis_Kelamin: 'Laki-laki',
      Golongan_Darah: 'A',
      Agama: 'Kristen',
      Pendidikan_Terakhir: 'Diploma (D1-D3)',
      Pekerjaan: 'Buruh Harian Lepas',
      Status_Perkawinan: 'Kawin',
      Status_Dalam_Keluarga: 'Kepala Keluarga',
      No_Plat_Kendaraan: 'D 6832 ZXY',
      Status_Rumah: 'Kontrak',
      Catatan_Kesehatan: null,
    },
    {
      NIK: '3273016102220002',
      Nomor_KK: '3273010311050003',
      Nama_Lengkap: 'Mikhael Santoso',
      Tempat_Lahir: 'Bandung',
      Tanggal_Lahir: makeBirthDate(4, 2, 11),
      Jenis_Kelamin: 'Laki-laki',
      Golongan_Darah: 'A',
      Agama: 'Kristen',
      Pendidikan_Terakhir: 'Belum/Tidak Sekolah',
      Pekerjaan: 'Belum/Tidak Bekerja',
      Status_Perkawinan: 'Belum Kawin',
      Status_Dalam_Keluarga: 'Anak',
      No_Plat_Kendaraan: null,
      Status_Rumah: 'Kontrak',
      Catatan_Kesehatan: null,
    },
  ];

  const sampleBantuan: BantuanSosial[] = [
    {
      NIK: '3273010903560001',
      Jenis_Bantuan: 'PBI BPJS',
      Tahun_Penerimaan: yr,
      Status: 'Aktif',
    },
    {
      NIK: '3273015511590002',
      Jenis_Bantuan: 'PKH',
      Tahun_Penerimaan: yr,
      Status: 'Aktif',
    },
    {
      NIK: '3273012008940001',
      Jenis_Bantuan: 'BPNT/Sembako',
      Tahun_Penerimaan: yr,
      Status: 'Aktif',
    },
    {
      NIK: '3273012008940001',
      Jenis_Bantuan: 'BLT Desa',
      Tahun_Penerimaan: yr,
      Status: 'Aktif',
    },
  ];

  await db.transaction('rw', db.keluarga, db.warga, db.bantuan_sosial, async () => {
    await db.keluarga.bulkPut(sampleKeluarga);
    await db.warga.bulkPut(sampleWarga);
    await db.bantuan_sosial.bulkAdd(sampleBantuan);
  });
}

export async function getAllEnrichedWarga(): Promise<{
  wargaList: WargaEnriched[];
  keluargaList: Keluarga[];
  bantuanList: BantuanSosial[];
}> {
  const [keluargaList, wargaRaw, bantuanList] = await Promise.all([
    db.keluarga.toArray(),
    db.warga.toArray(),
    db.bantuan_sosial.toArray(),
  ]);

  const keluargaMap = new Map<string, Keluarga>();
  keluargaList.forEach((kk) => keluargaMap.set(kk.Nomor_KK, kk));

  const bantuanByNik = new Map<string, BantuanSosial[]>();
  bantuanList.forEach((b) => {
    const arr = bantuanByNik.get(b.NIK) ?? [];
    arr.push(b);
    bantuanByNik.set(b.NIK, arr);
  });

  const now = new Date();
  const wargaList: WargaEnriched[] = wargaRaw
    .map((w) => {
      const age = calculateAge(w.Tanggal_Lahir, now);
      return {
        ...w,
        keluarga: keluargaMap.get(w.Nomor_KK),
        bantuanList: bantuanByNik.get(w.NIK) ?? [],
        usiaTahun: age.years,
        usiaBulan: age.months,
        usiaFormatted: age.formatted,
        kategoriUsia: age.category,
      };
    })
    .sort((a, b) => a.Nama_Lengkap.localeCompare(b.Nama_Lengkap, 'id'));

  return { wargaList, keluargaList, bantuanList };
}

export async function saveKeluargaDanWarga(
  keluarga: Keluarga,
  anggotaList: Array<{
    warga: Warga;
    bantuanJenis: string[];
    tahunBantuan: number;
  }>
): Promise<void> {
  await db.transaction('rw', db.keluarga, db.warga, db.bantuan_sosial, async () => {
    await db.keluarga.put(keluarga);
    for (const item of anggotaList) {
      await db.warga.put(item.warga);
      // Replace active bansos entries for this NIK for the specified year or keep clean sync
      await db.bantuan_sosial.where('NIK').equals(item.warga.NIK).delete();
      if (item.bantuanJenis.length > 0) {
        await db.bantuan_sosial.bulkAdd(
          item.bantuanJenis.map((jenis) => ({
            NIK: item.warga.NIK,
            Jenis_Bantuan: jenis,
            Tahun_Penerimaan: item.tahunBantuan,
            Status: 'Aktif' as const,
          }))
        );
      }
    }
  });
}

export async function updateWargaProfile(warga: Warga): Promise<void> {
  await db.warga.put(warga);
}

export async function setWargaBantuan(
  nik: string,
  bantuanEntries: Omit<BantuanSosial, 'ID_Bantuan'>[]
): Promise<void> {
  await db.transaction('rw', db.bantuan_sosial, async () => {
    await db.bantuan_sosial.where('NIK').equals(nik).delete();
    if (bantuanEntries.length > 0) {
      await db.bantuan_sosial.bulkAdd(bantuanEntries);
    }
  });
}

export async function deleteWargaByNIK(nik: string): Promise<void> {
  await db.transaction('rw', db.warga, db.bantuan_sosial, db.keluarga, async () => {
    const target = await db.warga.get(nik);
    await db.bantuan_sosial.where('NIK').equals(nik).delete();
    await db.warga.delete(nik);
    if (target) {
      const remaining = await db.warga.where('Nomor_KK').equals(target.Nomor_KK).count();
      if (remaining === 0) {
        await db.keluarga.delete(target.Nomor_KK);
      }
    }
  });
}

export async function exportLocalBackupJSON(): Promise<string> {
  const [keluarga, warga, bantuan_sosial] = await Promise.all([
    db.keluarga.toArray(),
    db.warga.toArray(),
    db.bantuan_sosial.toArray(),
  ]);
  return JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      rtProfile: getRTProfile(),
      keluarga,
      warga,
      bantuan_sosial,
    },
    null,
    2
  );
}

export async function importLocalBackupJSON(jsonText: string): Promise<{
  keluargaCount: number;
  wargaCount: number;
}> {
  const parsed = JSON.parse(jsonText);
  if (!Array.isArray(parsed.keluarga) || !Array.isArray(parsed.warga)) {
    throw new Error('Format file cadangan JSON tidak valid.');
  }
  const bantuan = Array.isArray(parsed.bantuan_sosial) ? parsed.bantuan_sosial : [];

  await db.transaction('rw', db.keluarga, db.warga, db.bantuan_sosial, async () => {
    await db.bantuan_sosial.clear();
    await db.warga.clear();
    await db.keluarga.clear();
    if (parsed.keluarga.length) await db.keluarga.bulkPut(parsed.keluarga);
    if (parsed.warga.length) await db.warga.bulkPut(parsed.warga);
    if (bantuan.length) await db.bantuan_sosial.bulkPut(bantuan);
  });

  if (parsed.rtProfile) {
    saveRTProfile({ ...DEFAULT_RT_PROFILE, ...parsed.rtProfile });
  }

  return {
    keluargaCount: parsed.keluarga.length,
    wargaCount: parsed.warga.length,
  };
}

export async function clearAllLocalData(): Promise<void> {
  await db.transaction('rw', db.keluarga, db.warga, db.bantuan_sosial, async () => {
    await db.bantuan_sosial.clear();
    await db.warga.clear();
    await db.keluarga.clear();
  });
  localStorage.setItem(INIT_FLAG_KEY, '1');
}
