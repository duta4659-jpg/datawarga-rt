import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  AlignmentType,
  BorderStyle,
  Document,
  Packer,
  PageOrientation,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from 'docx';
import { RTProfile, WargaEnriched } from '../types/models';
import { formatDateIndo, todayISO } from './age';

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function activeBansosString(w: WargaEnriched): string {
  const aktif = w.bantuanList.filter((b) => b.Status === 'Aktif');
  if (aktif.length === 0) return '-';
  return aktif.map((b) => `${b.Jenis_Bantuan} (${b.Tahun_Penerimaan})`).join(', ');
}

function safeSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
}

export function exportLaporanToPDF(
  rows: WargaEnriched[],
  filterLabel: string,
  rtProfile: RTProfile
): void {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const todayLabel = formatDateIndo(todayISO());

  // Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(`LAPORAN DATA KEPENDUDUKAN ${rtProfile.namaRT.toUpperCase()}`, 14, 15);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`${rtProfile.kelurahan}, ${rtProfile.kecamatan}`, 14, 21);
  doc.text(`Filter: ${filterLabel}   |   Jumlah Data: ${rows.length} Warga   |   Tanggal Cetak: ${todayLabel}`, 14, 27);

  autoTable(doc, {
    startY: 32,
    head: [
      [
        'No',
        'NIK',
        'Nama Lengkap',
        'No. KK',
        'L/P',
        'Usia & Kategori',
        'Status Keluarga',
        'Status Rumah',
        'Alamat',
        'Bantuan Sosial Aktif',
      ],
    ],
    body: rows.map((w, idx) => [
      String(idx + 1),
      w.NIK,
      w.Nama_Lengkap,
      w.Nomor_KK,
      w.Jenis_Kelamin === 'Laki-laki' ? 'L' : 'P',
      `${w.usiaFormatted}\n(${w.kategoriUsia})`,
      w.Status_Dalam_Keluarga,
      w.Status_Rumah || '-',
      w.keluarga?.Alamat_Lengkap ?? '-',
      activeBansosString(w),
    ]),
    styles: {
      fontSize: 8,
      cellPadding: 2.5,
      overflow: 'linebreak',
      textColor: [15, 23, 42],
    },
    headStyles: {
      fillColor: [15, 118, 110],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { cellWidth: 9, halign: 'center' },
      1: { cellWidth: 31 },
      2: { cellWidth: 34 },
      3: { cellWidth: 31 },
      4: { cellWidth: 9, halign: 'center' },
      5: { cellWidth: 30 },
      6: { cellWidth: 25 },
      7: { cellWidth: 22 },
      8: { cellWidth: 46 },
      9: { cellWidth: 32 },
    },
    margin: { left: 14, right: 14 },
  });

  const finalY = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 150;
  const pageHeight = doc.internal.pageSize.getHeight();
  let signY = finalY + 12;
  if (signY + 28 > pageHeight) {
    doc.addPage();
    signY = 20;
  }

  doc.setFontSize(9.5);
  doc.text(`${rtProfile.kelurahan}, ${todayLabel}`, 220, signY);
  doc.text(`Ketua ${rtProfile.namaRT}`, 220, signY + 6);
  doc.setFont('helvetica', 'bold');
  doc.text(rtProfile.namaKetuaRT, 220, signY + 24);

  const filename = `Laporan_Warga_${safeSlug(filterLabel)}_${todayISO()}.pdf`;
  doc.save(filename);
}

export async function exportLaporanToDOCX(
  rows: WargaEnriched[],
  filterLabel: string,
  rtProfile: RTProfile
): Promise<void> {
  const todayLabel = formatDateIndo(todayISO());

  const headerTitles = [
    'No',
    'NIK',
    'Nama Lengkap',
    'No. KK',
    'L/P',
    'Usia & Kategori',
    'Status Keluarga',
    'Status Rumah',
    'Alamat',
    'Bantuan Sosial',
  ];

  const colWidths = [5, 13, 14, 13, 4, 13, 10, 9, 11, 8];

  const borderStyle = {
    style: BorderStyle.SINGLE,
    size: 4,
    color: 'CBD5E1',
  };

  const cellBorders = {
    top: borderStyle,
    bottom: borderStyle,
    left: borderStyle,
    right: borderStyle,
  };

  const headerRow = new TableRow({
    tableHeader: true,
    children: headerTitles.map(
      (title, i) =>
        new TableCell({
          width: { size: colWidths[i], type: WidthType.PERCENTAGE },
          shading: { fill: '0F766E' },
          borders: cellBorders,
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: title,
                  bold: true,
                  color: 'FFFFFF',
                  size: 18,
                  font: 'Calibri',
                }),
              ],
            }),
          ],
        })
    ),
  });

  const dataRows = rows.map(
    (w, idx) =>
      new TableRow({
        children: [
          String(idx + 1),
          w.NIK,
          w.Nama_Lengkap,
          w.Nomor_KK,
          w.Jenis_Kelamin === 'Laki-laki' ? 'L' : 'P',
          `${w.usiaFormatted} (${w.kategoriUsia})`,
          w.Status_Dalam_Keluarga,
          w.Status_Rumah || '-',
          w.keluarga?.Alamat_Lengkap ?? '-',
          activeBansosString(w),
        ].map(
          (val, i) =>
            new TableCell({
              width: { size: colWidths[i], type: WidthType.PERCENTAGE },
              shading: idx % 2 === 1 ? { fill: 'F8FAFC' } : undefined,
              borders: cellBorders,
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: val,
                      size: 17,
                      font: 'Calibri',
                      color: '0F172A',
                    }),
                  ],
                }),
              ],
            })
        ),
      })
  );

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            size: {
              orientation: PageOrientation.LANDSCAPE,
            },
            margin: {
              top: 720,
              right: 720,
              bottom: 720,
              left: 720,
            },
          },
        },
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: `LAPORAN DATA KEPENDUDUKAN ${rtProfile.namaRT.toUpperCase()}`,
                bold: true,
                size: 28,
                font: 'Calibri',
                color: '0F172A',
              }),
            ],
          }),
          new Paragraph({
            spacing: { after: 120 },
            children: [
              new TextRun({
                text: `${rtProfile.kelurahan}, ${rtProfile.kecamatan}  |  Filter: ${filterLabel}  |  Total: ${rows.length} Warga  |  Tanggal: ${todayLabel}`,
                size: 20,
                font: 'Calibri',
                color: '475569',
              }),
            ],
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [headerRow, ...dataRows],
          }),
          new Paragraph({
            spacing: { before: 360 },
            alignment: AlignmentType.RIGHT,
            children: [
              new TextRun({
                text: `${rtProfile.kelurahan}, ${todayLabel}`,
                size: 20,
                font: 'Calibri',
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [
              new TextRun({
                text: `Ketua ${rtProfile.namaRT}`,
                size: 20,
                font: 'Calibri',
              }),
            ],
          }),
          new Paragraph({
            spacing: { before: 480 },
            alignment: AlignmentType.RIGHT,
            children: [
              new TextRun({
                text: rtProfile.namaKetuaRT,
                bold: true,
                size: 20,
                font: 'Calibri',
              }),
            ],
          }),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const filename = `Laporan_Warga_${safeSlug(filterLabel)}_${todayISO()}.docx`;
  triggerDownload(blob, filename);
}
