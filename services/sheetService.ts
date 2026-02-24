
import { Partner, AttendanceRecord, StayReport, DailySummary, CompanyReport } from '../types';
import { SHEET_ID, SCRIPT_URL, DATA_TAB_NAME } from '../constants';

const normalize = (str: string) => 
  str?.toString().trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") || '';

const generateUID = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let rand = '';
  for(let i=0; i<5; i++) rand += chars.charAt(Math.floor(Math.random() * chars.length));
  return `ID-${rand}`;
};

const SYSTEM_KEYWORDS = ['dados', 'reg', 'log', 'pagina', 'sheet', 'planilha', 'resumo', 'config', 'base'];

export async function fetchCompanies(): Promise<string[]> {
  if (!SCRIPT_URL) return [];
  try {
    const response = await fetch(`${SCRIPT_URL}?t=${Date.now()}&cb=${Math.random()}`);
    if (response.ok) {
      const data = await response.json();
      if (data.status === 'success' && data.companies) {
        return (data.companies as string[]).filter(name => {
          const normName = normalize(name);
          const isSystem = SYSTEM_KEYWORDS.some(keyword => normName.includes(keyword));
          return !isSystem && name.trim().length > 0;
        });
      }
    }
  } catch (e) {
    console.error("Erro ao buscar abas:", e);
  }
  return [];
}

export async function fetchSheetCSV(sheetName: string): Promise<string[][]> {
  try {
    const timestamp = Date.now();
    const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName.trim())}&t=${timestamp}`;
    
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) throw new Error(`Status: ${response.status}`);
    const text = await response.text();
    return parseCSV(text);
  } catch (error) {
    console.error(`Erro ao carregar aba ${sheetName}:`, error);
    return [];
  }
}

export async function appendRecord(partner: { name: string, company: string }, type: 'ENTRY' | 'EXIT'): Promise<boolean> {
  if (!SCRIPT_URL) return false;
  try {
    const payload = {
      id: generateUID(),
      name: partner.name.trim(),
      company: partner.company.trim(),
      type: type,
      tab: DATA_TAB_NAME 
    };

    await fetch(SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(payload)
    });
    return true; 
  } catch (error) {
    return false;
  }
}

export async function clearAllRecords(): Promise<boolean> {
  if (!SCRIPT_URL) return false;
  try {
    await fetch(SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      body: JSON.stringify({ action: 'CLEAR', tab: DATA_TAB_NAME })
    });
    return true;
  } catch (error) {
    return false;
  }
}

function parseCSV(text: string): string[][] {
  if (!text || text.trim().length === 0) return [];
  const lines = text.split(/\r?\n/);
  return lines.map(line => {
    const cells: string[] = [];
    let currentCell = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"' && line[i + 1] === '"') {
        currentCell += '"'; i++;
      } else if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        cells.push(currentCell.trim());
        currentCell = '';
      } else {
        currentCell += char;
      }
    }
    cells.push(currentCell.trim());
    return cells;
  }).filter(row => row.length >= 2 && row[0] !== ""); 
}

function parseDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  const clean = dateStr.replace(/"/g, '').trim();
  if (!clean || /id|entrada|saida|nome|empresa|status/i.test(clean)) return null;
  const d = new Date(clean);
  if (!isNaN(d.getTime())) return d;
  
  if (clean.includes('/')) {
    const parts = clean.split(' ');
    const dateParts = parts[0].split('/');
    if (dateParts.length === 3) {
      const day = parseInt(dateParts[0], 10);
      const month = parseInt(dateParts[1], 10) - 1;
      const year = parseInt(dateParts[2].length === 2 ? '20' + dateParts[2] : dateParts[2], 10);
      const timeParts = (parts[1] || '00:00:00').split(':');
      return new Date(year, month, day, parseInt(timeParts[0])||0, parseInt(timeParts[1])||0, parseInt(timeParts[2])||0);
    }
  }
  return null;
}

export function parseAttendanceRecords(csvRows: string[][]): AttendanceRecord[] {
  if (csvRows.length === 0) return [];
  const startIndex = (csvRows[0][0] && csvRows[0][0].toLowerCase().includes('id')) ? 1 : 0;
  
  return csvRows.slice(startIndex).reduce((acc: AttendanceRecord[], row) => {
    if (row.length < 4 || !row[2] || row[2].trim() === '') return acc;
    
    const statusVal = (row[3] || '').toUpperCase();
    let type: 'ENTRY' | 'EXIT' | null = null;
    if (statusVal.includes('ENTRY')) type = 'ENTRY';
    else if (statusVal.includes('EXIT')) type = 'EXIT';
    if (!type) return acc;
    
    const timestamp = type === 'ENTRY' ? parseDate(row[1]) : (parseDate(row[4]) || parseDate(row[1]));
    if (!timestamp) return acc;

    acc.push({
      id: row[0] || `gen-${timestamp.getTime()}`,
      partnerId: '',
      partnerName: row[2].trim(),
      company: row[5] || 'Parceiro',
      type: type,
      timestamp: timestamp
    });
    return acc;
  }, []);
}

export function parsePartners(csvRows: string[][], companyName: string): Partner[] {
  if (csvRows.length < 1) return [];
  const startIndex = (csvRows[0][0] && /colaborador|nome/i.test(csvRows[0][0])) ? 1 : 0;
  return csvRows.slice(startIndex).map((row, index): Partner | null => {
    const name = (row[0] || '').replace(/"/g, '').trim();
    if (!name || name.length < 2) return null;
    return { id: `p-${companyName}-${index}`, name, document: '', company: companyName, status: (row[1] || 'Ativo').replace(/"/g, '').trim() };
  }).filter((p): p is Partner => p !== null);
}

export function calculateStayReports(records: AttendanceRecord[]): StayReport[] {
  const sorted = [...records].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  const reports: StayReport[] = [];
  const openSessions: Record<string, AttendanceRecord> = {};
  
  sorted.forEach(record => {
    const key = normalize(record.partnerName);
    if (record.type === 'ENTRY') {
      openSessions[key] = record;
    } else if (record.type === 'EXIT') {
      const entry = openSessions[key];
      if (entry) {
        const diffMs = record.timestamp.getTime() - entry.timestamp.getTime();
        reports.push({
          recordId: entry.id,
          partnerName: entry.partnerName,
          company: entry.company,
          entryTime: entry.timestamp,
          exitTime: record.timestamp,
          durationMinutes: Math.round(diffMs / 60000)
        });
        delete openSessions[key];
      }
    }
  });
  
  Object.values(openSessions).forEach(entry => {
    reports.push({ recordId: entry.id, partnerName: entry.partnerName, company: entry.company, entryTime: entry.timestamp });
  });
  
  return reports.sort((a, b) => b.entryTime.getTime() - a.entryTime.getTime());
}

/**
 * Nova lógica avançada para consolidar o dia e calcular descanso
 */
export function calculateDailySummaries(records: AttendanceRecord[]): DailySummary[] {
  const sorted = [...records].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  const grouped: Record<string, Record<string, AttendanceRecord[]>> = {};

  // Agrupar por Data e por Colaborador
  sorted.forEach(r => {
    const dateKey = r.timestamp.toLocaleDateString('pt-BR');
    const partnerKey = `${normalize(r.partnerName)}|${r.company}`;
    if (!grouped[dateKey]) grouped[dateKey] = {};
    if (!grouped[dateKey][partnerKey]) grouped[dateKey][partnerKey] = [];
    grouped[dateKey][partnerKey].push(r);
  });

  const summaries: DailySummary[] = [];

  Object.entries(grouped).forEach(([date, partnersData]) => {
    Object.entries(partnersData).forEach(([partnerKey, partnerRecords]) => {
      const [name, company] = partnerKey.split('|');
      let totalWorkMinutes = 0;
      let totalRestMinutes = 0;
      const sessions: { entry: Date; exit?: Date; duration: number }[] = [];
      
      let currentEntry: AttendanceRecord | null = null;
      let lastExit: Date | null = null;

      partnerRecords.forEach(r => {
        if (r.type === 'ENTRY') {
          // Se houve uma saída anterior hoje, o tempo entre a última saída e esta entrada é DESCANSO
          if (lastExit) {
            const rest = Math.round((r.timestamp.getTime() - lastExit.getTime()) / 60000);
            if (rest > 0) totalRestMinutes += rest;
          }
          currentEntry = r;
        } else if (r.type === 'EXIT' && currentEntry) {
          const duration = Math.round((r.timestamp.getTime() - currentEntry.timestamp.getTime()) / 60000);
          if (duration >= 0) {
            totalWorkMinutes += duration;
            sessions.push({ entry: currentEntry.timestamp, exit: r.timestamp, duration });
          }
          lastExit = r.timestamp;
          currentEntry = null;
        }
      });

      // Caso ainda esteja lá (sessão aberta)
      if (currentEntry) {
        sessions.push({ entry: currentEntry.timestamp, duration: 0 });
      }

      summaries.push({
        date,
        partnerName: partnerRecords[0].partnerName, // nome original formatado
        company: partnerRecords[0].company,
        totalWorkMinutes,
        totalRestMinutes,
        sessions,
        isCurrentlyInside: !!currentEntry
      });
    });
  });

  return summaries.sort((a, b) => {
    const dateA = new Date(a.date.split('/').reverse().join('-')).getTime();
    const dateB = new Date(b.date.split('/').reverse().join('-')).getTime();
    return dateB - dateA;
  });
}

export function generateCompanyReports(records: AttendanceRecord[], type: 'DAILY' | 'MONTHLY'): CompanyReport[] {
  const summaries = calculateDailySummaries(records);
  const reports: Record<string, CompanyReport> = {};

  summaries.forEach(s => {
    const period = type === 'DAILY' ? s.date : s.date.substring(3); // "DD/MM/YYYY" -> "MM/YYYY"
    const key = `${s.company}|${period}`;

    if (!reports[key]) {
      reports[key] = {
        company: s.company,
        period: period,
        partners: []
      };
    }

    let partner = reports[key].partners.find(p => normalize(p.name) === normalize(s.partnerName));
    if (!partner) {
      partner = {
        name: s.partnerName,
        days: [],
        totalPeriodWork: 0
      };
      reports[key].partners.push(partner);
    }

    partner.days.push({
      date: s.date,
      sessions: s.sessions,
      totalWork: s.totalWorkMinutes
    });
    partner.totalPeriodWork += s.totalWorkMinutes;
  });

  return Object.values(reports).map(report => ({
    ...report,
    partners: report.partners.sort((a, b) => a.name.localeCompare(b.name))
  })).sort((a, b) => b.period.localeCompare(a.period));
}
