export function toCsv(
  columns: { key: string; label: string }[],
  rows: Record<string, string | number>[],
): string {
  const csvValue = (value: string | number): string => {
    const text = String(value ?? "");
    if (text.includes(",") || text.includes('"') || text.includes("\n")) {
      return `"${text.replace(/"/g, '""')}"`;
    }
    return text;
  };
  const header = columns.map((column) => csvValue(column.label)).join(",");
  const body = rows
    .map((row) =>
      columns.map((column) => csvValue(row[column.key] ?? "")).join(","),
    )
    .join("\n");
  return `${header}\n${body}`;
}

export function downloadCsv(
  filename: string,
  columns: { key: string; label: string }[],
  rows: Record<string, string | number>[],
): void {
  const csv = toCsv(columns, rows);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
