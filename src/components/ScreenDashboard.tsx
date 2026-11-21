import React, { useRef, useState } from 'react';
import {
  Baby,
  Download,
  Home,
  Search,
  ScanLine,
  Settings,
  ShieldCheck,
  Trash2,
  Upload,
  UserCheck,
  Users,
} from 'lucide-react';
import {
  AgeCategory,
  Keluarga,
  RTProfile,
  WargaEnriched,
} from '../types/models';

interface ScreenDashboardProps {
  wargaList: WargaEnriched[];
  keluargaList: Keluarga[];
  rtProfile: RTProfile;
  onUpdateRTProfile: (profile: RTProfile) => void;
  onNavigateToInput: () => void;
  onNavigateToSearch: (ageFilter?: AgeCategory | 'ALL' | 'BALITA_BATITA') => void;
  onExportBackup: () => Promise<void>;
  onImportBackup: (file: File) => Promise<void>;
  onLoadSampleData: () => Promise<void>;
  onClearAllData: () => Promise<void>;
}

export const ScreenDashboard: React.FC<ScreenDashboardProps> = ({
  wargaList,
  keluargaList,
  rtProfile,
  onUpdateRTProfile,
  onNavigateToInput,
  onNavigateToSearch,
  onExportBackup,
  onImportBackup,
  onLoadSampleData,
  onClearAllData,
}) => {
  const [showSettings, setShowSettings] = useState(false);
  const [profileDraft, setProfileDraft] = useState<RTProfile>(rtProfile);
  const [confirmClear, setConfirmClear] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const totalKK = keluargaList.length;
  const totalWarga = wargaList.length;
  const totalLansia = wargaList.filter((w) => w.usiaTahun >= 65).length;
  const totalBalitaBatita = wargaList.filter((w) => w.usiaTahun <= 5).length;

  const categoryCounts: { label: string; filter: AgeCategory; range: string; count: number }[] = [
    {
      label: 'Batita',
      filter: 'Batita',
      range: '0 - 2 tahun',
      count: wargaList.filter((w) => w.kategoriUsia === 'Batita').length,
    },
    {
      label: 'Balita',
      filter: 'Balita',
      range: '3 - 5 tahun',
      count: wargaList.filter((w) => w.kategoriUsia === 'Balita').length,
    },
    {
      label: 'Usia Sekolah',
      filter: 'Usia Sekolah',
      range: '6 - 17 tahun',
      count: wargaList.filter((w) => w.kategoriUsia === 'Usia Sekolah').length,
    },
    {
      label: 'Dewasa',
      filter: 'Dewasa',
      range: '18 - 64 tahun',
      count: wargaList.filter((w) => w.kategoriUsia === 'Dewasa').length,
    },
    {
      label: 'Lansia',
      filter: 'Lansia',
      range: '65 tahun ke atas',
      count: totalLansia,
    },
  ];

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateRTProfile(profileDraft);
    setShowSettings(false);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await onImportBackup(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-8">
      {/* Header Welcome & Privacy Notice */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-teal-700">
            {rtProfile.namaRT} · {rtProfile.kelurahan}
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl text-balance">
            Ringkasan Data Kependudukan
          </h1>
          <p className="mt-1.5 text-base text-slate-600">
            Ketua RT: {rtProfile.namaKetuaRT} · Penyimpanan lokal perangkat (tanpa server cloud)
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setProfileDraft(rtProfile);
            setShowSettings((v) => !v);
          }}
          className="inline-flex min-h-[44px] items-center gap-2 self-start rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 transition-colors hover:bg-slate-50 whitespace-nowrap shrink-0"
        >
          <Settings className="h-4 w-4 text-slate-600" aria-hidden="true" />
          <span>Pengaturan RT & Cadangan</span>
        </button>
      </div>

      {/* 4 Kartu Statistik Otomatis */}
      <section aria-label="Statistik Kependudukan">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <button
            type="button"
            onClick={() => onNavigateToSearch('ALL')}
            className="group flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 text-left transition-colors hover:border-teal-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-semibold text-slate-600">Total KK</span>
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-teal-700">
                <Home className="h-5 w-5" aria-hidden="true" />
              </span>
            </div>
            <div className="mt-4">
              <p className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl tabular-nums">
                {totalKK}
              </p>
              <p className="mt-1 text-sm text-slate-500">Kartu Keluarga terdaftar</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => onNavigateToSearch('ALL')}
            className="group flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 text-left transition-colors hover:border-teal-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-semibold text-slate-600">Total Warga</span>
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-teal-700">
                <Users className="h-5 w-5" aria-hidden="true" />
              </span>
            </div>
            <div className="mt-4">
              <p className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl tabular-nums">
                {totalWarga}
              </p>
              <p className="mt-1 text-sm text-slate-500">Jiwa terdata aktif</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => onNavigateToSearch('Lansia')}
            className="group flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 text-left transition-colors hover:border-teal-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-semibold text-slate-600">Total Lansia</span>
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
                <UserCheck className="h-5 w-5" aria-hidden="true" />
              </span>
            </div>
            <div className="mt-4">
              <p className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl tabular-nums">
                {totalLansia}
              </p>
              <p className="mt-1 text-sm text-slate-500">Usia 65 tahun ke atas</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => onNavigateToSearch('Balita')}
            className="group flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 text-left transition-colors hover:border-teal-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-semibold text-slate-600">Balita & Batita</span>
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                <Baby className="h-5 w-5" aria-hidden="true" />
              </span>
            </div>
            <div className="mt-4">
              <p className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl tabular-nums">
                {totalBalitaBatita}
              </p>
              <p className="mt-1 text-sm text-slate-500">Usia 0 hingga 5 tahun</p>
            </div>
          </button>
        </div>
      </section>

      {/* Tombol Aksi Cepat */}
      <section aria-label="Aksi Cepat" className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <button
          type="button"
          onClick={onNavigateToInput}
          className="flex min-h-[64px] items-center justify-center gap-3 rounded-2xl bg-teal-700 px-6 py-4 text-lg font-semibold text-white transition-colors hover:bg-teal-800 active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
        >
          <ScanLine className="h-6 w-6 shrink-0" aria-hidden="true" />
          <span>Scan / Input KK Baru</span>
        </button>

        <button
          type="button"
          onClick={() => onNavigateToSearch('ALL')}
          className="flex min-h-[64px] items-center justify-center gap-3 rounded-2xl border-2 border-slate-300 bg-white px-6 py-4 text-lg font-semibold text-slate-900 transition-colors hover:border-teal-700 hover:bg-slate-50 active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
        >
          <Search className="h-6 w-6 shrink-0 text-teal-700" aria-hidden="true" />
          <span>Cari Warga</span>
        </button>
      </section>

      {/* Pengaturan RT & Backup Lokal (Collapsible) */}
      {showSettings && (
        <section
          aria-label="Pengaturan Identitas RT dan Cadangan Lokal"
          className="rounded-2xl border border-slate-200 bg-white p-6"
        >
          <div className="flex flex-col gap-6 lg:flex-row lg:justify-between">
            <form onSubmit={handleSaveProfile} className="flex-1 space-y-4">
              <h2 className="text-lg font-bold text-slate-900">Identitas Wilayah RT (Untuk Kop Laporan)</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-semibold text-slate-700">
                    Nama RT / RW
                  </label>
                  <input
                    type="text"
                    value={profileDraft.namaRT}
                    onChange={(e) => setProfileDraft({ ...profileDraft, namaRT: e.target.value })}
                    className="mt-1.5 w-full min-h-[44px] rounded-xl border border-slate-300 px-3.5 py-2 text-base text-slate-900 focus:border-teal-700 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700">
                    Nama Ketua RT
                  </label>
                  <input
                    type="text"
                    value={profileDraft.namaKetuaRT}
                    onChange={(e) => setProfileDraft({ ...profileDraft, namaKetuaRT: e.target.value })}
                    className="mt-1.5 w-full min-h-[44px] rounded-xl border border-slate-300 px-3.5 py-2 text-base text-slate-900 focus:border-teal-700 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700">
                    Kelurahan / Desa
                  </label>
                  <input
                    type="text"
                    value={profileDraft.kelurahan}
                    onChange={(e) => setProfileDraft({ ...profileDraft, kelurahan: e.target.value })}
                    className="mt-1.5 w-full min-h-[44px] rounded-xl border border-slate-300 px-3.5 py-2 text-base text-slate-900 focus:border-teal-700 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700">
                    Kecamatan
                  </label>
                  <input
                    type="text"
                    value={profileDraft.kecamatan}
                    onChange={(e) => setProfileDraft({ ...profileDraft, kecamatan: e.target.value })}
                    className="mt-1.5 w-full min-h-[44px] rounded-xl border border-slate-300 px-3.5 py-2 text-base text-slate-900 focus:border-teal-700 focus:outline-none"
                    required
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  type="submit"
                  className="min-h-[44px] rounded-xl bg-teal-700 px-5 py-2 text-sm font-semibold text-white hover:bg-teal-800"
                >
                  Simpan Identitas RT
                </button>
                <button
                  type="button"
                  onClick={() => setShowSettings(false)}
                  className="min-h-[44px] rounded-xl border border-slate-300 bg-white px-5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Tutup
                </button>
              </div>
            </form>

            <div className="border-t border-slate-200 pt-6 lg:w-80 lg:border-t-0 lg:border-l lg:pl-6 lg:pt-0 space-y-4">
              <h2 className="text-lg font-bold text-slate-900">Cadangan Data Offline</h2>
              <p className="text-sm text-slate-600">
                Simpan salinan file JSON di memori HP/komputer atau pulihkan data saat berganti perangkat.
              </p>
              <div className="flex flex-col gap-2.5">
                <button
                  type="button"
                  onClick={onExportBackup}
                  className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                >
                  <Download className="h-4 w-4 text-teal-700" aria-hidden="true" />
                  <span>Unduh Cadangan (.json)</span>
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                >
                  <Upload className="h-4 w-4 text-teal-700" aria-hidden="true" />
                  <span>Pulihkan dari File (.json)</span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/json,.json"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {totalWarga === 0 && (
                  <button
                    type="button"
                    onClick={onLoadSampleData}
                    className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-teal-700 bg-teal-50 px-4 py-2 text-sm font-semibold text-teal-800 hover:bg-teal-100"
                  >
                    <span>Muat Data Contoh RT</span>
                  </button>
                )}

                {!confirmClear ? (
                  <button
                    type="button"
                    onClick={() => setConfirmClear(true)}
                    className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                    <span>Kosongkan Semua Data</span>
                  </button>
                ) : (
                  <div className="rounded-xl border border-red-300 bg-red-50 p-3 space-y-2">
                    <p className="text-sm font-semibold text-red-900">
                      Yakin hapus seluruh data lokal?
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={async () => {
                          await onClearAllData();
                          setConfirmClear(false);
                        }}
                        className="flex-1 min-h-[40px] rounded-lg bg-red-700 px-3 py-1.5 text-sm font-semibold text-white hover:bg-red-800"
                      >
                        Ya, Hapus
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmClear(false)}
                        className="flex-1 min-h-[40px] rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700"
                      >
                        Batal
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Distribusi Kelompok Usia & Privasi Lokal */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-6">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-bold text-slate-900">Komposisi Usia Warga (Otomatis)</h2>
            <span className="text-sm text-slate-500 tabular-nums">Total: {totalWarga} jiwa</span>
          </div>

          <div className="mt-4 divide-y divide-slate-100">
            {categoryCounts.map((item) => {
              const pct = totalWarga > 0 ? Math.round((item.count / totalWarga) * 100) : 0;
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => onNavigateToSearch(item.filter)}
                  className="flex w-full min-h-[54px] items-center justify-between gap-4 py-3 text-left transition-colors hover:bg-slate-50 px-2 -mx-2 rounded-lg"
                >
                  <div>
                    <p className="text-base font-semibold text-slate-900">{item.label}</p>
                    <p className="text-sm text-slate-500">{item.range}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="hidden sm:block w-36 h-2.5 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full bg-teal-700 rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="text-right min-w-[78px]">
                      <span className="text-lg font-bold text-slate-900 tabular-nums">
                        {item.count}
                      </span>
                      <span className="ml-1.5 text-sm text-slate-500 tabular-nums">
                        ({pct}%)
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 flex flex-col justify-between">
          <div>
            <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
              <ShieldCheck className="h-6 w-6" aria-hidden="true" />
            </div>
            <h2 className="mt-4 text-lg font-bold text-slate-900">
              Privasi Data Terjaga 100% Lokal
            </h2>
            <p className="mt-2 text-base text-slate-600 leading-relaxed">
              Seluruh data NIK, Nomor KK, kesehatan, dan bantuan sosial hanya tersimpan di memori perangkat Anda melalui IndexedDB. Tidak ada pengiriman data ke internet atau server cloud.
            </p>
          </div>
          <div className="mt-6 border-t border-slate-100 pt-4 text-sm text-slate-600 space-y-1.5">
            <div className="flex justify-between">
              <span>Penerima Bansos Aktif</span>
              <span className="font-semibold text-slate-900 tabular-nums">
                {wargaList.filter((w) => w.bantuanList.some((b) => b.Status === 'Aktif')).length} warga
              </span>
            </div>
            <div className="flex justify-between">
              <span>Rumah Milik Sendiri</span>
              <span className="font-semibold text-slate-900 tabular-nums">
                {wargaList.filter((w) => w.Status_Rumah === 'Milik Sendiri').length} warga
              </span>
            </div>
            <div className="flex justify-between">
              <span>Rumah Kontrak / Numpang</span>
              <span className="font-semibold text-slate-900 tabular-nums">
                {wargaList.filter((w) => w.Status_Rumah === 'Kontrak' || w.Status_Rumah === 'Numpang').length} warga
              </span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
