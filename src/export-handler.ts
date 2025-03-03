export class ExportHandler {
  static toJSON(logs: any[]) {
    return JSON.stringify(logs, null, 2);
  }

  static toCSV(logs: any[]) {
    if (logs.length === 0) return '';
    
    const headers = Object.keys(logs[0]).join(',');
    const rows = logs.map(log => 
      Object.values(log)
        .map(v => typeof v === 'object' ? JSON.stringify(v) : v)
        .join(',')
    );
    return [headers, ...rows].join('\n');
  }
}