import { Partner, AttendanceRecord, StayReport, DailySummary, CompanyReport } from '../types';

export const normalize = (str: string) => 
  str?.toString().trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") || '';

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

export function calculateDailySummaries(records: AttendanceRecord[]): DailySummary[] {
  const sorted = [...records].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  const grouped: Record<string, Record<string, AttendanceRecord[]>> = {};

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
      let totalWorkMinutes = 0;
      let totalRestMinutes = 0;
      const sessions: { entry: Date; exit?: Date; duration: number }[] = [];
      
      let currentEntry: AttendanceRecord | null = null;
      let lastExit: Date | null = null;

      partnerRecords.forEach(r => {
        if (r.type === 'ENTRY') {
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

      if (currentEntry) {
        sessions.push({ entry: currentEntry.timestamp, duration: 0 });
      }

      summaries.push({
        date,
        partnerName: partnerRecords[0].partnerName,
        company: partnerRecords[0].company,
        totalWorkMinutes,
        totalRestMinutes,
        sessions,
        isCurrentlyInside: !!currentEntry
      });
    });
  });

  return summaries.sort((a, b) => {
    const datePartsA = a.date.split('/');
    const dateA = new Date(parseInt(datePartsA[2]), parseInt(datePartsA[1])-1, parseInt(datePartsA[0])).getTime();
    const datePartsB = b.date.split('/');
    const dateB = new Date(parseInt(datePartsB[2]), parseInt(datePartsB[1])-1, parseInt(datePartsB[0])).getTime();
    return dateB - dateA;
  });
}

export function generateCompanyReports(records: AttendanceRecord[], type: 'DAILY' | 'MONTHLY', partnersList: Partner[] = []): CompanyReport[] {
  const summaries = calculateDailySummaries(records);
  const reports: Record<string, CompanyReport> = {};

  summaries.forEach(s => {
    const period = type === 'DAILY' ? s.date : s.date.substring(3);
    const key = `${s.company}|${period}`;

    if (!reports[key]) {
      reports[key] = {
        company: s.company,
        period: period,
        partners: []
      };
    }

    const partnerInfo = partnersList.find(p => normalize(p.name) === normalize(s.partnerName));
    const discountMinutes = (partnerInfo?.fixedDiscountHours || 0) * 60;
    
    let partner = reports[key].partners.find(p => normalize(p.name) === normalize(s.partnerName));
    if (!partner) {
      partner = {
        name: s.partnerName,
        fixedDiscountHours: partnerInfo?.fixedDiscountHours,
        days: [],
        totalPeriodWork: 0
      };
      reports[key].partners.push(partner);
    }
    
    // Apply discount to the daily total if work was done
    // Only subtract if they have work time and we aren't going below zero
    const dailyTotal = Math.max(0, s.totalWorkMinutes - discountMinutes);

    partner.days.push({
      date: s.date,
      sessions: s.sessions,
      totalWork: dailyTotal
    });
    partner.totalPeriodWork += dailyTotal;
  });

  return Object.values(reports).map(report => ({
    ...report,
    partners: report.partners.sort((a, b) => a.name.localeCompare(b.name))
  })).sort((a, b) => b.period.localeCompare(a.period));
}
