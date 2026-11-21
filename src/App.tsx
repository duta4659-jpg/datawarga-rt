import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  FileBarChart2,
  Home,
  ScanLine,
  Users,
  WifiOff,
} from 'lucide-react';
import {
  clearAllLocalData,
  deleteWargaByNIK,
  ensureInitialSampleData,
  exportLocalBackupJSON,
  getAllEnrichedWarga,
  getRTProfile,
  importLocalBackupJSON,
  saveKeluargaDanWarga,
  saveRTProfile,
  seedSampleData,
  setWargaBantuan,
  updateWargaProfile,
} from './db/database';
import {
  ActiveTab,
  AgeCategory,
  BantuanSosial,
  Keluarga,
  RTProfile,
  Warga,
  WargaEnriched,
} from './types/models';
import { ScreenDashboard } from './components/ScreenDashboard';
import { ScreenInputScan } from './components/ScreenInputScan';
import { ScreenWargaList } from './components/ScreenWargaList';
import { ScreenLaporan } from './components/ScreenLaporan';
import { PWAInstallButton } from './components/PWAInstallButton';
import { useOnlineStatus } from './hooks/usePWAInstall';
import { todayISO } from './utils/age';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [wargaList, setWargaList] = useState<WargaEnriched[]>([]);
  const [keluargaList, setKeluargaList] = useState<Keluarga[]>([]);
  const [rtProfile, setRtProfile] = useState<RTProfile>(() => getRTProfile());
  const [isLoading, setIsLoading] = useState(true);
  const [wargaAgeFilter, setWargaAgeFilter] = useState<AgeCategory | 'ALL' | 'BALITA_BATITA'>('ALL');
  const [focusSearchTrigger, setFocusSearchTrigger] = useState(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const isOnline = useOnlineStatus();

  const showToast = useCallback((message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage((prev) => (prev === message ? null : prev));
    }, 3500);
  }, []);

  const refreshData = useCallback(async () => {
    const data = await getAllEnrichedWarga();
    setWargaList(data.wargaList);
    setKeluargaList(data.keluargaList);
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        await ensureInitialSampleData();
        if (mounted) {
          await refreshData();
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [refreshData]);

  const existingNiks = useMemo(() => {
    return new Set(wargaList.map((w) => w.NIK));
  }, [wargaList]);

  const handleSaveKeluargaWarga = async (
    keluarga: Keluarga,
    anggotaList: Array<{
      warga: Warga;
      bantuanJenis: string[];
      tahunBantuan: number;
    }>
  ) => {
    await saveKeluargaDanWarga(keluarga, anggotaList);
    await refreshData();
    showToast(`Berhasil menyimpan ${anggotaList.length} data warga ke penyimpanan lokal.`);
    setWargaAgeFilter('ALL');
    setActiveTab('warga');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleUpdateWarga = async (warga: Warga) => {
    await updateWargaProfile(warga);
    await refreshData();
    showToast(`Data ${warga.Nama_Lengkap} berhasil diperbarui.`);
  };

  const handleUpdateBantuan = async (
    nik: string,
    entries: Omit<BantuanSosial, 'ID_Bantuan'>[]
  ) => {
    await setWargaBantuan(nik, entries);
    await refreshData();
    showToast('Status bantuan sosial tersimpan di perangkat.');
  };

  const handleDeleteWarga = async (nik: string) => {
    await deleteWargaByNIK(nik);
    await refreshData();
    showToast('Data warga telah dihapus dari penyimpanan lokal.');
  };

  const handleUpdateRTProfile = (profile: RTProfile) => {
    saveRTProfile(profile);
    setRtProfile(profile);
    showToast('Identitas RT berhasil diperbarui.');
  };

  const handleExportBackup = async () => {
    const json = await exportLocalBackupJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Cadangan_DataWarga_RT_${todayISO()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    showToast('File cadangan JSON berhasil diunduh.');
  };

  const handleImportBackup = async (file: File) => {
    try {
      const text = await file.text();
      const res = await importLocalBackupJSON(text);
      setRtProfile(getRTProfile());
      await refreshData();
      showToast(`Berhasil memulihkan ${res.keluargaCount} KK dan ${res.wargaCount} warga.`);
    } catch {
      showToast('Gagal memulihkan file: format JSON tidak sesuai.');
    }
  };

  const handleLoadSampleData = async () => {
    await seedSampleData();
    await refreshData();
    showToast('Data contoh RT berhasil dimuat ke IndexedDB.');
  };

  const handleClearAllData = async () => {
    await clearAllLocalData();
    await refreshData();
    showToast('Seluruh data lokal telah dikosongkan.');
  };

  const navItems: Array<{
    id: ActiveTab;
    label: string;
    shortLabel: string;
    icon: typeof Home;
  }> = [
    { id: 'dashboard', label: 'Beranda', shortLabel: 'Beranda', icon: Home },
    { id: 'input', label: 'Scan / Input KK', shortLabel: 'Input KK', icon: ScanLine },
    { id: 'warga', label: 'Daftar Warga', shortLabel: 'Warga', icon: Users },
    { id: 'laporan', label: 'Laporan', shortLabel: 'Laporan', icon: FileBarChart2 },
  ];

  const switchTab = (tab: ActiveTab) => {
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Top Bar: Compact on mobile, clean 3-zone contract on desktop */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex h-14 lg:h-16 max-w-7xl items-center justify-between gap-8 px-4 sm:px-6 lg:px-8">
          {/* Zone 1: Single text element wordmark */}
          <button
            type="button"
            onClick={() => switchTab('dashboard')}
            className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-teal-700"
          >
            DataWarga RT
          </button>

          {/* Zone 2: Desktop Navigation Links */}
          <nav
            aria-label="Navigasi Utama"
            className="hidden lg:flex items-center gap-7 text-sm font-semibold text-slate-600"
          >
            {navItems.map((item) => {
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => switchTab(item.id)}
                  className={`py-1.5 border-b-2 transition-colors whitespace-nowrap shrink-0 ${
                    active
                      ? 'border-teal-700 text-teal-800'
                      : 'border-transparent text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Single Primary / Contextual Action */}
          <div className="flex items-center gap-3 shrink-0">
            <PWAInstallButton />
            <button
              type="button"
              onClick={() => switchTab('input')}
              className="hidden lg:inline-flex min-h-[40px] items-center gap-2 rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-teal-800 whitespace-nowrap shrink-0"
            >
              <ScanLine className="h-4 w-4" aria-hidden="true" />
              <span>Input KK Baru</span>
            </button>
          </div>
        </div>
      </header>

      {/* Offline Notification Strip (only when browser is offline) */}
      {!isOnline && (
        <div
          role="status"
          className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-sm font-medium text-amber-900"
        >
          <span className="inline-flex items-center gap-2">
            <WifiOff className="h-4 w-4 shrink-0" aria-hidden="true" />
            Mode Offline Aktif — Seluruh data warga tersimpan aman dan tetap dapat diakses secara lokal.
          </span>
        </div>
      )}

      {/* Main Content */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 pb-24 sm:px-6 lg:px-8 lg:py-8 lg:pb-12">
        {isLoading ? (
          <div className="space-y-4">
            <div className="h-10 w-64 rounded-xl bg-slate-200" />
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-32 rounded-2xl bg-slate-200" />
              ))}
            </div>
          </div>
        ) : (
          <>
            {activeTab === 'dashboard' && (
              <ScreenDashboard
                wargaList={wargaList}
                keluargaList={keluargaList}
                rtProfile={rtProfile}
                onUpdateRTProfile={handleUpdateRTProfile}
                onNavigateToInput={() => switchTab('input')}
                onNavigateToSearch={(filter = 'ALL') => {
                  setWargaAgeFilter(filter);
                  setFocusSearchTrigger((c) => c + 1);
                  switchTab('warga');
                }}
                onExportBackup={handleExportBackup}
                onImportBackup={handleImportBackup}
                onLoadSampleData={handleLoadSampleData}
                onClearAllData={handleClearAllData}
              />
            )}

            {activeTab === 'input' && (
              <ScreenInputScan
                existingKeluarga={keluargaList}
                existingNiks={existingNiks}
                onSaveSuccess={handleSaveKeluargaWarga}
              />
            )}

            {activeTab === 'warga' && (
              <ScreenWargaList
                wargaList={wargaList}
                initialAgeFilter={wargaAgeFilter}
                focusSearchTrigger={focusSearchTrigger}
                onUpdateWarga={handleUpdateWarga}
                onUpdateBantuan={handleUpdateBantuan}
                onDeleteWarga={handleDeleteWarga}
                onGoToInput={() => switchTab('input')}
              />
            )}

            {activeTab === 'laporan' && (
              <ScreenLaporan
                wargaList={wargaList}
                rtProfile={rtProfile}
                onNotify={showToast}
              />
            )}
          </>
        )}
      </main>

      {/* Toast Feedback */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-20 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2.5 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-lg lg:bottom-6 max-w-[92vw]"
        >
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" aria-hidden="true" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Fixed Bottom Navigation (Mobile & Tablet) */}
      <nav
        aria-label="Navigasi Bawah"
        className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur-md pb-safe lg:hidden"
      >
        <div className="grid h-16 grid-cols-4 items-center">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => switchTab(item.id)}
                className={`flex h-full min-h-[44px] flex-col items-center justify-center gap-1 px-1 transition-colors ${
                  active ? 'text-teal-700' : 'text-slate-600 hover:text-slate-900'
                }`}
                aria-current={active ? 'page' : undefined}
              >
                <Icon
                  className="h-[22px] w-[22px]"
                  strokeWidth={active ? 2.4 : 1.9}
                  aria-hidden="true"
                />
                <span
                  className={`text-[11px] leading-none tracking-tight whitespace-nowrap ${
                    active ? 'font-bold text-teal-800' : 'font-medium'
                  }`}
                >
                  {item.shortLabel}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
