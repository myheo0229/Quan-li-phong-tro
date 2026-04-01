import { useState, useEffect, useCallback } from 'react';
import {
  ROOMS, getBill, saveBill, getSettingsForMonth, calcUsage, calcTotal,
  getPrevMonth, getCurrentMonth, formatVND, snapshotSettings, addLog,
  lockBill, unlockBill, type Bill, type Settings,
} from '../lib/store';
import { Lock, Unlock, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

export function BillingPage() {
  const [month, setMonth] = useState(getCurrentMonth());
  const [bills, setBills] = useState<Record<string, Partial<Bill>>>({});
  const [settings, setSettings] = useState<Settings | null>(null);
  const [rolloverConfirm, setRolloverConfirm] = useState<{ room: string; field: 'electric' | 'water' } | null>(null);

  const loadData = useCallback(() => {
    const s = getSettingsForMonth(month);
    setSettings(s);
    const prevMonth = getPrevMonth(month);
    const map: Record<string, Partial<Bill>> = {};
    for (const room of ROOMS) {
      const existing = getBill(room, month);
      const prev = getBill(room, prevMonth);
      if (existing) {
        map[room] = existing;
      } else {
        map[room] = {
          room_id: room,
          month,
          electric_old: prev?.electric_new ?? 0,
          electric_new: prev?.electric_new ?? 0,
          water_old: prev?.water_new ?? 0,
          water_new: prev?.water_new ?? 0,
          electric_usage: 0,
          water_usage: 0,
          room_price: s.room_price,
          electric_price: s.electric_price,
          water_price: s.water_price,
          hao_tai: s.hao_tai,
          trash_fee: s.trash_fee,
          wifi_fee: s.wifi_fee,
          total_amount: 0,
          payment_status: 'unpaid',
          debt_amount: 0,
          is_locked: false,
        };
      }
    }
    setBills(map);
  }, [month]);

  useEffect(() => { loadData(); }, [loadData]);

  const updateField = (room: string, field: string, value: number) => {
    if (!settings) return;
    const bill = { ...bills[room], [field]: value };
    const isLocked = (bill as Bill).is_locked;
    if (isLocked) { toast.error('Hóa đơn đã khóa'); return; }

    // Check rollover
    if (field === 'electric_new' && value < (bill.electric_old ?? 0)) {
      setRolloverConfirm({ room, field: 'electric' });
      setBills(prev => ({ ...prev, [room]: { ...prev[room], electric_new: value } }));
      return;
    }
    if (field === 'water_new' && value < (bill.water_old ?? 0)) {
      setRolloverConfirm({ room, field: 'water' });
      setBills(prev => ({ ...prev, [room]: { ...prev[room], water_new: value } }));
      return;
    }

    applyCalc(room, bill);
  };

  const applyCalc = (room: string, bill: Partial<Bill>) => {
    if (!settings) return;
    bill.electric_usage = calcUsage(bill.electric_old ?? 0, bill.electric_new ?? 0, settings.meter_limit);
    bill.water_usage = calcUsage(bill.water_old ?? 0, bill.water_new ?? 0, settings.meter_limit);
    bill.total_amount = calcTotal(bill);
    setBills(prev => ({ ...prev, [room]: bill }));
  };

  const confirmRollover = () => {
    if (!rolloverConfirm) return;
    const { room } = rolloverConfirm;
    applyCalc(room, { ...bills[room] });
    setRolloverConfirm(null);
  };

  const cancelRollover = () => {
    if (!rolloverConfirm) return;
    const { room, field } = rolloverConfirm;
    const bill = { ...bills[room] };
    if (field === 'electric') bill.electric_new = bill.electric_old;
    else bill.water_new = bill.water_old;
    applyCalc(room, bill);
    setRolloverConfirm(null);
  };

  const saveAll = () => {
    snapshotSettings(month);
    let count = 0;
    for (const room of ROOMS) {
      const b = bills[room];
      if (b && !b.is_locked) {
        saveBill(b as Bill);
        count++;
      }
    }
    addLog('billing', `Saved ${count} bills for ${month}`);
    toast.success(`Đã lưu ${count} hóa đơn tháng ${month}`);
    loadData();
  };

  const toggleLock = (room: string) => {
    const b = bills[room];
    if (!b) return;
    if (b.is_locked) { unlockBill(room, month); toast.info(`Đã mở khóa phòng ${room}`); }
    else { lockBill(room, month); toast.info(`Đã khóa phòng ${room}`); }
    loadData();
  };

  const changeMonth = (dir: number) => {
    const [y, m] = month.split('-').map(Number);
    const d = new Date(y, m - 1 + dir, 1);
    setMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  };

  const isAbnormal = (room: string) => {
    const b = bills[room];
    if (!b) return false;
    return (b.electric_usage ?? 0) > 300 || (b.water_usage ?? 0) > 20;
  };

  return (
    <div className="space-y-4">
      {/* Month navigation */}
      <div className="flex items-center justify-between bg-white rounded-xl p-4 shadow-sm">
        <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-slate-100 rounded-lg cursor-pointer"><ChevronLeft size={20} /></button>
        <div className="text-center">
          <input type="month" value={month} onChange={e => setMonth(e.target.value)} className="text-lg border-0 text-center focus:outline-none cursor-pointer" />
        </div>
        <button onClick={() => changeMonth(1)} className="p-2 hover:bg-slate-100 rounded-lg cursor-pointer"><ChevronRight size={20} /></button>
      </div>

      {/* Bills table - desktop */}
      <div className="hidden md:block bg-white rounded-xl shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-slate-600">
              <th className="px-3 py-3 text-left">Phòng</th>
              <th className="px-3 py-3 text-right">Điện cũ</th>
              <th className="px-3 py-3 text-right">Điện mới</th>
              <th className="px-3 py-3 text-right">Nước cũ</th>
              <th className="px-3 py-3 text-right">Nước mới</th>
              <th className="px-3 py-3 text-right">Điện SD</th>
              <th className="px-3 py-3 text-right">Nước SD</th>
              <th className="px-3 py-3 text-right">Tổng</th>
              <th className="px-3 py-3 text-center">Khóa</th>
            </tr>
          </thead>
          <tbody>
            {ROOMS.map(room => {
              const b = bills[room];
              const locked = b?.is_locked;
              return (
                <tr key={room} className={`border-t ${isAbnormal(room) ? 'bg-amber-50' : ''} ${locked ? 'opacity-60' : ''}`}>
                  <td className="px-3 py-2 flex items-center gap-1">
                    <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs">{room}</span>
                    {isAbnormal(room) && <AlertTriangle size={14} className="text-amber-500" />}
                  </td>
                  <td className="px-3 py-2"><input type="number" className="w-20 text-right border rounded px-2 py-1 text-sm focus:outline-blue-400 disabled:bg-slate-100" value={b?.electric_old ?? 0} disabled={!!locked} onChange={e => updateField(room, 'electric_old', +e.target.value)} /></td>
                  <td className="px-3 py-2"><input type="number" className="w-20 text-right border rounded px-2 py-1 text-sm focus:outline-blue-400 disabled:bg-slate-100" value={b?.electric_new ?? 0} disabled={!!locked} onChange={e => updateField(room, 'electric_new', +e.target.value)} /></td>
                  <td className="px-3 py-2"><input type="number" className="w-20 text-right border rounded px-2 py-1 text-sm focus:outline-blue-400 disabled:bg-slate-100" value={b?.water_old ?? 0} disabled={!!locked} onChange={e => updateField(room, 'water_old', +e.target.value)} /></td>
                  <td className="px-3 py-2"><input type="number" className="w-20 text-right border rounded px-2 py-1 text-sm focus:outline-blue-400 disabled:bg-slate-100" value={b?.water_new ?? 0} disabled={!!locked} onChange={e => updateField(room, 'water_new', +e.target.value)} /></td>
                  <td className="px-3 py-2 text-right">{b?.electric_usage ?? 0}</td>
                  <td className="px-3 py-2 text-right">{b?.water_usage ?? 0}</td>
                  <td className="px-3 py-2 text-right">{formatVND(b?.total_amount ?? 0)}</td>
                  <td className="px-3 py-2 text-center">
                    <button onClick={() => toggleLock(room)} className="p-1 hover:bg-slate-100 rounded cursor-pointer">
                      {locked ? <Lock size={14} className="text-red-500" /> : <Unlock size={14} className="text-slate-400" />}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Bills cards - mobile */}
      <div className="md:hidden space-y-3">
        {ROOMS.map(room => {
          const b = bills[room];
          const locked = b?.is_locked;
          return (
            <div key={room} className={`bg-white rounded-xl p-4 shadow-sm space-y-3 ${isAbnormal(room) ? 'ring-2 ring-amber-300' : ''} ${locked ? 'opacity-60' : ''}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="bg-blue-600 text-white px-3 py-1 rounded-lg text-sm">{room}</span>
                  {isAbnormal(room) && <AlertTriangle size={16} className="text-amber-500" />}
                </div>
                <button onClick={() => toggleLock(room)} className="p-1 cursor-pointer">
                  {locked ? <Lock size={16} className="text-red-500" /> : <Unlock size={16} className="text-slate-400" />}
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-slate-500">Điện cũ</label>
                  <input type="number" className="w-full border rounded px-2 py-1.5 text-sm focus:outline-blue-400 disabled:bg-slate-100" value={b?.electric_old ?? 0} disabled={!!locked} onChange={e => updateField(room, 'electric_old', +e.target.value)} />
                </div>
                <div>
                  <label className="text-xs text-slate-500">Điện mới</label>
                  <input type="number" className="w-full border rounded px-2 py-1.5 text-sm focus:outline-blue-400 disabled:bg-slate-100" value={b?.electric_new ?? 0} disabled={!!locked} onChange={e => updateField(room, 'electric_new', +e.target.value)} />
                </div>
                <div>
                  <label className="text-xs text-slate-500">Nước cũ</label>
                  <input type="number" className="w-full border rounded px-2 py-1.5 text-sm focus:outline-blue-400 disabled:bg-slate-100" value={b?.water_old ?? 0} disabled={!!locked} onChange={e => updateField(room, 'water_old', +e.target.value)} />
                </div>
                <div>
                  <label className="text-xs text-slate-500">Nước mới</label>
                  <input type="number" className="w-full border rounded px-2 py-1.5 text-sm focus:outline-blue-400 disabled:bg-slate-100" value={b?.water_new ?? 0} disabled={!!locked} onChange={e => updateField(room, 'water_new', +e.target.value)} />
                </div>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Điện: <span className="text-slate-800">{b?.electric_usage ?? 0} kWh</span></span>
                <span className="text-slate-500">Nước: <span className="text-slate-800">{b?.water_usage ?? 0} m³</span></span>
              </div>
              <div className="text-right text-lg text-blue-700">{formatVND(b?.total_amount ?? 0)}</div>
            </div>
          );
        })}
      </div>

      {/* Save button */}
      <div className="flex justify-end">
        <button onClick={saveAll} className="bg-blue-600 text-white px-6 py-2.5 rounded-xl text-sm hover:bg-blue-700 transition cursor-pointer">
          Lưu tất cả
        </button>
      </div>

      {/* Rollover confirmation dialog */}
      {rolloverConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4">
            <div className="flex items-center gap-2 text-amber-600">
              <AlertTriangle size={24} />
              <h3 className="text-lg">Xác nhận vòng đồng hồ</h3>
            </div>
            <p className="text-sm text-slate-600">
              Chỉ số mới nhỏ hơn chỉ số cũ ở phòng <strong>{rolloverConfirm.room}</strong> ({rolloverConfirm.field === 'electric' ? 'điện' : 'nước'}).
              Áp dụng tính vòng đồng hồ?
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={cancelRollover} className="px-4 py-2 text-sm border rounded-lg hover:bg-slate-50 cursor-pointer">Hủy</button>
              <button onClick={confirmRollover} className="px-4 py-2 text-sm bg-amber-500 text-white rounded-lg hover:bg-amber-600 cursor-pointer">Xác nhận</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
