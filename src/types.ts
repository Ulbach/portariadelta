export interface Partner {
  id: string;
  name: string;
  document: string;
  company: string;
  role?: string;
  status?: 'Ativo' | 'Inativo' | string;
}

export interface AttendanceRecord {
  id: string;
  partnerId: string;
  partnerName: string;
  company: string;
  type: 'ENTRY' | 'EXIT';
  timestamp: Date;
}

export interface StayReport {
  recordId?: string;
  partnerName: string;
  company: string;
  entryTime: Date;
  exitTime?: Date;
  durationMinutes?: number;
}

export interface DailySummary {
  date: string;
  partnerName: string;
  company: string;
  totalWorkMinutes: number;
  totalRestMinutes: number;
  sessions: { entry: Date; exit?: Date; duration: number }[];
  isCurrentlyInside: boolean;
}

export interface CompanyReport {
  company: string;
  period: string; // "DD/MM/YYYY" or "MM/YYYY"
  partners: {
    name: string;
    days: {
      date: string;
      sessions: { entry: Date; exit?: Date; duration: number }[];
      totalWork: number;
    }[];
    totalPeriodWork: number;
  }[];
}

export enum ViewMode {
  WELCOME = 'WELCOME',
  DASHBOARD = 'DASHBOARD',
  PARTNERS = 'PARTNERS',
  REPORTS = 'REPORTS',
  REGISTRATION = 'REGISTRATION',
  RECORDS = 'RECORDS'
}
