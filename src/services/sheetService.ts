import { Partner, AttendanceRecord, StayReport } from '../types';
import { SHEET_ID, SCRIPT_URL, DATA_TAB_NAME } from '../constants';

const normalize = (str: string) =>
  str?.toString().trim().toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') || '';

function uid() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'id-' + Math.random().toString(36).substring(2, 10);
}

function parseBrazilianDate(value: string): Date | null {
  if (!value || !value.trim()) return null;

  const raw = value.trim();

  const brMatch = raw.match(
    /^(\d{1,2})\/(\d{1,2})\/(\d{2,4})(?:[ ,]+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/
  );

  if (brMatch) {
    const [, dd, mm, yyyy, hh = '0', min = '0', ss = '0'] = brMatch;
    const year = yyyy.length === 2 ? `20${yyyy}` : yyyy;

    const parsed = new Date(
      Number(year),
      Number(mm) - 1,
      Number(dd),
      Number(hh),
      Number(min),
      Number(ss)
    );

    return isNaN(parsed.getTime()) ? null : parsed;
  }

  return null;
}

/* ======================================================
   EMPRESAS
====================================================== */
export async function fetchCompanies(): Promise<string[]> {
  if (!SCRIPT_URL) return [];

  try {
    const res = await fetch(`${SCRIPT_URL}?t=${Date.now()}`, {
      cache: 'no-store'
    });

    const data = await res.json();

    return (data.companies || []).filter((n: string) => {
      const name = normalize(n);

      return (
        name !== 'dados' &&
        !['config', 'log', 'base'].some((k) => name.includes(k))
      );
    });
  } catch (err) {
    console.error('Erro fetchCompanies:', err);
    return [];
  }
}

/* ======================================================
   CSV LOADER
====================================================== */
export async function fetchSheetCSV(sheetName: string): Promise<string[][]> {
  try {
    const url =
      `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`;

    const res = await fetch(url, { cache: 'no-store' });
    const text = await res.text();

    const regex = /,(?=(?:(?:[^"]*"){2})*[^"]*$)/;

    return text
      .split(/\r?\n/)
      .map((line) =>
        line
          .split(regex)
          .map((cell) =>
            cell
              .replace(/^"|"$/g, '')
              .replace(/""/g, '"')
              .trim()
          )
      )
      .filter((row) => row.length > 1 && row.some((c) => c !== ''));
  } catch (err) {
    console.error('Erro fetchSheetCSV:', err);
    return [];
  }
}

/* ======================================================
   PARCEIROS
====================================================== */
export function parsePartners(csv: string[][], company: string): Partner[] {
  if (csv.length <= 1) return [];

  return csv
    .slice(1)
    .map((r, i) => {
      const name = r[0]?.trim();
      if (!name) return null;

      return {
        id: `p-${company}-${i}`,
        name,
        document: r[2] || '',
        company,
        status: r[1]?.trim() || 'Ativo'
      };
    })
    .filter(Boolean) as Partner[];
}

/* ======================================================
   PARSER DA ABA DADOS
====================================================== */
export function parseAttendanceRecords(rows: string[][]): AttendanceRecord[] {
  if (rows.length <= 1) return [];

  const records: AttendanceRecord[] = [];
  const now = Date.now();
  const twoDaysAgo = now - 1000 * 60 * 60 * 24 * 2;

  rows.slice(1).forEach((row) => {
    const [id, dataEntrada, nome, status, dataSaida, empresa] = row;

    if (!nome || !dataEntrada) return;

    const entryDate = parseBrazilianDate(dataEntrada);

    if (!entryDate || entryDate.getTime() < twoDaysAgo) return;

    records.push({
      id: `${id || `e-${uid()}`}-ENTRY`,
      partnerId: '',
      partnerName: nome.trim(),
      company: empresa || 'Parceiro',
      type: 'ENTRY',
      timestamp: entryDate
    });

    if ((status || '').toUpperCase() === 'EXIT' && dataSaida && dataSaida.trim() !== '') {
      let exitDate = parseBrazilianDate(dataSaida);

      // Se a planilha vier só com a data (sem hora) e a saída ficar
      // antes da entrada, ajusta para fechar a sessão corretamente.
      if (!exitDate) {
        exitDate = new Date(entryDate.getTime() + 1000);
      } else if (exitDate.getTime() <= entryDate.getTime()) {
        exitDate = new Date(entryDate.getTime() + 1000);
      }

      if (exitDate.getTime() >= twoDaysAgo) {
        records.push({
          id: `${id || `s-${uid()}`}-EXIT`,
          partnerId: '',
          partnerName: nome.trim(),
          company: empresa || 'Parceiro',
          type: 'EXIT',
          timestamp: exitDate
        });
      }
    }
  });

  return records.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
}

/* ======================================================
   PRESENÇA ATUAL
====================================================== */
export function isPartnerInside(
  records: AttendanceRecord[],
  partnerName: string
): boolean {
  const normalized = normalize(partnerName);

  const ordered = [...records]
    .filter((r) => normalize(r.partnerName) === normalized)
    .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

  if (ordered.length === 0) return false;

  return ordered[ordered.length - 1].type === 'ENTRY';
}

/* ======================================================
   RELATÓRIO DE PERMANÊNCIA
====================================================== */
export function calculateStayReports(
  records: AttendanceRecord[]
): StayReport[] {
  const sorted = [...records].sort(
    (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
  );

  const open: Record<string, AttendanceRecord> = {};
  const result: StayReport[] = [];

  sorted.forEach((r) => {
    const key = normalize(r.partnerName);

    if (r.type === 'ENTRY') {
      open[key] = r;
      return;
    }

    if (r.type === 'EXIT' && open[key]) {
      const entry = open[key];

      const duration = Math.max(
        1,
        Math.round((r.timestamp.getTime() - entry.timestamp.getTime()) / 60000)
      );

      result.push({
        recordId: entry.id,
        partnerName: entry.partnerName,
        company: entry.company,
        entryTime: entry.timestamp,
        exitTime: r.timestamp,
        durationMinutes: duration
      });

      delete open[key];
    }
  });

  Object.values(open).forEach((e) => {
    result.push({
      recordId: e.id,
      partnerName: e.partnerName,
      company: e.company,
      entryTime: e.timestamp
    });
  });

  return result.sort(
    (a, b) => b.entryTime.getTime() - a.entryTime.getTime()
  );
}

/* ======================================================
   ENVIO PARA APPS SCRIPT
====================================================== */
export async function appendRecord(
  p: { name: string; company: string },
  type: 'ENTRY' | 'EXIT'
): Promise<boolean> {
  if (!SCRIPT_URL) return false;

  try {
    await fetch(SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: JSON.stringify({
        name: p.name,
        company: p.company,
        type,
        tab: DATA_TAB_NAME
      })
    });

    return true;
  } catch (err) {
    console.error('Erro appendRecord:', err);
    return false;
  }
}

/* ======================================================
   LIMPAR TODOS OS REGISTROS
====================================================== */
export async function clearAllRecords(): Promise<boolean> {
  if (!SCRIPT_URL) return false;

  try {
    await fetch(SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: JSON.stringify({
        action: 'CLEAR',
        tab: DATA_TAB_NAME
      })
    });

    return true;
  } catch (err) {
    console.error('Erro clearAllRecords:', err);
    return false;
  }
}
