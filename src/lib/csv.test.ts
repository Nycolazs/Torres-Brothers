import { describe, expect, it } from 'vitest';
import { parseCsv, readCsvDate, readCsvNumber } from './csv';

describe('csv helpers', () => {
  it('parses semicolon separated CSV rows', () => {
    const rows = parseCsv('name;document;amount\nCliente A;123;1.234,56');

    expect(rows).toEqual([
      {
        name: 'Cliente A',
        document: '123',
        amount: '1.234,56',
      },
    ]);
  });

  it('normalizes Brazilian currency numbers', () => {
    expect(readCsvNumber('1.234,56')).toBe(1234.56);
    expect(readCsvNumber('100')).toBe(100);
  });

  it('reads Brazilian dates', () => {
    const date = readCsvDate('02/06/2026');

    expect(date.getFullYear()).toBe(2026);
    expect(date.getMonth()).toBe(5);
    expect(date.getDate()).toBe(2);
  });
});
