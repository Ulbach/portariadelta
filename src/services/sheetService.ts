import {
  Partner,
  AttendanceRecord,
  StayReport,
  DailySummary,
  CompanyReport
} from '../types';
import { SHEET_ID, SCRIPT_URL, DATA_TAB_NAME } from '../constants';

const normalize = (str: string) =>
  str?.toString().trim().toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') || '';

/* ======================================================
   EMPRESAS (abas)
====================================================== */
export async function fetchCompanies(): Promise<string[]> {
  if (!SCRIPT_URL) return [];
  try {
    const res = await fetch(`${SCRIPT_URL}?t=${Date.now()}`);
    const data = await res.json();
    return (data.companies || []).filter((n: string) =>
      !['dados', 'config', 'log', 'base'].some(k => normalize(n).includes(k))
    );
  } catch {
    return [];
  }
}

/* ======================================================
   CSV - Melhorado para lidar com aspas e vírgulas
====================================================== */
export async function fetchSheetCSV(sheetName: string): Promise<string[][]> {
  try {
    const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`;
    const res = await fetch(url, { cache: 'no-store' });
    const text = await res.text();
    return parseCSV(text);
  } catch {
    return [];
  }
}

function parseCSV(text: string): string[][] {
  if (!text) return [];
  // Regex para separar por vírgula, mas ignorar vírgulas dentro de aspas duplas
  const regex = /,(?=(?:(?:[^"]*"){2})*[^"]*$)/;
  return text.split(/\r?\n/)
    .map(line => line.split(regex).map(cell => cell.replace(/^"|"$/g, '').trim()))
    .filter(row => row.length >= 2);
}

/* ======================================================
   PARSER PRINCIPAL
====================================================== */
export function parseAttendanceRecords(rows: string[][]): AttendanceRecord[] {
  if (rows.length <= 1) return [];

  return rows.slice(1).flatMap(row => {
    if (row.length < 5) return [];

    const [id, dataEntrada, nome, , dataSaida, empresa] = row;
    if (!nome || !dataEntrada) return [];

    const records: AttendanceRecord[] = [];
    
    // Processamento seguro de datas
    const entryDate = new Date(dataEntrada);
    if (!isNaN(entryDate.getTime())) {
      records.push({
        id: id || `ent-${crypto.randomUUID()}`,
        partnerId: '',
        partnerName: nome.trim(),
        company: empresa || 'Parceiro',
        type: 'ENTRY',
        timestamp: entryDate
      });
    }

    if (dataSaida) {
      const exitDate = new Date(dataSaida);
      if (!isNaN(exitDate.getTime())) {
        records.push({
          id: id || `sai-${crypto.randomUUID()}`,
          partnerId: '',
          partnerName: nome.trim(),
          company: empresa || 'Parceiro',
          type: 'EXIT',
          timestamp: exitDate
        });
      }
    }

    return records;
  }).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
}

/* ======================================================
   PARCEIROS
====================================================== */
export function parsePartners(csv: string[][], company: string): Partner[] {
  return csv.slice(1)
    .map((r, i) => r[0] ? ({
      id: `p-${company}-${i}`,
      name: r[0],
      document: '',
      company,
      status: r[1] || 'Ativo'
    }) : null)
    .filter(Boolean) as Partner[];
}

/* ======================================================
   PRESENÇA / STAY REPORT
====================================================== */
export function calculateStayReports(records: AttendanceRecord[]): StayReport[] {
  const sorted = [...records].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  const open: Record<string, AttendanceRecord> = {};
  const result: StayReport[] = [];

  sorted.forEach(r => {
    const key = normalize(r.partnerName);
    if (r.type === 'ENTRY') open[key] = r;
    if (r.type === 'EXIT' && open[key]) {
      const e = open[key];
      result.push({
        recordId: e.id,
        partnerName: e.partnerName,
        company: e.company,
        entryTime: e.timestamp,
        exitTime: r.timestamp,
        durationMinutes: Math.round((r.timestamp.getTime() - e.timestamp.getTime()) / 60000)
      });
      delete open[key];
    }
  });

  Object.values(open).forEach(e =>
    result.push({
      recordId: e.id,
      partnerName: e.partnerName,
      company: e.company,
      entryTime: e.timestamp
    })
  );

  return result.sort((a, b) => b.entryTime.getTime() - a.entryTime.getTime());
}

/* ======================================================
   🔎 VALIDAÇÃO DE ESTADO
====================================================== */
export function isPartnerInside(
  records: AttendanceRecord[],
  partnerName: string
): boolean {
  const normalized = normalize(partnerName);
  
  // Encontra o registro MAIS RECENTE deste parceiro
  const lastRecord = records
    .filter(r => normalize(r.partnerName) === normalized)
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0];

  return lastRecord?.type === 'ENTRY';
}

/* ======================================================
   RELATÓRIOS (stubs)
====================================================== */
export function calculateDailySummaries(records: AttendanceRecord[]): DailySummary[] {
  return [];
}

export function generateCompanyReports(
  records: AttendanceRecord[],
  type: 'DAILY' | 'MONTHLY'
): CompanyReport[] {
  return [];
}

/* ======================================================
   ENVIO
====================================================== */
export async function appendRecord(
  partner: { name: string; company: string },
  type: 'ENTRY' | 'EXIT'
): Promise<boolean> {
  if (!SCRIPT_URL) return false;
  try {
    const response = await fetch(SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      body: JSON.stringify({
        name: partner.name,
        company: partner.company,
        type,
        tab: DATA_TAB_NAME
      })
    });
    return true;
  } catch (error) {
    console.error("Erro ao enviar registro:", error);
    return false;
  }
}
