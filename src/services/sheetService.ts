import { Partner, AttendanceRecord, StayReport } from '../types';
import { SHEET_ID, SCRIPT_URL, DATA_TAB_NAME } from '../constants';

const normalize = (str: string) =>
  str?.toString().trim().toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') || '';

/* ======================================================
   EMPRESAS
====================================================== */
export async function fetchCompanies(): Promise<string[]> {
  if (!SCRIPT_URL) return [];

  try {
    const res = await fetch(`${SCRIPT_URL}?t=${Date.now()}`);
    const data = await res.json();

    return (data.companies || []).filter((n: string) => {
      const name = normalize(n);
      return name !== 'dados' &&
        !['config', 'log', 'base'].some(k => name.includes(k));
    });

  } catch {
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
      .map(line =>
        line
          .split(regex)
          .map(cell => cell.replace(/^"|"$/g, '').trim())
      )
      .filter(row => row.length >= 2);

  } catch {
    return [];
  }
}

/* ======================================================
   PARCEIROS
====================================================== */
export function parsePartners(csv: string[][], company: string): Partner[] {

  if (csv.length <= 1) return [];

  return csv.slice(1).map((r, i) => {

    const name = r[0]?.trim();

    if (!name) return null;

    return {
      id: `p-${company}-${i}`,
      name: name,
      document: r[2] || '',
      company: company,
      status: r[1]?.trim() || 'Ativo'
    };

  }).filter(Boolean) as Partner[];
}

/* ======================================================
   PARSER DA ABA DADOS
   A: ID
   B: DataEntrada
   C: Nome
   D: Status
   E: DataSaida
   F: Empresa
====================================================== */
export function parseAttendanceRecords(rows: string[][]): AttendanceRecord[] {

  if (rows.length <= 1) return [];

  const records: AttendanceRecord[] = [];

  rows.slice(1).forEach(row => {

    const [id, dataEntrada, nome, , dataSaida, empresa] = row;

    if (!nome || !dataEntrada) return;

    const entryDate = new Date(dataEntrada);

    if (!isNaN(entryDate.getTime())) {

      records.push({
        id: id || `e-${crypto.randomUUID()}`,
        partnerId: '',
        partnerName: nome.trim(),
        company: empresa || 'Parceiro',
        type: 'ENTRY',
        timestamp: entryDate
      });

    }

    if (dataSaida && dataSaida.trim() !== '') {

      const exitDate = new Date(dataSaida);

      if (!isNaN(exitDate.getTime())) {

        records.push({
          id: id || `s-${crypto.randomUUID()}`,
          partnerId: '',
          partnerName: nome.trim(),
          company: empresa || 'Parceiro',
          type: 'EXIT',
          timestamp: exitDate
        });

      }
    }

  });

  // Ordena do mais recente
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

  const last = records
    .filter(r => normalize(r.partnerName) === normalized)
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0];

  return last?.type === 'ENTRY';
}

/* ======================================================
   RELATÓRIO DE PERMANÊNCIA
====================================================== */
export function calculateStayReports(
  records: AttendanceRecord[]
): StayReport[] {

  const sorted = [...records]
    .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

  const open: Record<string, AttendanceRecord> = {};

  const result: StayReport[] = [];

  sorted.forEach(r => {

    const key = normalize(r.partnerName);

    if (r.type === 'ENTRY') {

      open[key] = r;

    }

    if (r.type === 'EXIT' && open[key]) {

      const entry = open[key];

      const duration =
        Math.round(
          (r.timestamp.getTime() - entry.timestamp.getTime()) / 60000
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

  // Pessoas ainda dentro
  Object.values(open).forEach(e => {

    result.push({
      recordId: e.id,
      partnerName: e.partnerName,
      company: e.company,
      entryTime: e.timestamp
    });

  });

  return result.sort((a, b) =>
    b.entryTime.getTime() - a.entryTime.getTime()
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
      body: JSON.stringify({
        name: p.name,
        company: p.company,
        type,
        tab: DATA_TAB_NAME
      })
    });

    return true;

  } catch {

    return false;

  }
}
