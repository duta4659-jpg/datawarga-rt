import React, { useMemo, useState } from 'react';
import { FileSpreadsheet, FileText, Filter } from 'lucide-react';
import {
  LAPORAN_FILTER_OPTIONS,
  LaporanFilter,
  RTProfile,
  WargaEnriched,
} from '../types/models';
import { exportLaporanToDOCX, exportLaporanToPDF } from '../utils/exporters';

interface ScreenLaporanProps {
  wargaList: WargaEnriched[];
  rtProfile: RTProfile;
  onNotify: (msg: string) => void;
}

export const ScreenLaporan: React.FC<ScreenLaporanProps> = ({
  wargaList,
  rtProfile,
  onNotify,
}) => {
  const [selectedFilter, setSelectedFilter] = useState<LaporanFilter>('SEMUA');
  const [isExporting, setIsExporting] = useState<'pdf' | 'docx' | null>(null);

  const selectedFilterLabel = useMemo(
    () =>
      LAPORAN_FILTER_OPTIONS.find((opt) => opt.value === selectedFilter)?.label ??
      'Semua Warga',
    [selectedFilter]
  );

  const filteredRows = useMemo(() => {
    return wargaList.filter((w) => {
      switch (selectedFilter) {
        case 'SEMUA':
          return true;
        case 'LANSIA':
          return w.usiaTahun >= 65;
        case 'BALITA_BATITA':
          return w.usiaTahun <= 5;
        case 'USIA_SEKOLAH':
          return w.usiaTahun >= 6 && w.usiaTahun <= 17;
        case 'DEWASA':
          return w.usiaTahun >= 18 && w.usiaTahun <= 64;
        case 'PKH':
          return w.bantuanList.some(
            (b) => b.Status === 'Aktif' && b.Jenis_Bantuan === 'PKH'
          );
        case 'BPNT/Sembako':
          return w.bantuanList.some(
            (b) => b.Status === 'Aktif' && b.Jenis_Bantuan === 'BPNT/Sembako'
          );
        case 'BLT Desa':
          return w.bantuanList.some(
            (b) => b.Status === 'Aktif' && b.Jenis_Bantuan === 'BLT Desa'
          );
        case 'PBI BPJS':
          return w.bantuanList.some(
            (b) => b.Status === 'Aktif' && b.Jenis_Bantuan === 'PBI BPJS'
          );
        case 'SEMUA_BANSOS':
          return w.bantuanList.some((b) => b.Status === 'Aktif');
        default:
          return true;
      }
    });
  }, [wargaList, selectedFilter]);

  const handleExportPDF = () => {
    if (filteredRows.length === 0) return;
    setIsExporting('pdf');
    try {
      exportLaporanToPDF(filteredRows, selectedFilterLabel, rtProfile);
      onNotify(`Berhasil mengekspor ${filteredRows.length} data warga ke PDF.`);
    } finally {
      setIsExporting(null);
    }
  };

  const handleExportDOCX = async () => {
    if (filteredRows.length === 0) return;
    setIsExporting('docx');
    try {
      await exportLaporanToDOCX(filteredRows, selectedFilterLabel, rtProfile);
      onNotify(`Berhasil mengekspor ${filteredRows.length} data warga ke DOCX.`);
    } finally {
      setIsExporting(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header + Export Buttons di Pojok Kanan Atas */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Laporan & Ekspor Data
          </h1>
          <p className="mt-1 text-base text-slate-600">
            Saring daftar warga sesuai kebutuhan lalu unduh laporan tabel rapi ke PDF atau DOCX.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleExportPDF}
            disabled={filteredRows.length === 0 || isExporting !== null}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600 whitespace-nowrap shrink-0"
          >
            <FileText className="h-4 w-4" aria-hidden="true" />
            <span>{isExporting === 'pdf' ? 'Menyiapkan PDF...' : 'Ekspor ke PDF'}</span>
          </button>

          <button
            type="button"
            onClick={handleExportDOCX}
            disabled={filteredRows.length === 0 || isExporting !== null}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 whitespace-nowrap shrink-0"
          >
            <FileSpreadsheet className="h-4 w-4 text-teal-700" aria-hidden="true" />
            <span>{isExporting === 'docx' ? 'Menyiapkan DOCX...' : 'Ekspor ke DOCX'}</span>
          </button>
        </div>
      </div>

      {/* Dropdown Filter */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex-1 max-w-md">
            <label
              htmlFor="laporan-filter-select"
              className="flex items-center gap-2 text-sm font-semibold text-slate-800"
            >
              <Filter className="h-4 w-4 text-teal-700" aria-hidden="true" />
              <span>Tampilkan data berdasarkan...</span>
            </label>
            <select
              id="laporan-filter-select"
              value={selectedFilter}
              onChange={(e) => setSelectedFilter(e.target.value as LaporanFilter)}
              className="mt-2 w-full min-h-[48px] rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-base font-medium text-slate-900 focus:border-teal-700 focus:outline-none"
            >
              {LAPORAN_FILTER_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="text-sm sm:text-base text-slate-700 tabular-nums">
            Total sesuai filter:{' '}
            <strong className="text-lg font-bold text-slate-900">{filteredRows.length}</strong> warga
          </div>
        </div>
      </section>

      {/* Tabel Data di Layar */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        {filteredRows.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-lg font-bold text-slate-900">
              Tidak ada warga untuk kategori "{selectedFilterLabel}"
            </p>
            <p className="mt-1 text-base text-slate-600">
              Pilih filter lain atau lengkapi data warga terlebih dahulu.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-bold text-slate-700">
                  <th className="px-4 py-3.5 text-center w-12">No</th>
                  <th className="px-4 py-3.5">NIK</th>
                  <th className="px-4 py-3.5">Nama Lengkap</th>
                  <th className="px-4 py-3.5">No. KK</th>
                  <th className="px-4 py-3.5 text-center">L/P</th>
                  <th className="px-4 py-3.5">Usia & Kategori</th>
                  <th className="px-4 py-3.5">Status Keluarga</th>
                  <th className="px-4 py-3.5">Status Rumah</th>
                  <th className="px-4 py-3.5">Alamat</th>
                  <th className="px-4 py-3.5">Bantuan Sosial</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-800">
                {filteredRows.map((w, idx) => {
                  const bansosAktif = w.bantuanList
                    .filter((b) => b.Status === 'Aktif')
                    .map((b) => `${b.Jenis_Bantuan} (${b.Tahun_Penerimaan})`);

                  return (
                    <tr key={w.NIK} className="hover:bg-slate-50/80">
                      <td className="px-4 py-3.5 text-center font-mono tabular-nums text-slate-500">
                        {idx + 1}
                      </td>
                      <td className="px-4 py-3.5 font-mono text-xs sm:text-sm tabular-nums whitespace-nowrap">
                        {w.NIK}
                      </td>
                      <td className="px-4 py-3.5 font-semibold text-slate-900 whitespace-nowrap">
                        {w.Nama_Lengkap}
                      </td>
                      <td className="px-4 py-3.5 font-mono text-xs sm:text-sm tabular-nums whitespace-nowrap text-slate-600">
                        {w.Nomor_KK}
                      </td>
                      <td className="px-4 py-3.5 text-center font-semibold">
                        {w.Jenis_Kelamin === 'Laki-laki' ? 'L' : 'P'}
                      </td>
                      <td className="px-4 py-3.5 tabular-nums whitespace-nowrap">
                        <span className="font-medium text-slate-900">{w.usiaFormatted}</span>
                        <span className="block text-xs text-slate-500">{w.kategoriUsia}</span>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        {w.Status_Dalam_Keluarga}
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        {w.Status_Rumah}
                      </td>
                      <td className="px-4 py-3.5 min-w-[200px] text-slate-600">
                        {w.keluarga?.Alamat_Lengkap ?? '-'}
                      </td>
                      <td className="px-4 py-3.5 min-w-[160px]">
                        {bansosAktif.length > 0 ? bansosAktif.join(', ') : '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};
