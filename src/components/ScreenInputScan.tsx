import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  Camera,
  CheckCircle2,
  FileImage,
  Plus,
  ScanText,
  Trash2,
  UserPlus,
} from 'lucide-react';
import {
  AGAMA_OPTIONS,
  BANSOS_PRESETS,
  GOLONGAN_DARAH_OPTIONS,
  GolonganDarah,
  JENIS_KELAMIN_OPTIONS,
  JenisKelamin,
  Keluarga,
  PENDIDIKAN_OPTIONS,
  STATUS_KELUARGA_PRESETS,
  STATUS_PERKAWINAN_OPTIONS,
  STATUS_RUMAH_PRESETS,
  StatusPerkawinan,
  Warga,
} from '../types/models';
import {
  calculateAge,
  isValid16Digits,
  sanitizeDigits,
  todayISO,
} from '../utils/age';
import { runKKOcr } from '../utils/ocrParser';

interface AnggotaFormState {
  tempId: string;
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
  statusKeluargaCustom: string;
  No_Plat_Kendaraan: string;
  Status_Rumah: string;
  statusRumahCustom: string;
  Catatan_Kesehatan: string;
  bantuanJenis: string[];
  bantuanLainnya: string;
  tahunBantuan: number;
}

interface ScreenInputScanProps {
  existingKeluarga: Keluarga[];
  existingNiks: Set<string>;
  onSaveSuccess: (
    keluarga: Keluarga,
    anggotaList: Array<{
      warga: Warga;
      bantuanJenis: string[];
      tahunBantuan: number;
    }>
  ) => Promise<void>;
}

function createEmptyAnggota(isFirst = false): AnggotaFormState {
  return {
    tempId: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    NIK: '',
    Nama_Lengkap: '',
    Tempat_Lahir: '',
    Tanggal_Lahir: '',
    Jenis_Kelamin: 'Laki-laki',
    Golongan_Darah: '-',
    Agama: 'Islam',
    Pendidikan_Terakhir: 'SMA/SMK/Sederajat',
    Pekerjaan: '',
    Status_Perkawinan: 'Belum Kawin',
    Status_Dalam_Keluarga: isFirst ? 'Kepala Keluarga' : 'Anak',
    statusKeluargaCustom: '',
    No_Plat_Kendaraan: '',
    Status_Rumah: 'Milik Sendiri',
    statusRumahCustom: '',
    Catatan_Kesehatan: '',
    bantuanJenis: [],
    bantuanLainnya: '',
    tahunBantuan: new Date().getFullYear(),
  };
}

export const ScreenInputScan: React.FC<ScreenInputScanProps> = ({
  existingKeluarga,
  existingNiks,
  onSaveSuccess,
}) => {
  // OCR State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [ocrStatus, setOcrStatus] = useState('');
  const [ocrRawText, setOcrRawText] = useState('');
  const [ocrMessage, setOcrMessage] = useState<{ type: 'success' | 'warning' | 'error'; text: string } | null>(null);
  const [showRawText, setShowRawText] = useState(false);

  // KK Form State
  const [nomorKK, setNomorKK] = useState('');
  const [alamatLengkap, setAlamatLengkap] = useState('');
  const [tanggalPendataan, setTanggalPendataan] = useState(todayISO());

  // Anggota List State
  const [anggotaList, setAnggotaList] = useState<AnggotaFormState[]>([
    { ...createEmptyAnggota(true), Status_Dalam_Keluarga: 'Kepala Keluarga' },
  ]);

  // Validation & Submit
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  const existingKKMap = useMemo(() => {
    const map = new Map<string, Keluarga>();
    existingKeluarga.forEach((kk) => map.set(kk.Nomor_KK, kk));
    return map;
  }, [existingKeluarga]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setOcrMessage(null);
    setOcrRawText('');
    setOcrProgress(0);
    setOcrStatus('');
  };

  const handleRunOCR = async () => {
    if (!selectedFile) {
      setOcrMessage({
        type: 'warning',
        text: 'Silakan pilih atau ambil foto Kartu Keluarga terlebih dahulu.',
      });
      return;
    }

    setOcrLoading(true);
    setOcrMessage(null);
    try {
      const parsed = await runKKOcr(selectedFile, (progress, statusLabel) => {
        setOcrProgress(progress);
        setOcrStatus(statusLabel);
      });

      setOcrRawText(parsed.rawText);

      if (parsed.Nomor_KK) setNomorKK(parsed.Nomor_KK);
      if (parsed.Alamat_Lengkap) setAlamatLengkap(parsed.Alamat_Lengkap);

      if (parsed.anggota.length > 0) {
        const mapped: AnggotaFormState[] = parsed.anggota.map((a) => ({
          ...createEmptyAnggota(false),
          NIK: a.NIK,
          Nama_Lengkap: a.Nama_Lengkap,
          Tempat_Lahir: a.Tempat_Lahir,
          Tanggal_Lahir: a.Tanggal_Lahir,
          Jenis_Kelamin: a.Jenis_Kelamin,
          Golongan_Darah: a.Golongan_Darah,
          Agama: a.Agama,
          Pendidikan_Terakhir: a.Pendidikan_Terakhir,
          Pekerjaan: a.Pekerjaan,
          Status_Perkawinan: a.Status_Perkawinan,
          Status_Dalam_Keluarga: STATUS_KELUARGA_PRESETS.includes(a.Status_Dalam_Keluarga)
            ? a.Status_Dalam_Keluarga
            : 'Lainnya',
          statusKeluargaCustom: STATUS_KELUARGA_PRESETS.includes(a.Status_Dalam_Keluarga)
            ? ''
            : a.Status_Dalam_Keluarga,
        }));
        setAnggotaList(mapped);
        setOcrMessage({
          type: 'success',
          text: `OCR berhasil mengekstrak ${mapped.length} data warga. Mohon periksa dan koreksi kembali setiap kolom sebelum menyimpan.`,
        });
      } else if (parsed.Nomor_KK || parsed.Alamat_Lengkap || parsed.rawText.trim()) {
        setOcrMessage({
          type: 'warning',
          text: 'Sebagian teks terbaca, tetapi baris anggota keluarga belum terdeteksi otomatis. Silakan koreksi atau lengkapi formulir secara manual.',
        });
      } else {
        setOcrMessage({
          type: 'warning',
          text: 'Teks KK tidak terbaca dengan jelas dari gambar. Formulir tetap terbuka untuk pengisian manual.',
        });
      }
    } catch {
      setOcrMessage({
        type: 'error',
        text: 'Proses OCR gagal dijalankan (pastikan foto jelas atau model OCR telah tersimpan untuk penggunaan offline). Silakan isi formulir di bawah secara manual.',
      });
    } finally {
      setOcrLoading(false);
    }
  };

  const handleSelectExistingKK = (kkNum: string) => {
    if (!kkNum) return;
    const found = existingKKMap.get(kkNum);
    if (found) {
      setNomorKK(found.Nomor_KK);
      setAlamatLengkap(found.Alamat_Lengkap);
      setTanggalPendataan(found.Tanggal_Pendataan);
    }
  };

  const updateAnggota = (index: number, patch: Partial<AnggotaFormState>) => {
    setAnggotaList((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, ...patch } : item))
    );
  };

  const toggleBantuan = (index: number, jenis: string) => {
    setAnggotaList((prev) =>
      prev.map((item, idx) => {
        if (idx !== index) return item;
        const exists = item.bantuanJenis.includes(jenis);
        return {
          ...item,
          bantuanJenis: exists
            ? item.bantuanJenis.filter((j) => j !== jenis)
            : [...item.bantuanJenis, jenis],
        };
      })
    );
  };

  const addAnggotaRow = () => {
    setAnggotaList((prev) => [
      ...prev,
      { ...createEmptyAnggota(false), Status_Dalam_Keluarga: 'Anak' },
    ]);
  };

  const removeAnggotaRow = (index: number) => {
    if (anggotaList.length <= 1) return;
    setAnggotaList((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors: Record<string, string> = {};

    if (!isValid16Digits(nomorKK)) {
      nextErrors.nomorKK = 'Nomor KK wajib terdiri dari tepat 16 digit angka.';
    }
    if (!alamatLengkap.trim()) {
      nextErrors.alamatLengkap = 'Alamat lengkap wajib diisi.';
    }
    if (!tanggalPendataan) {
      nextErrors.tanggalPendataan = 'Tanggal pendataan wajib diisi.';
    }

    const seenNiksInForm = new Set<string>();
    anggotaList.forEach((a, idx) => {
      if (!isValid16Digits(a.NIK)) {
        nextErrors[`nik_${idx}`] = 'NIK wajib terdiri dari tepat 16 digit angka.';
      } else if (seenNiksInForm.has(a.NIK)) {
        nextErrors[`nik_${idx}`] = 'NIK duplikat dengan anggota lain di formulir ini.';
      } else {
        seenNiksInForm.add(a.NIK);
      }

      if (!a.Nama_Lengkap.trim()) {
        nextErrors[`nama_${idx}`] = 'Nama lengkap wajib diisi.';
      }
      if (!a.Tempat_Lahir.trim()) {
        nextErrors[`tempat_${idx}`] = 'Tempat lahir wajib diisi.';
      }
      if (!a.Tanggal_Lahir) {
        nextErrors[`tgl_${idx}`] = 'Tanggal lahir wajib diisi untuk kalkulasi usia.';
      }
    });

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setIsSaving(true);
    try {
      const keluargaPayload: Keluarga = {
        Nomor_KK: nomorKK.trim(),
        Alamat_Lengkap: alamatLengkap.trim(),
        Tanggal_Pendataan: tanggalPendataan,
      };

      const anggotaPayload = anggotaList.map((a) => {
        const finalStatusKeluarga =
          a.Status_Dalam_Keluarga === 'Lainnya'
            ? a.statusKeluargaCustom.trim() || 'Famili Lain'
            : a.Status_Dalam_Keluarga;

        const finalStatusRumah =
          a.Status_Rumah === 'Input Manual'
            ? a.statusRumahCustom.trim() || 'Milik Sendiri'
            : a.Status_Rumah;

        const bantuanList = [...a.bantuanJenis];
        if (a.bantuanLainnya.trim()) {
          bantuanList.push(a.bantuanLainnya.trim());
        }

        const warga: Warga = {
          NIK: a.NIK.trim(),
          Nomor_KK: keluargaPayload.Nomor_KK,
          Nama_Lengkap: a.Nama_Lengkap.trim(),
          Tempat_Lahir: a.Tempat_Lahir.trim(),
          Tanggal_Lahir: a.Tanggal_Lahir,
          Jenis_Kelamin: a.Jenis_Kelamin,
          Golongan_Darah: a.Golongan_Darah,
          Agama: a.Agama,
          Pendidikan_Terakhir: a.Pendidikan_Terakhir,
          Pekerjaan: a.Pekerjaan.trim() || 'Belum/Tidak Bekerja',
          Status_Perkawinan: a.Status_Perkawinan,
          Status_Dalam_Keluarga: finalStatusKeluarga,
          No_Plat_Kendaraan: a.No_Plat_Kendaraan.trim() || null,
          Status_Rumah: finalStatusRumah,
          Catatan_Kesehatan: a.Catatan_Kesehatan.trim() || null,
        };

        return {
          warga,
          bantuanJenis: Array.from(new Set(bantuanList)),
          tahunBantuan: a.tahunBantuan || new Date().getFullYear(),
        };
      });

      await onSaveSuccess(keluargaPayload, anggotaPayload);

      // Reset form cleanly after save
      setNomorKK('');
      setAlamatLengkap('');
      setTanggalPendataan(todayISO());
      setAnggotaList([{ ...createEmptyAnggota(true), Status_Dalam_Keluarga: 'Kepala Keluarga' }]);
      setSelectedFile(null);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl('');
      setOcrRawText('');
      setOcrMessage(null);
      setErrors({});
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Scan & Input Kartu Keluarga
        </h1>
        <p className="mt-1.5 text-base text-slate-600">
          Unggah foto Kartu Keluarga untuk pengisian otomatis via OCR, lalu periksa dan lengkapi data tambahan sebelum disimpan.
        </p>
      </div>

      {/* BAGIAN ATAS: UPLOAD / FOTO KK & PROSES OCR */}
      <section
        aria-label="Pemindaian OCR Kartu Keluarga"
        className="rounded-2xl border border-slate-200 bg-white p-6 space-y-5"
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">1. Foto / Scan Kartu Keluarga (OCR)</h2>
            <p className="text-sm text-slate-600">
              Mendukung kamera HP langsung atau unggah gambar dari galeri. Hasil OCR dapat dikoreksi manual.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-7">
            <label
              htmlFor="kk-photo-upload"
              className="flex min-h-[160px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-6 text-center transition-colors hover:border-teal-700 hover:bg-teal-50/40"
            >
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Pratinjau foto Kartu Keluarga"
                  className="max-h-56 w-auto rounded-xl object-contain"
                />
              ) : (
                <>
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-white border border-slate-200 text-teal-700">
                    <Camera className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <p className="mt-3 text-base font-semibold text-slate-900">
                    Ketuk untuk Ambil Foto atau Pilih Gambar KK
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    Format JPG, PNG, atau WEBP — diproses langsung di perangkat Anda
                  </p>
                </>
              )}
              <input
                id="kk-photo-upload"
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="sr-only"
              />
            </label>
          </div>

          <div className="lg:col-span-5 flex flex-col gap-3">
            {selectedFile && (
              <div className="flex items-center gap-2 text-sm text-slate-700">
                <FileImage className="h-4 w-4 text-teal-700 shrink-0" aria-hidden="true" />
                <span className="truncate font-medium">{selectedFile.name}</span>
              </div>
            )}

            <button
              type="button"
              onClick={handleRunOCR}
              disabled={ocrLoading || !selectedFile}
              className="inline-flex min-h-[52px] w-full items-center justify-center gap-2.5 rounded-xl bg-teal-700 px-5 py-3 text-base font-semibold text-white transition-colors hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600"
            >
              <ScanText className="h-5 w-5" aria-hidden="true" />
              <span>{ocrLoading ? `Memproses OCR (${ocrProgress}%)` : 'Proses OCR'}</span>
            </button>

            {ocrLoading && (
              <div className="space-y-1.5">
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full bg-teal-700 transition-all duration-200"
                    style={{ width: `${ocrProgress}%` }}
                  />
                </div>
                <p className="text-sm text-slate-600">{ocrStatus}</p>
              </div>
            )}

            {selectedFile && !ocrLoading && (
              <label
                htmlFor="kk-photo-upload"
                className="inline-flex min-h-[44px] cursor-pointer items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Ganti Foto KK
              </label>
            )}

            {ocrRawText && (
              <button
                type="button"
                onClick={() => setShowRawText((v) => !v)}
                className="text-left text-sm font-semibold text-teal-700 hover:underline"
              >
                {showRawText ? 'Sembunyikan Teks Mentah OCR' : 'Lihat Teks Mentah Hasil OCR'}
              </button>
            )}
          </div>
        </div>

        {ocrMessage && (
          <div
            role="status"
            className={`flex items-start gap-3 rounded-xl border p-4 text-sm sm:text-base ${
              ocrMessage.type === 'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                : ocrMessage.type === 'warning'
                ? 'border-amber-200 bg-amber-50 text-amber-900'
                : 'border-red-200 bg-red-50 text-red-900'
            }`}
          >
            {ocrMessage.type === 'success' ? (
              <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-700 mt-0.5" aria-hidden="true" />
            ) : (
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" aria-hidden="true" />
            )}
            <p>{ocrMessage.text}</p>
          </div>
        )}

        {showRawText && ocrRawText && (
          <pre className="max-h-48 overflow-auto rounded-xl border border-slate-200 bg-slate-50 p-4 font-mono text-xs text-slate-700 whitespace-pre-wrap">
            {ocrRawText}
          </pre>
        )}
      </section>

      {/* BAGIAN BAWAH: FORMULIR ISIAN KK + WARGA + DATA TAMBAHAN */}
      <form onSubmit={handleSubmit} className="space-y-8" noValidate>
        {/* Data Kartu Keluarga */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 space-y-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">2. Data Kartu Keluarga (Tabel Keluarga)</h2>
              <p className="text-sm text-slate-600">
                Nomor KK wajib tepat 16 digit angka.
              </p>
            </div>
            {existingKeluarga.length > 0 && (
              <div className="sm:w-72">
                <label className="sr-only" htmlFor="pilih-kk-ada">
                  Gunakan Nomor KK yang sudah ada
                </label>
                <select
                  id="pilih-kk-ada"
                  value=""
                  onChange={(e) => handleSelectExistingKK(e.target.value)}
                  className="w-full min-h-[44px] rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-800 focus:border-teal-700 focus:outline-none"
                >
                  <option value="">-- Atau pilih KK yang sudah ada --</option>
                  {existingKeluarga.map((kk) => (
                    <option key={kk.Nomor_KK} value={kk.Nomor_KK}>
                      {kk.Nomor_KK} ({kk.Alamat_Lengkap.slice(0, 28)}...)
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="nomor-kk" className="block text-sm font-semibold text-slate-800">
                  Nomor KK <span className="text-red-700">*</span>
                </label>
                <span
                  className={`font-mono text-xs tabular-nums ${
                    nomorKK.length === 16 ? 'text-emerald-700 font-semibold' : 'text-slate-500'
                  }`}
                >
                  {nomorKK.length}/16 digit
                </span>
              </div>
              <input
                id="nomor-kk"
                type="text"
                inputMode="numeric"
                maxLength={16}
                placeholder="Contoh: 3273011204100001"
                value={nomorKK}
                onChange={(e) => {
                  setNomorKK(sanitizeDigits(e.target.value, 16));
                  if (errors.nomorKK) setErrors((prev) => ({ ...prev, nomorKK: '' }));
                }}
                className={`mt-1.5 w-full min-h-[48px] rounded-xl border px-4 py-2.5 font-mono text-base text-slate-900 focus:outline-none ${
                  errors.nomorKK
                    ? 'border-red-500 bg-red-50/40 focus:border-red-600'
                    : 'border-slate-300 focus:border-teal-700'
                }`}
              />
              {errors.nomorKK && (
                <p className="mt-1.5 text-sm font-medium text-red-700">{errors.nomorKK}</p>
              )}
              {existingKKMap.has(nomorKK) && (
                <p className="mt-1.5 text-sm text-teal-700">
                  Nomor KK ini sudah terdaftar — data alamat akan diperbarui & anggota ditambahkan ke KK ini.
                </p>
              )}
            </div>

            <div>
              <label htmlFor="tanggal-pendataan" className="block text-sm font-semibold text-slate-800">
                Tanggal Pendataan <span className="text-red-700">*</span>
              </label>
              <input
                id="tanggal-pendataan"
                type="date"
                value={tanggalPendataan}
                onChange={(e) => setTanggalPendataan(e.target.value)}
                className="mt-1.5 w-full min-h-[48px] rounded-xl border border-slate-300 px-4 py-2.5 text-base text-slate-900 focus:border-teal-700 focus:outline-none"
              />
              {errors.tanggalPendataan && (
                <p className="mt-1.5 text-sm font-medium text-red-700">{errors.tanggalPendataan}</p>
              )}
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="alamat-lengkap" className="block text-sm font-semibold text-slate-800">
                Alamat Lengkap <span className="text-red-700">*</span>
              </label>
              <textarea
                id="alamat-lengkap"
                rows={2}
                placeholder="Contoh: Jl. Melati No. 14, RT 004 / RW 002, Kel. Sukamaju"
                value={alamatLengkap}
                onChange={(e) => {
                  setAlamatLengkap(e.target.value);
                  if (errors.alamatLengkap) setErrors((prev) => ({ ...prev, alamatLengkap: '' }));
                }}
                className={`mt-1.5 w-full rounded-xl border px-4 py-3 text-base text-slate-900 focus:outline-none ${
                  errors.alamatLengkap
                    ? 'border-red-500 bg-red-50/40 focus:border-red-600'
                    : 'border-slate-300 focus:border-teal-700'
                }`}
              />
              {errors.alamatLengkap && (
                <p className="mt-1.5 text-sm font-medium text-red-700">{errors.alamatLengkap}</p>
              )}
            </div>
          </div>
        </section>

        {/* Anggota Keluarga Forms */}
        {anggotaList.map((anggota, idx) => {
          const ageInfo = anggota.Tanggal_Lahir ? calculateAge(anggota.Tanggal_Lahir) : null;
          const nikExists = isValid16Digits(anggota.NIK) && existingNiks.has(anggota.NIK);

          return (
            <section
              key={anggota.tempId}
              className="rounded-2xl border border-slate-200 bg-white p-6 space-y-6"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Data Warga #{idx + 1}
                    {anggota.Nama_Lengkap ? ` — ${anggota.Nama_Lengkap}` : ''}
                  </h2>
                  {ageInfo && (
                    <p className="mt-0.5 text-sm font-medium text-teal-700 tabular-nums">
                      Usia terhitung otomatis: {ageInfo.formatted} · Kategori: {ageInfo.category}
                    </p>
                  )}
                </div>

                {anggotaList.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeAnggotaRow(idx)}
                    className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-red-200 px-3.5 py-2 text-sm font-semibold text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                    <span>Hapus Baris</span>
                  </button>
                )}
              </div>

              {/* Identitas Utama */}
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <div className="flex items-center justify-between">
                    <label htmlFor={`nik-${idx}`} className="block text-sm font-semibold text-slate-800">
                      NIK <span className="text-red-700">*</span>
                    </label>
                    <span
                      className={`font-mono text-xs tabular-nums ${
                        anggota.NIK.length === 16 ? 'text-emerald-700 font-semibold' : 'text-slate-500'
                      }`}
                    >
                      {anggota.NIK.length}/16 digit
                    </span>
                  </div>
                  <input
                    id={`nik-${idx}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={16}
                    placeholder="16 digit angka NIK"
                    value={anggota.NIK}
                    onChange={(e) => {
                      updateAnggota(idx, { NIK: sanitizeDigits(e.target.value, 16) });
                      if (errors[`nik_${idx}`]) setErrors((prev) => ({ ...prev, [`nik_${idx}`]: '' }));
                    }}
                    className={`mt-1.5 w-full min-h-[48px] rounded-xl border px-4 py-2.5 font-mono text-base text-slate-900 focus:outline-none ${
                      errors[`nik_${idx}`]
                        ? 'border-red-500 bg-red-50/40'
                        : 'border-slate-300 focus:border-teal-700'
                    }`}
                  />
                  {errors[`nik_${idx}`] && (
                    <p className="mt-1.5 text-sm font-medium text-red-700">{errors[`nik_${idx}`]}</p>
                  )}
                  {nikExists && !errors[`nik_${idx}`] && (
                    <p className="mt-1.5 text-sm text-amber-800">
                      NIK sudah tercatat sebelumnya — menyimpan akan memperbarui data warga ini.
                    </p>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor={`nama-${idx}`} className="block text-sm font-semibold text-slate-800">
                    Nama Lengkap <span className="text-red-700">*</span>
                  </label>
                  <input
                    id={`nama-${idx}`}
                    type="text"
                    placeholder="Sesuai KTP / Kartu Keluarga"
                    value={anggota.Nama_Lengkap}
                    onChange={(e) => {
                      updateAnggota(idx, { Nama_Lengkap: e.target.value });
                      if (errors[`nama_${idx}`]) setErrors((prev) => ({ ...prev, [`nama_${idx}`]: '' }));
                    }}
                    className={`mt-1.5 w-full min-h-[48px] rounded-xl border px-4 py-2.5 text-base text-slate-900 focus:outline-none ${
                      errors[`nama_${idx}`]
                        ? 'border-red-500 bg-red-50/40'
                        : 'border-slate-300 focus:border-teal-700'
                    }`}
                  />
                  {errors[`nama_${idx}`] && (
                    <p className="mt-1.5 text-sm font-medium text-red-700">{errors[`nama_${idx}`]}</p>
                  )}
                </div>

                <div>
                  <label htmlFor={`tempat-${idx}`} className="block text-sm font-semibold text-slate-800">
                    Tempat Lahir <span className="text-red-700">*</span>
                  </label>
                  <input
                    id={`tempat-${idx}`}
                    type="text"
                    placeholder="Kota / Kabupaten lahir"
                    value={anggota.Tempat_Lahir}
                    onChange={(e) => {
                      updateAnggota(idx, { Tempat_Lahir: e.target.value });
                      if (errors[`tempat_${idx}`]) setErrors((prev) => ({ ...prev, [`tempat_${idx}`]: '' }));
                    }}
                    className={`mt-1.5 w-full min-h-[48px] rounded-xl border px-4 py-2.5 text-base text-slate-900 focus:outline-none ${
                      errors[`tempat_${idx}`]
                        ? 'border-red-500 bg-red-50/40'
                        : 'border-slate-300 focus:border-teal-700'
                    }`}
                  />
                  {errors[`tempat_${idx}`] && (
                    <p className="mt-1.5 text-sm font-medium text-red-700">{errors[`tempat_${idx}`]}</p>
                  )}
                </div>

                <div>
                  <label htmlFor={`tgl-${idx}`} className="block text-sm font-semibold text-slate-800">
                    Tanggal Lahir <span className="text-red-700">*</span>
                  </label>
                  <input
                    id={`tgl-${idx}`}
                    type="date"
                    max={todayISO()}
                    value={anggota.Tanggal_Lahir}
                    onChange={(e) => {
                      updateAnggota(idx, { Tanggal_Lahir: e.target.value });
                      if (errors[`tgl_${idx}`]) setErrors((prev) => ({ ...prev, [`tgl_${idx}`]: '' }));
                    }}
                    className={`mt-1.5 w-full min-h-[48px] rounded-xl border px-4 py-2.5 text-base text-slate-900 focus:outline-none ${
                      errors[`tgl_${idx}`]
                        ? 'border-red-500 bg-red-50/40'
                        : 'border-slate-300 focus:border-teal-700'
                    }`}
                  />
                  {errors[`tgl_${idx}`] && (
                    <p className="mt-1.5 text-sm font-medium text-red-700">{errors[`tgl_${idx}`]}</p>
                  )}
                </div>

                <div>
                  <label htmlFor={`jk-${idx}`} className="block text-sm font-semibold text-slate-800">
                    Jenis Kelamin
                  </label>
                  <select
                    id={`jk-${idx}`}
                    value={anggota.Jenis_Kelamin}
                    onChange={(e) =>
                      updateAnggota(idx, { Jenis_Kelamin: e.target.value as JenisKelamin })
                    }
                    className="mt-1.5 w-full min-h-[48px] rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-base text-slate-900 focus:border-teal-700 focus:outline-none"
                  >
                    {JENIS_KELAMIN_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor={`gd-${idx}`} className="block text-sm font-semibold text-slate-800">
                    Golongan Darah
                  </label>
                  <select
                    id={`gd-${idx}`}
                    value={anggota.Golongan_Darah}
                    onChange={(e) =>
                      updateAnggota(idx, { Golongan_Darah: e.target.value as GolonganDarah })
                    }
                    className="mt-1.5 w-full min-h-[48px] rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-base text-slate-900 focus:border-teal-700 focus:outline-none"
                  >
                    {GOLONGAN_DARAH_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt === '-' ? '- (Tidak Tahu)' : opt}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor={`agama-${idx}`} className="block text-sm font-semibold text-slate-800">
                    Agama
                  </label>
                  <select
                    id={`agama-${idx}`}
                    value={anggota.Agama}
                    onChange={(e) => updateAnggota(idx, { Agama: e.target.value })}
                    className="mt-1.5 w-full min-h-[48px] rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-base text-slate-900 focus:border-teal-700 focus:outline-none"
                  >
                    {AGAMA_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor={`pendidikan-${idx}`} className="block text-sm font-semibold text-slate-800">
                    Pendidikan Terakhir
                  </label>
                  <select
                    id={`pendidikan-${idx}`}
                    value={anggota.Pendidikan_Terakhir}
                    onChange={(e) => updateAnggota(idx, { Pendidikan_Terakhir: e.target.value })}
                    className="mt-1.5 w-full min-h-[48px] rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-base text-slate-900 focus:border-teal-700 focus:outline-none"
                  >
                    {PENDIDIKAN_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor={`pekerjaan-${idx}`} className="block text-sm font-semibold text-slate-800">
                    Pekerjaan
                  </label>
                  <input
                    id={`pekerjaan-${idx}`}
                    type="text"
                    placeholder="Contoh: Wiraswasta / Pelajar / IRT"
                    value={anggota.Pekerjaan}
                    onChange={(e) => updateAnggota(idx, { Pekerjaan: e.target.value })}
                    className="mt-1.5 w-full min-h-[48px] rounded-xl border border-slate-300 px-4 py-2.5 text-base text-slate-900 focus:border-teal-700 focus:outline-none"
                  />
                </div>

                <div>
                  <label htmlFor={`kawin-${idx}`} className="block text-sm font-semibold text-slate-800">
                    Status Perkawinan
                  </label>
                  <select
                    id={`kawin-${idx}`}
                    value={anggota.Status_Perkawinan}
                    onChange={(e) =>
                      updateAnggota(idx, { Status_Perkawinan: e.target.value as StatusPerkawinan })
                    }
                    className="mt-1.5 w-full min-h-[48px] rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-base text-slate-900 focus:border-teal-700 focus:outline-none"
                  >
                    {STATUS_PERKAWINAN_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor={`hub-${idx}`} className="block text-sm font-semibold text-slate-800">
                    Status Dalam Keluarga
                  </label>
                  <select
                    id={`hub-${idx}`}
                    value={anggota.Status_Dalam_Keluarga}
                    onChange={(e) =>
                      updateAnggota(idx, { Status_Dalam_Keluarga: e.target.value })
                    }
                    className="mt-1.5 w-full min-h-[48px] rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-base text-slate-900 focus:border-teal-700 focus:outline-none"
                  >
                    {STATUS_KELUARGA_PRESETS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                    <option value="Lainnya">Lainnya (Tulis Manual)</option>
                  </select>
                  {anggota.Status_Dalam_Keluarga === 'Lainnya' && (
                    <input
                      type="text"
                      placeholder="Masukkan status hubungan keluarga"
                      value={anggota.statusKeluargaCustom}
                      onChange={(e) =>
                        updateAnggota(idx, { statusKeluargaCustom: e.target.value })
                      }
                      className="mt-2 w-full min-h-[44px] rounded-xl border border-slate-300 px-3.5 py-2 text-base text-slate-900 focus:border-teal-700 focus:outline-none"
                    />
                  )}
                </div>
              </div>

              {/* BAGIAN KHUSUS DATA TAMBAHAN (MANUAL) */}
              <div className="border-t border-slate-200 pt-6 space-y-5">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Data Tambahan (Diisi Manual oleh Ketua RT)
                  </h3>
                  <p className="text-sm text-slate-600">
                    Data berikut tidak tercantum di lembar KK dan diisi manual sesuai kondisi lapangan.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  <div>
                    <label htmlFor={`plat-${idx}`} className="block text-sm font-semibold text-slate-800">
                      No. Plat Kendaraan (Opsional)
                    </label>
                    <input
                      id={`plat-${idx}`}
                      type="text"
                      placeholder="Contoh: D 4521 KJL"
                      value={anggota.No_Plat_Kendaraan}
                      onChange={(e) =>
                        updateAnggota(idx, { No_Plat_Kendaraan: e.target.value.toUpperCase() })
                      }
                      className="mt-1.5 w-full min-h-[48px] rounded-xl border border-slate-300 px-4 py-2.5 font-mono text-base text-slate-900 focus:border-teal-700 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label htmlFor={`rumah-${idx}`} className="block text-sm font-semibold text-slate-800">
                      Status Rumah
                    </label>
                    <select
                      id={`rumah-${idx}`}
                      value={anggota.Status_Rumah}
                      onChange={(e) => updateAnggota(idx, { Status_Rumah: e.target.value })}
                      className="mt-1.5 w-full min-h-[48px] rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-base text-slate-900 focus:border-teal-700 focus:outline-none"
                    >
                      {STATUS_RUMAH_PRESETS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                      <option value="Input Manual">Input Manual Lainnya...</option>
                    </select>
                    {anggota.Status_Rumah === 'Input Manual' && (
                      <input
                        type="text"
                        placeholder="Contoh: Rumah Dinas / Kost"
                        value={anggota.statusRumahCustom}
                        onChange={(e) =>
                          updateAnggota(idx, { statusRumahCustom: e.target.value })
                        }
                        className="mt-2 w-full min-h-[44px] rounded-xl border border-slate-300 px-3.5 py-2 text-base text-slate-900 focus:border-teal-700 focus:outline-none"
                      />
                    )}
                  </div>

                  <div>
                    <label htmlFor={`tahun-bansos-${idx}`} className="block text-sm font-semibold text-slate-800">
                      Tahun Penerimaan Bansos
                    </label>
                    <input
                      id={`tahun-bansos-${idx}`}
                      type="number"
                      min={2000}
                      max={2100}
                      value={anggota.tahunBantuan}
                      onChange={(e) =>
                        updateAnggota(idx, {
                          tahunBantuan: Number(e.target.value) || new Date().getFullYear(),
                        })
                      }
                      className="mt-1.5 w-full min-h-[48px] rounded-xl border border-slate-300 px-4 py-2.5 font-mono text-base text-slate-900 focus:border-teal-700 focus:outline-none"
                    />
                  </div>

                  <div className="sm:col-span-2 lg:col-span-3">
                    <label htmlFor={`kesehatan-${idx}`} className="block text-sm font-semibold text-slate-800">
                      Catatan Kesehatan (Opsional)
                    </label>
                    <input
                      id={`kesehatan-${idx}`}
                      type="text"
                      placeholder="Contoh: Hipertensi, butuh kunjungan Posbindu, disabilitas, atau kosongkan"
                      value={anggota.Catatan_Kesehatan}
                      onChange={(e) => updateAnggota(idx, { Catatan_Kesehatan: e.target.value })}
                      className="mt-1.5 w-full min-h-[48px] rounded-xl border border-slate-300 px-4 py-2.5 text-base text-slate-900 focus:border-teal-700 focus:outline-none"
                    />
                  </div>

                  <div className="sm:col-span-2 lg:col-span-3">
                    <span className="block text-sm font-semibold text-slate-800">
                      Bantuan Sosial yang Diterima (Centang jika ada)
                    </span>
                    <div className="mt-2.5 grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
                      {BANSOS_PRESETS.map((jenis) => {
                        const checked = anggota.bantuanJenis.includes(jenis);
                        return (
                          <label
                            key={jenis}
                            className={`flex min-h-[48px] cursor-pointer items-center gap-3 rounded-xl border px-4 py-2.5 transition-colors ${
                              checked
                                ? 'border-teal-700 bg-teal-50 text-teal-900'
                                : 'border-slate-300 bg-white text-slate-800 hover:bg-slate-50'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleBantuan(idx, jenis)}
                              className="h-5 w-5 rounded border-slate-400 text-teal-700 focus:ring-teal-700"
                            />
                            <span className="text-base font-medium">{jenis}</span>
                          </label>
                        );
                      })}
                    </div>
                    <div className="mt-3">
                      <input
                        type="text"
                        placeholder="Bantuan lainnya (opsional, misal: BLT BBM, KIP)"
                        value={anggota.bantuanLainnya}
                        onChange={(e) => updateAnggota(idx, { bantuanLainnya: e.target.value })}
                        className="w-full min-h-[44px] rounded-xl border border-slate-300 px-4 py-2 text-base text-slate-900 focus:border-teal-700 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </section>
          );
        })}

        {/* Tambah Anggota & Simpan Data */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={addAnggotaRow}
            className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-xl border-2 border-slate-300 bg-white px-5 py-3 text-base font-semibold text-slate-800 transition-colors hover:border-teal-700 hover:bg-slate-50"
          >
            <UserPlus className="h-5 w-5 text-teal-700" aria-hidden="true" />
            <span>Tambah Anggota Keluarga di KK Ini</span>
          </button>

          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex min-h-[56px] items-center justify-center gap-2.5 rounded-xl bg-teal-700 px-8 py-3.5 text-lg font-bold text-white transition-colors hover:bg-teal-800 disabled:bg-slate-400"
          >
            <Plus className="h-5 w-5" aria-hidden="true" />
            <span>{isSaving ? 'Menyimpan...' : 'Simpan Data'}</span>
          </button>
        </div>

        {Object.values(errors).some(Boolean) && (
          <div
            role="alert"
            className="flex items-center gap-3 rounded-xl border border-red-300 bg-red-50 p-4 text-base font-medium text-red-800"
          >
            <AlertCircle className="h-5 w-5 shrink-0" aria-hidden="true" />
            <span>
              Masih terdapat isian yang belum valid (pastikan Nomor KK dan NIK tepat 16 digit angka serta nama dan tanggal lahir terisi).
            </span>
          </div>
        )}
      </form>
    </div>
  );
};
