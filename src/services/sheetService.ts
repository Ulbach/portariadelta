export function parseAttendanceRecords(rows: string[][]): AttendanceRecord[] {
  if (!rows || rows.length <= 1) return [];

  // pula o cabeçalho
  return rows.slice(1).flatMap(row => {
    if (row.length < 6) return [];

    const id = row[0];
    const dataEntrada = row[1];
    const nome = row[2];
    const status = (row[3] || '').toUpperCase();
    const dataSaida = row[4];
    const empresa = row[5] || 'Parceiro';

    if (!nome || !dataEntrada) return [];

    const records: AttendanceRecord[] = [];

    // ENTRY sempre vem da DataEntrada
    records.push({
      id: id || `entry-${Date.now()}`,
      partnerId: '',
      partnerName: nome.trim(),
      company: empresa.trim(),
      type: 'ENTRY',
      timestamp: new Date(dataEntrada)
    });

    // EXIT só existe se houver DataSaida
    if (dataSaida) {
      records.push({
        id: id || `exit-${Date.now()}`,
        partnerId: '',
        partnerName: nome.trim(),
        company: empresa.trim(),
        type: 'EXIT',
        timestamp: new Date(dataSaida)
      });
    }

    return records;
  }).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
}
