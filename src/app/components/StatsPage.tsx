import { useState, useMemo } from 'react';
import { getBills, formatVND } from '../lib/store';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';

export function StatsPage() {
  const [year, setYear] = useState(new Date().getFullYear());
  const bills = getBills();

  const monthlyData = useMemo(() => {
    const months: Record<string, { revenue: number; electric: number; water: number; paid: number; unpaid: number }> = {};
    for (let m = 1; m <= 12; m++) {
      const key = `${year}-${String(m).padStart(2, '0')}`;
      months[key] = { revenue: 0, electric: 0, water: 0, paid: 0, unpaid: 0 };
    }
    for (const b of bills) {
      if (!b.month.startsWith(String(year))) continue;
      const m = months[b.month];
      if (!m) continue;
      m.revenue += b.total_amount;
      m.electric += b.electric_usage;
      m.water += b.water_usage;
      if (b.payment_status === 'paid') m.paid += b.total_amount;
      else m.unpaid += b.total_amount;
    }
    return Object.entries(months).map(([month, d]) => ({ month: month.slice(5), ...d }));
  }, [bills, year]);

  const totalRevenue = monthlyData.reduce((s, d) => s + d.revenue, 0);
  const totalPaid = monthlyData.reduce((s, d) => s + d.paid, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between bg-white rounded-xl p-4 shadow-sm">
        <h2 className="text-lg">Thống kê</h2>
        <select value={year} onChange={e => setYear(+e.target.value)} className="border rounded-lg px-3 py-1.5 text-sm">
          {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <p className="text-xs text-slate-500">Tổng doanh thu năm {year}</p>
          <p className="text-2xl text-blue-700 mt-1">{formatVND(totalRevenue)}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <p className="text-xs text-slate-500">Đã thu</p>
          <p className="text-2xl text-green-700 mt-1">{formatVND(totalPaid)}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl p-4 shadow-sm">
        <h3 className="text-sm text-slate-600 mb-4">Doanh thu theo tháng</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `${(v / 1000000).toFixed(1)}M`} />
            <Tooltip formatter={(v: number) => formatVND(v)} />
            <Legend />
            <Bar dataKey="paid" name="Đã thu" fill="#22c55e" radius={[4, 4, 0, 0]} />
            <Bar dataKey="unpaid" name="Chưa thu" fill="#ef4444" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-xl p-4 shadow-sm">
        <h3 className="text-sm text-slate-600 mb-4">Tiêu thụ điện / nước</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="electric" name="Điện (kWh)" stroke="#f59e0b" strokeWidth={2} />
            <Line type="monotone" dataKey="water" name="Nước (m³)" stroke="#3b82f6" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
