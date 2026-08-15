import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export interface PdfColumn<T> {
  header: string;
  getValue: (row: T) => string | number;
}

export function exportToPdf<T>(
  rows: T[],
  columns: PdfColumn<T>[],
  title: string,
  fileName: string
): void {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

  doc.setFontSize(16);
  doc.text(title, 14, 16);
  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text(`Generated: ${new Date().toLocaleString("en-GB")} | Rows: ${rows.length}`, 14, 23);

  autoTable(doc, {
    startY: 28,
    head: [columns.map(c => c.header)],
    body: rows.map(row => columns.map(c => String(c.getValue(row)))),
    styles: { fontSize: 8, cellPadding: 2, lineColor: [200, 205, 215], lineWidth: 0.1 },
    headStyles: { fillColor: [30, 64, 175], textColor: [255, 255, 255], fontStyle: "bold" },
    alternateRowStyles: { fillColor: [244, 246, 250] },
    margin: { left: 10, right: 10 },
    showHead: "everyPage",
  });

  const totalPages = (doc as any).internal?.getNumberOfPages ? (doc as any).internal.getNumberOfPages() : 1;
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`Page ${i} of ${totalPages}`, doc.internal.pageSize.getWidth() - 25, doc.internal.pageSize.getHeight() - 8);
  }

  doc.save(fileName.endsWith(".pdf") ? fileName : `${fileName}.pdf`);
}
