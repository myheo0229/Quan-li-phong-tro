import { getLogs } from '../lib/store';
import { Clock } from 'lucide-react';

export function LogsPage() {
  const logs = getLogs();

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <h2 className="text-lg">Nhật ký hoạt động</h2>
      </div>
      {logs.length === 0 && <p className="text-sm text-slate-500 bg-white rounded-xl p-6 text-center shadow-sm">Chưa có hoạt động nào.</p>}
      <div className="bg-white rounded-xl shadow-sm divide-y max-h-[70vh] overflow-y-auto">
        {logs.map((log, i) => (
          <div key={i} className="px-4 py-3 flex items-start gap-3">
            <Clock size={14} className="text-slate-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm">{log.description}</p>
              <p className="text-xs text-slate-400">{new Date(log.timestamp).toLocaleString('vi-VN')} • {log.action_type}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
