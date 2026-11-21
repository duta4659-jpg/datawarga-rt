import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  Check,
  ChevronRight,
  Edit3,
  Plus,
  Search,
  Trash2,
  UserX,
  X,
} from 'lucide-react';
import {
  AGAMA_OPTIONS,
  AgeCategory,
  BANSOS_PRESETS,
  BantuanSosial,
  GOLONGAN_DARAH_OPTIONS,
  GolonganDarah,
  JENIS_KELAMIN_OPTIONS,
  JenisKelamin,
  PENDIDIKAN_OPTIONS,
  STATUS_KELUARGA_PRESETS,
  STATUS_PERKAWINAN_OPTIONS,
  STATUS_RUMAH_PRESETS,
  StatusPerkawinan,
  Warga,
  WargaEnriched,
} from '../types/models';
import { formatDateIndo, sanitizeDigits, todayISO } from '../utils/age';

interface ScreenWargaListProps {
  wargaList: WargaEnriched[];
  initialAgeFilter: AgeCategory | 'ALL' | 'BALITA_BATITA';
  focusSearchTrigger: number;
  onUpdateWarga: (warga: Warga) => Promise<void>;
  onUpdateBantuan: (
    nik: string,
    entries: Omit<BantuanSosial, 'ID_Bantuan'>[]
  ) => Promise<void>;
  onDeleteWarga: (nik: string) => Promise<void>;
  onGoToInput: () => void;
}

const AGE_FILTERS: Array<{ value: AgeCategory | 'ALL'; label: string }> = [
  { value: 'ALL', label: 'Semua' },
  { value: 'Batita', label: 'Batita' },
  { value: 'Balita', label: 'Balita' },
  { value: 'Usia Sekolah', label: 'Sekolah' },
  { value: 'Dewasa', label: 'Dewasa' },
  { value: 'Lansia', label: 'Lansia' },
];

export const ScreenWargaList: React.FC<ScreenWargaListProps> = ({
  wargaList,
  initialAgeFilter,
  focusSearchTrigger,
  onUpdateWarga,
  onUpdateBantuan,
  onDeleteWarga,
  onGoToInput,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [ageFilter, setAgeFilter] = useState<AgeCategory | 'ALL' | 'BALITA_BATITA'>(initialAgeFilter);
  const [selectedNik, setSelectedNik] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editDraft, setEditDraft] = useState<Warga | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [customBansosInput, setCustomBansosInput] = useState('');
  const [bansosYear, setBansosYear] = useState<number>(new Date().getFullYear());
  const [bansosStatusSaving, setBansosStatusSaving] = useState(false);

  const searchInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setAgeFilter(initialAgeFilter);
  }, [initialAgeFilter]);

  useEffect(() => {
    if (focusSearchTrigger > 0) {
      setSelectedNik(null);
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 60);
    }
  }, [focusSearchTrigger]);

  const countsByFilter = useMemo(() => {
    const map: Record<string, number> = { ALL: wargaList.length };
    AGE_FILTERS.forEach((f) => {
      if (f.value !== 'ALL') {
        map[f.value] = wargaList.filter((w) => w.kategoriUsia === f.value).length;
      }
    });
    return map;
  }, [wargaList]);

  const filteredWarga = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return wargaList.filter((w) => {
      if (ageFilter === 'BALITA_BATITA') {
        if (w.usiaTahun > 5) return false;
      } else if (ageFilter !== 'ALL' && w.kategoriUsia !== ageFilter) {
        return false;
      }
      if (!q) return true;
      return (
        w.Nama_Lengkap.toLowerCase().includes(q) ||
        w.NIK.includes(q) ||
        w.Nomor_KK.includes(q)
      );
    });
  }, [wargaList, ageFilter, searchQuery]);

  const selectedWarga = useMemo(
    () => wargaList.find((w) => w.NIK === selectedNik) ?? null,
    [wargaList, selectedNik]
  );

  // Sync default year from existing bantuan if any
  useEffect(() => {
    if (selectedWarga && selectedWarga.bantuanList.length > 0) {
      setBansosYear(selectedWarga.bantuanList[0].Tahun_Penerimaan);
    } else {
      setBansosYear(new Date().getFullYear());
    }
  }, [selectedWarga?.NIK]);

  const handleToggleBansos = async (jenis: string) => {
    if (!selectedWarga) return;
    setBansosStatusSaving(true);
    try {
      const existing = selectedWarga.bantuanList;
      const found = existing.find((b) => b.Jenis_Bantuan === jenis);
      let nextEntries: Omit<BantuanSosial, 'ID_Bantuan'>[];
      if (found) {
        nextEntries = existing
          .filter((b) => b.Jenis_Bantuan !== jenis)
          .map((b) => ({
            NIK: selectedWarga.NIK,
            Jenis_Bantuan: b.Jenis_Bantuan,
            Tahun_Penerimaan: b.Tahun_Penerimaan,
            Status: b.Status,
          }));
      } else {
        nextEntries = [
          ...existing.map((b) => ({
            NIK: selectedWarga.NIK,
            Jenis_Bantuan: b.Jenis_Bantuan,
            Tahun_Penerimaan: b.Tahun_Penerimaan,
            Status: b.Status,
          })),
          {
            NIK: selectedWarga.NIK,
            Jenis_Bantuan: jenis,
            Tahun_Penerimaan: bansosYear,
            Status: 'Aktif' as const,
          },
        ];
      }
      await onUpdateBantuan(selectedWarga.NIK, nextEntries);
    } finally {
      setBansosStatusSaving(false);
    }
  };

  const handleToggleBansosStatus = async (jenis: string) => {
    if (!selectedWarga) return;
    setBansosStatusSaving(true);
    try {
      const nextEntries = selectedWarga.bantuanList.map((b) => ({
        NIK: selectedWarga.NIK,
        Jenis_Bantuan: b.Jenis_Bantuan,
        Tahun_Penerimaan: b.Tahun_Penerimaan,
        Status:
          b.Jenis_Bantuan === jenis
            ? b.Status === 'Aktif'
              ? ('Non-Aktif' as const)
              : ('Aktif' as const)
            : b.Status,
      }));
      await onUpdateBantuan(selectedWarga.NIK, nextEntries);
    } finally {
      setBansosStatusSaving(false);
    }
  };

  const handleAddCustomBansos = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWarga || !customBansosInput.trim()) return;
    const label = customBansosInput.trim();
    if (selectedWarga.bantuanList.some((b) => b.Jenis_Bantuan.toLowerCase() === label.toLowerCase())) {
      setCustomBansosInput('');
      return;
    }
    setBansosStatusSaving(true);
    try {
      const nextEntries = [
        ...selectedWarga.bantuanList.map((b) => ({
          NIK: selectedWarga.NIK,
          Jenis_Bantuan: b.Jenis_Bantuan,
          Tahun_Penerimaan: b.Tahun_Penerimaan,
          Status: b.Status,
        })),
        {
          NIK: selectedWarga.NIK,
          Jenis_Bantuan: label,
          Tahun_Penerimaan: bansosYear,
          Status: 'Aktif' as const,
        },
      ];
      await onUpdateBantuan(selectedWarga.NIK, nextEntries);
      setCustomBansosInput('');
    } finally {
      setBansosStatusSaving(false);
    }
  };

  const handleStartEdit = () => {
    if (!selectedWarga) return;
    setEditDraft({
      NIK: selectedWarga.NIK,
      Nomor_KK: selectedWarga.Nomor_KK,
      Nama_Lengkap: selectedWarga.Nama_Lengkap,
      Tempat_Lahir: selectedWarga.Tempat_Lahir,
      Tanggal_Lahir: selectedWarga.Tanggal_Lahir,
      Jenis_Kelamin: selectedWarga.Jenis_Kelamin,
      Golongan_Darah: selectedWarga.Golongan_Darah,
      Agama: selectedWarga.Agama,
      Pendidikan_Terakhir: selectedWarga.Pendidikan_Terakhir,
      Pekerjaan: selectedWarga.Pekerjaan,
      Status_Perkawinan: selectedWarga.Status_Perkawinan,
      Status_Dalam_Keluarga: selectedWarga.Status_Dalam_Keluarga,
      No_Plat_Kendaraan: selectedWarga.No_Plat_Kendaraan,
      Status_Rumah: selectedWarga.Status_Rumah,
      Catatan_Kesehatan: selectedWarga.Catatan_Kesehatan,
    });
    setIsEditing(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editDraft || !editDraft.Nama_Lengkap.trim() || !editDraft.Tanggal_Lahir) return;
    await onUpdateWarga({
      ...editDraft,
      Nama_Lengkap: editDraft.Nama_Lengkap.trim(),
      Tempat_Lahir: editDraft.Tempat_Lahir.trim(),
      Pekerjaan: editDraft.Pekerjaan.trim() || 'Belum/Tidak Bekerja',
      No_Plat_Kendaraan: editDraft.No_Plat_Kendaraan?.trim() || null,
      Catatan_Kesehatan: editDraft.Catatan_Kesehatan?.trim() || null,
    });
    setIsEditing(false);
    setEditDraft(null);
  };

  // HALAMAN DETAIL PROFIL WARGA
  if (selectedWarga) {
    const customBansosEntries = selectedWarga.bantuanList.filter(
      (b) => !BANSOS_PRESETS.includes(b.Jenis_Bantuan)
    );

    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => {
              setSelectedNik(null);
              setIsEditing(false);
              setConfirmDelete(false);
            }}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-base font-semibold text-slate-800 hover:bg-slate-50"
          >
            <ArrowLeft className="h-5 w-5" aria-hidden="true" />
            <span>Kembali ke Daftar Warga</span>
          </button>

          <div className="flex items-center gap-2.5">
            {!isEditing && (
              <button
                type="button"
                onClick={handleStartEdit}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
              >
                <Edit3 className="h-4 w-4 text-teal-700" aria-hidden="true" />
                <span>Ubah Data</span>
              </button>
            )}

            {!confirmDelete ? (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
                <span>Hapus</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    await onDeleteWarga(selectedWarga.NIK);
                    setSelectedNik(null);
                    setConfirmDelete(false);
                  }}
                  className="min-h-[44px] rounded-xl bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800"
                >
                  Konfirmasi Hapus
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="min-h-[44px] rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700"
                >
                  Batal
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Profile Summary Card */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="border-b border-slate-100 pb-5">
            <p className="text-sm font-semibold text-teal-700">
              {selectedWarga.Status_Dalam_Keluarga} · Kategori Usia: {selectedWarga.kategoriUsia}
            </p>
            <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">
              {selectedWarga.Nama_Lengkap}
            </h1>
            <p className="mt-1.5 font-mono text-base text-slate-700 tabular-nums">
              NIK: {selectedWarga.NIK} · No. KK: {selectedWarga.Nomor_KK}
            </p>
            <p className="mt-1 text-base font-medium text-slate-800 tabular-nums">
              Usia Real-Time: {selectedWarga.usiaFormatted}
            </p>
          </div>

          {!isEditing ? (
            <dl className="mt-6 grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <dt className="text-sm font-medium text-slate-500">Tempat, Tanggal Lahir</dt>
                <dd className="mt-0.5 text-base font-semibold text-slate-900">
                  {selectedWarga.Tempat_Lahir}, {formatDateIndo(selectedWarga.Tanggal_Lahir)}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-slate-500">Jenis Kelamin</dt>
                <dd className="mt-0.5 text-base font-semibold text-slate-900">
                  {selectedWarga.Jenis_Kelamin}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-slate-500">Golongan Darah</dt>
                <dd className="mt-0.5 text-base font-semibold text-slate-900">
                  {selectedWarga.Golongan_Darah}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-slate-500">Agama</dt>
                <dd className="mt-0.5 text-base font-semibold text-slate-900">
                  {selectedWarga.Agama}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-slate-500">Pendidikan Terakhir</dt>
                <dd className="mt-0.5 text-base font-semibold text-slate-900">
                  {selectedWarga.Pendidikan_Terakhir}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-slate-500">Pekerjaan</dt>
                <dd className="mt-0.5 text-base font-semibold text-slate-900">
                  {selectedWarga.Pekerjaan}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-slate-500">Status Perkawinan</dt>
                <dd className="mt-0.5 text-base font-semibold text-slate-900">
                  {selectedWarga.Status_Perkawinan}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-slate-500">Status Rumah</dt>
                <dd className="mt-0.5 text-base font-semibold text-slate-900">
                  {selectedWarga.Status_Rumah}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-slate-500">No. Plat Kendaraan</dt>
                <dd className="mt-0.5 font-mono text-base font-semibold text-slate-900">
                  {selectedWarga.No_Plat_Kendaraan || '-'}
                </dd>
              </div>
              <div className="sm:col-span-2 lg:col-span-3">
                <dt className="text-sm font-medium text-slate-500">Alamat Kartu Keluarga</dt>
                <dd className="mt-0.5 text-base font-semibold text-slate-900">
                  {selectedWarga.keluarga?.Alamat_Lengkap || '-'}
                </dd>
              </div>
              <div className="sm:col-span-2 lg:col-span-3">
                <dt className="text-sm font-medium text-slate-500">Catatan Kesehatan</dt>
                <dd className="mt-0.5 text-base font-semibold text-slate-900">
                  {selectedWarga.Catatan_Kesehatan || 'Tidak ada catatan khusus'}
                </dd>
              </div>
            </dl>
          ) : (
            editDraft && (
              <form onSubmit={handleSaveEdit} className="mt-6 space-y-5">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-semibold text-slate-800">Nama Lengkap</label>
                    <input
                      type="text"
                      required
                      value={editDraft.Nama_Lengkap}
                      onChange={(e) => setEditDraft({ ...editDraft, Nama_Lengkap: e.target.value })}
                      className="mt-1.5 w-full min-h-[44px] rounded-xl border border-slate-300 px-3.5 py-2 text-base"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-800">Jenis Kelamin</label>
                    <select
                      value={editDraft.Jenis_Kelamin}
                      onChange={(e) =>
                        setEditDraft({ ...editDraft, Jenis_Kelamin: e.target.value as JenisKelamin })
                      }
                      className="mt-1.5 w-full min-h-[44px] rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-base"
                    >
                      {JENIS_KELAMIN_OPTIONS.map((o) => (
                        <option key={o} value={o}>{o}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-800">Tempat Lahir</label>
                    <input
                      type="text"
                      required
                      value={editDraft.Tempat_Lahir}
                      onChange={(e) => setEditDraft({ ...editDraft, Tempat_Lahir: e.target.value })}
                      className="mt-1.5 w-full min-h-[44px] rounded-xl border border-slate-300 px-3.5 py-2 text-base"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-800">Tanggal Lahir</label>
                    <input
                      type="date"
                      required
                      max={todayISO()}
                      value={editDraft.Tanggal_Lahir}
                      onChange={(e) => setEditDraft({ ...editDraft, Tanggal_Lahir: e.target.value })}
                      className="mt-1.5 w-full min-h-[44px] rounded-xl border border-slate-300 px-3.5 py-2 text-base"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-800">Golongan Darah</label>
                    <select
                      value={editDraft.Golongan_Darah}
                      onChange={(e) =>
                        setEditDraft({ ...editDraft, Golongan_Darah: e.target.value as GolonganDarah })
                      }
                      className="mt-1.5 w-full min-h-[44px] rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-base"
                    >
                      {GOLONGAN_DARAH_OPTIONS.map((o) => (
                        <option key={o} value={o}>{o}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-800">Agama</label>
                    <select
                      value={editDraft.Agama}
                      onChange={(e) => setEditDraft({ ...editDraft, Agama: e.target.value })}
                      className="mt-1.5 w-full min-h-[44px] rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-base"
                    >
                      {AGAMA_OPTIONS.map((o) => (
                        <option key={o} value={o}>{o}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-800">Pendidikan Terakhir</label>
                    <select
                      value={editDraft.Pendidikan_Terakhir}
                      onChange={(e) =>
                        setEditDraft({ ...editDraft, Pendidikan_Terakhir: e.target.value })
                      }
                      className="mt-1.5 w-full min-h-[44px] rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-base"
                    >
                      {PENDIDIKAN_OPTIONS.map((o) => (
                        <option key={o} value={o}>{o}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-800">Pekerjaan</label>
                    <input
                      type="text"
                      value={editDraft.Pekerjaan}
                      onChange={(e) => setEditDraft({ ...editDraft, Pekerjaan: e.target.value })}
                      className="mt-1.5 w-full min-h-[44px] rounded-xl border border-slate-300 px-3.5 py-2 text-base"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-800">Status Perkawinan</label>
                    <select
                      value={editDraft.Status_Perkawinan}
                      onChange={(e) =>
                        setEditDraft({
                          ...editDraft,
                          Status_Perkawinan: e.target.value as StatusPerkawinan,
                        })
                      }
                      className="mt-1.5 w-full min-h-[44px] rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-base"
                    >
                      {STATUS_PERKAWINAN_OPTIONS.map((o) => (
                        <option key={o} value={o}>{o}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-800">Status Dalam Keluarga</label>
                    <input
                      type="text"
                      list="status-keluarga-list"
                      value={editDraft.Status_Dalam_Keluarga}
                      onChange={(e) =>
                        setEditDraft({ ...editDraft, Status_Dalam_Keluarga: e.target.value })
                      }
                      className="mt-1.5 w-full min-h-[44px] rounded-xl border border-slate-300 px-3.5 py-2 text-base"
                    />
                    <datalist id="status-keluarga-list">
                      {STATUS_KELUARGA_PRESETS.map((o) => (
                        <option key={o} value={o} />
                      ))}
                    </datalist>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-800">Status Rumah</label>
                    <input
                      type="text"
                      list="status-rumah-list"
                      value={editDraft.Status_Rumah}
                      onChange={(e) => setEditDraft({ ...editDraft, Status_Rumah: e.target.value })}
                      className="mt-1.5 w-full min-h-[44px] rounded-xl border border-slate-300 px-3.5 py-2 text-base"
                    />
                    <datalist id="status-rumah-list">
                      {STATUS_RUMAH_PRESETS.map((o) => (
                        <option key={o} value={o} />
                      ))}
                    </datalist>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-800">No. Plat Kendaraan</label>
                    <input
                      type="text"
                      value={editDraft.No_Plat_Kendaraan ?? ''}
                      onChange={(e) =>
                        setEditDraft({
                          ...editDraft,
                          No_Plat_Kendaraan: e.target.value.toUpperCase(),
                        })
                      }
                      className="mt-1.5 w-full min-h-[44px] rounded-xl border border-slate-300 px-3.5 py-2 font-mono text-base"
                    />
                  </div>
                  <div className="sm:col-span-2 lg:col-span-3">
                    <label className="block text-sm font-semibold text-slate-800">Catatan Kesehatan</label>
                    <input
                      type="text"
                      value={editDraft.Catatan_Kesehatan ?? ''}
                      onChange={(e) =>
                        setEditDraft({ ...editDraft, Catatan_Kesehatan: e.target.value })
                      }
                      className="mt-1.5 w-full min-h-[44px] rounded-xl border border-slate-300 px-3.5 py-2 text-base"
                    />
                  </div>
                </div>
                <div className="flex flex-wrap gap-3 pt-2">
                  <button
                    type="submit"
                    className="min-h-[48px] rounded-xl bg-teal-700 px-6 py-2.5 text-base font-semibold text-white hover:bg-teal-800"
                  >
                    Simpan Perubahan
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="min-h-[48px] rounded-xl border border-slate-300 bg-white px-6 py-2.5 text-base font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Batal
                  </button>
                </div>
              </form>
            )
          )}
        </section>

        {/* SECTION KHUSUS BANTUAN SOSIAL (CHECKBOXES) */}
        <section
          aria-label="Bantuan Sosial Warga"
          className="rounded-2xl border border-slate-200 bg-white p-6 space-y-5"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Bantuan Sosial (Tabel Bantuan_Sosial)</h2>
              <p className="text-base text-slate-600">
                Centang jenis bantuan sosial yang diterima warga ini. Perubahan langsung tersimpan di perangkat.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="tahun-penerimaan" className="text-sm font-semibold text-slate-700 whitespace-nowrap">
                Tahun Penerimaan:
              </label>
              <input
                id="tahun-penerimaan"
                type="number"
                min={2000}
                max={2100}
                value={bansosYear}
                onChange={(e) => setBansosYear(Number(e.target.value) || new Date().getFullYear())}
                className="w-24 min-h-[40px] rounded-xl border border-slate-300 px-3 py-1.5 font-mono text-base text-slate-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {BANSOS_PRESETS.map((jenis) => {
              const entry = selectedWarga.bantuanList.find((b) => b.Jenis_Bantuan === jenis);
              const isChecked = !!entry;
              return (
                <div
                  key={jenis}
                  className={`flex min-h-[60px] items-center justify-between gap-3 rounded-xl border px-4 py-3 transition-colors ${
                    isChecked
                      ? 'border-teal-700 bg-teal-50/70'
                      : 'border-slate-300 bg-white hover:bg-slate-50'
                  }`}
                >
                  <label className="flex flex-1 cursor-pointer items-center gap-3.5">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      disabled={bansosStatusSaving}
                      onChange={() => handleToggleBansos(jenis)}
                      className="h-6 w-6 rounded border-slate-400 text-teal-700 focus:ring-teal-700"
                    />
                    <div>
                      <span className="block text-base font-bold text-slate-900">{jenis}</span>
                      {entry && (
                        <span className="block text-sm text-slate-600 tabular-nums">
                          Tahun {entry.Tahun_Penerimaan} · Status: {entry.Status}
                        </span>
                      )}
                    </div>
                  </label>

                  {entry && (
                    <button
                      type="button"
                      onClick={() => handleToggleBansosStatus(jenis)}
                      className={`min-h-[36px] rounded-lg border px-3 py-1 text-xs font-semibold whitespace-nowrap ${
                        entry.Status === 'Aktif'
                          ? 'border-emerald-700 bg-emerald-700 text-white'
                          : 'border-slate-300 bg-white text-slate-700'
                      }`}
                    >
                      {entry.Status === 'Aktif' ? 'Aktif' : 'Non-Aktif'}
                    </button>
                  )}
                </div>
              );
            })}

            {customBansosEntries.map((entry) => (
              <div
                key={entry.Jenis_Bantuan}
                className="flex min-h-[60px] items-center justify-between gap-3 rounded-xl border border-teal-700 bg-teal-50/70 px-4 py-3"
              >
                <label className="flex flex-1 cursor-pointer items-center gap-3.5">
                  <input
                    type="checkbox"
                    checked={true}
                    disabled={bansosStatusSaving}
                    onChange={() => handleToggleBansos(entry.Jenis_Bantuan)}
                    className="h-6 w-6 rounded border-slate-400 text-teal-700 focus:ring-teal-700"
                  />
                  <div>
                    <span className="block text-base font-bold text-slate-900">
                      {entry.Jenis_Bantuan}
                    </span>
                    <span className="block text-sm text-slate-600 tabular-nums">
                      Tahun {entry.Tahun_Penerimaan} · Status: {entry.Status}
                    </span>
                  </div>
                </label>

                <button
                  type="button"
                  onClick={() => handleToggleBansosStatus(entry.Jenis_Bantuan)}
                  className={`min-h-[36px] rounded-lg border px-3 py-1 text-xs font-semibold whitespace-nowrap ${
                    entry.Status === 'Aktif'
                      ? 'border-emerald-700 bg-emerald-700 text-white'
                      : 'border-slate-300 bg-white text-slate-700'
                  }`}
                >
                  {entry.Status === 'Aktif' ? 'Aktif' : 'Non-Aktif'}
                </button>
              </div>
            ))}
          </div>

          <form onSubmit={handleAddCustomBansos} className="flex flex-col gap-3 sm:flex-row">
            <input
              type="text"
              placeholder="Tambah jenis bantuan lainnya (misal: KIP, Bantuan Lansia)..."
              value={customBansosInput}
              onChange={(e) => setCustomBansosInput(e.target.value)}
              className="flex-1 min-h-[48px] rounded-xl border border-slate-300 px-4 py-2.5 text-base text-slate-900 focus:border-teal-700 focus:outline-none"
            />
            <button
              type="submit"
              disabled={!customBansosInput.trim() || bansosStatusSaving}
              className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl border border-slate-300 bg-slate-900 px-5 py-2.5 text-base font-semibold text-white hover:bg-slate-800 disabled:bg-slate-300 disabled:text-slate-500 whitespace-nowrap"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              <span>Tambah Bansos</span>
            </button>
          </form>

          {selectedWarga.bantuanList.length > 0 && (
            <div className="flex items-center gap-2 text-sm font-medium text-emerald-800">
              <Check className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>
                Tercatat {selectedWarga.bantuanList.filter((b) => b.Status === 'Aktif').length} program bantuan aktif untuk warga ini.
              </span>
            </div>
          )}
        </section>
      </div>
    );
  }

  // DAFTAR WARGA
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Daftar Warga & Profil
          </h1>
          <p className="mt-1 text-base text-slate-600">
            Ketuk nama warga untuk melihat profil lengkap dan mengelola status bantuan sosial.
          </p>
        </div>
        <p className="text-sm font-semibold text-slate-700 tabular-nums">
          Menampilkan {filteredWarga.length} dari {wargaList.length} warga
        </p>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500"
          aria-hidden="true"
        />
        <input
          ref={searchInputRef}
          type="search"
          aria-label="Cari warga berdasarkan NIK atau Nama"
          placeholder="Cari nama warga, 16 digit NIK, atau Nomor KK..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full min-h-[52px] rounded-2xl border border-slate-300 bg-white pl-12 pr-12 py-3 text-base text-slate-900 placeholder:text-slate-400 focus:border-teal-700 focus:outline-none"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            aria-label="Hapus kata kunci pencarian"
            className="absolute right-3 top-1/2 -translate-y-1/2 inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Filter Cepat Tag Usia */}
      <div
        role="tablist"
        aria-label="Filter kelompok usia"
        className="flex items-center gap-1.5 overflow-x-auto rounded-2xl border border-slate-200 bg-slate-100 p-1.5"
      >
        {AGE_FILTERS.map((f) => {
          const active = ageFilter === f.value;
          return (
            <button
              key={f.value}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setAgeFilter(f.value)}
              className={`min-h-[42px] flex-1 rounded-xl px-3.5 py-2 text-sm font-semibold transition-colors whitespace-nowrap shrink-0 tabular-nums ${
                active
                  ? 'bg-white text-teal-800 shadow-sm'
                  : 'text-slate-700 hover:text-slate-900'
              }`}
            >
              {f.label} ({countsByFilter[f.value] ?? 0})
            </button>
          );
        })}
      </div>

      {ageFilter === 'BALITA_BATITA' && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-teal-200 bg-teal-50 px-4 py-2.5 text-sm font-medium text-teal-900">
          <span>Menampilkan gabungan Batita & Balita (usia 0 - 5 tahun).</span>
          <button
            type="button"
            onClick={() => setAgeFilter('ALL')}
            className="font-semibold text-teal-800 underline whitespace-nowrap"
          >
            Tampilkan Semua
          </button>
        </div>
      )}

      {/* Daftar Warga */}
      {filteredWarga.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
          <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
            <UserX className="h-6 w-6" aria-hidden="true" />
          </div>
          <h2 className="mt-4 text-lg font-bold text-slate-900">
            {wargaList.length === 0
              ? 'Belum Ada Data Warga'
              : 'Tidak Ada Warga yang Cocok'}
          </h2>
          <p className="mt-1.5 text-base text-slate-600">
            {wargaList.length === 0
              ? 'Mulai pendataan dengan memindai atau menginput Kartu Keluarga baru.'
              : 'Coba ubah kata kunci pencarian NIK/Nama atau pilih filter usia Semua.'}
          </p>
          {wargaList.length === 0 && (
            <button
              type="button"
              onClick={onGoToInput}
              className="mt-5 inline-flex min-h-[48px] items-center gap-2 rounded-xl bg-teal-700 px-5 py-2.5 text-base font-semibold text-white hover:bg-teal-800"
            >
              <span>Input KK Pertama</span>
            </button>
          )}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white divide-y divide-slate-100">
          {filteredWarga.map((w) => {
            const bansosAktif = w.bantuanList
              .filter((b) => b.Status === 'Aktif')
              .map((b) => b.Jenis_Bantuan);

            return (
              <button
                key={w.NIK}
                type="button"
                onClick={() => setSelectedNik(w.NIK)}
                className="flex w-full min-h-[76px] items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-teal-700"
              >
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5">
                    <span className="text-lg font-bold text-slate-900 truncate">
                      {w.Nama_Lengkap}
                    </span>
                    <span className="font-mono text-sm text-slate-500 tabular-nums">
                      NIK {sanitizeDigits(w.NIK, 16)}
                    </span>
                  </div>

                  <p className="text-sm sm:text-base text-slate-700 tabular-nums">
                    {w.Jenis_Kelamin} · {w.usiaFormatted} · {w.kategoriUsia} · {w.Status_Dalam_Keluarga}
                  </p>

                  <p className="text-sm text-slate-500 truncate">
                    {w.keluarga?.Alamat_Lengkap ?? `KK ${w.Nomor_KK}`}
                    {bansosAktif.length > 0 ? ` · Bansos: ${bansosAktif.join(', ')}` : ''}
                  </p>
                </div>

                <ChevronRight className="h-5 w-5 shrink-0 text-slate-400" aria-hidden="true" />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
