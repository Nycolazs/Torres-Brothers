export function parseCsv(text: string): Record<string, string>[] {
  const normalized = text.replace(/^\uFEFF/, '').trim();
  if (!normalized) return [];

  const lines = normalized.split(/\r?\n/).filter(Boolean);
  const separator = lines[0].includes(';') ? ';' : ',';
  const headers = lines[0].split(separator).map((header) => header.trim());

  return lines.slice(1).map((line) => {
    const values = line.split(separator).map((value) => value.trim());
    return headers.reduce<Record<string, string>>((row, header, index) => {
      row[header] = values[index] || '';
      return row;
    }, {});
  });
}

export function readCsvNumber(value: string | undefined): number {
  if (!value) return 0;
  const normalized = value.replace(/\./g, '').replace(',', '.');
  return Number(normalized) || 0;
}

export function readCsvDate(value: string | undefined): Date {
  if (!value) return new Date();
  const [day, month, year] = value.includes('/')
    ? value.split('/').map(Number)
    : [];

  if (day && month && year) {
    return new Date(year, month - 1, day);
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}
