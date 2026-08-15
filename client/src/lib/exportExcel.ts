import ExcelJS from "exceljs";

export interface ExportColumn<T> {
  header: string;
  key: string;
  width?: number;
  getValue?: (row: T) => string | number | null;
}

export async function exportToExcel<T>(
  rows: T[],
  columns: ExportColumn<T>[],
  fileName: string,
  sheetTitle: string = "Data"
): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(sheetTitle);

  worksheet.columns = columns.map(c => ({
    header: c.header,
    key: c.key,
    width: c.width ?? 18,
  }));

  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF1E40AF" },
  };
  headerRow.alignment = { horizontal: "center", vertical: "middle" };

  for (const row of rows) {
    const values: Record<string, string | number | null> = {};
    for (const col of columns) {
      values[col.key] = col.getValue ? col.getValue(row) : (row as any)[col.key];
    }
    worksheet.addRow(values);
  }

  worksheet.eachRow(row => {
    row.alignment = { vertical: "middle", wrapText: false };
    row.border = {
      top: { style: "thin", color: { argb: "FFD1D5DB" } },
      bottom: { style: "thin", color: { argb: "FFD1D5DB" } },
      left: { style: "thin", color: { argb: "FFD1D5DB" } },
      right: { style: "thin", color: { argb: "FFD1D5DB" } },
    };
  });

  worksheet.views = [{ rightToLeft: true, state: "frozen", ySplit: 1 }];
  worksheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: Math.max(1, rows.length + 1), column: columns.length } };

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName.endsWith(".xlsx") ? fileName : `${fileName}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}
