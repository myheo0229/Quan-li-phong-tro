import { useState, useEffect } from 'react';
import { ROOMS, getBillsForMonth, getCurrentMonth, formatVND, saveBill, addLog, type Bill } from '../lib/store';
import { toast } from 'sonner';
import { CheckCircle, Clock, AlertCircle } from 'lucide-react';

const statusConfig = {
  paid: { label: 'Đã thanh toán', icon: CheckCircle, color: 'text-green-600 bg-green-50' },
  partial: { label: 'Thanh toán một phần', icon: Clock, color: 'text-amber-600 bg-amber-50' },
  unpaid: { label: 'Chưa thanh toán', icon: AlertCircle, color: 'text-red-600 bg-red-50' },
};

export function PaymentPage() {
  const [month, setMonth] = useState(getCurrentMonth());
  const [bills, setBills] = useState<Bill[]>([]);
  const [editDebt, setEditDebt] = useState<{ room: string; amount: number } | null>(null);

  const load = () => setBills(getBillsForMonth(month));
  useEffect(load, [month]);

  const updateStatus = (bill: Bill, status: Bill['payment_status']) => {
    bill.payment_status = status;
    if (status === 'paid') bill.debt_amount = 0;
    saveBill(bill);
    addLog('payment', `Room ${bill.room_id}: ${status}`);
    toast.success(`Phòng ${bill.room_id}: ${statusConfig[status].label}`);
    load();
  };

  const saveDebt = () => {
    if (!editDebt) return;
    const bill = bills.find(b => b.room_id === editDebt.room);
    if (!bill) return;
    bill.debt_amount = editDebt.amount;
    bill.payment_status = 'partial';
    saveBill(bill);
    addLog('payment', `Room ${bill.room_id}: debt ${editDebt.amount}`);
    toast.success('Đã cập nhật');
    setEditDebt(null);
    load();
  };

  const totalRevenue = bills.reduce((s, b) => s + b.total_amount, 0);
  const totalPaid = bills.filter(b => b.payment_status === 'paid').reduce((s, b) => s + b.total_amount, 0);
  const totalDebt = bills.reduce((s, b) => s + b.debt_amount, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between bg-white rounded-xl p-4 shadow-sm">
        <h2 className="text-lg">Thanh toán</h2>
        <input type="month" value={month} onChange={e => setMonth(e.target.value)} className="border rounded-lg px-3 py-1.5 text-sm focus:outline-blue-400" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <p className="text-xs text-slate-500">Tổng doanh thu</p>
          <p className="text-xl text-blue-700 mt-1">{formatVND(totalRevenue)}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <p className="text-xs text-slate-500">Đã thu</p>
          <p className="text-xl text-green-700 mt-1">{formatVND(totalPaid)}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <p className="text-xs text-slate-500">Nợ</p>
          <p className="text-xl text-red-700 mt-1">{formatVND(totalDebt)}</p>
        </div>
      </div>

      <div className="space-y-2">
        {bills.length === 0 && <p className="text-sm text-slate-500 bg-white rounded-xl p-6 text-center shadow-sm">Chưa có hóa đơn tháng này. Vui lòng nhập liệu trước.</p>}
        {ROOMS.map(room => {
          const bill = bills.find(b => b.room_id === room);
          if (!bill) return null;
          const cfg = statusConfig[bill.payment_status];
          const Icon = cfg.icon;
          return (
            <div key={room} className="bg-white rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="bg-blue-600 text-white px-3 py-1 rounded-lg text-sm">{room}</span>
                  <span className="text-lg">{formatVND(bill.total_amount)}</span>
                </div>
                <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs ${cfg.color}`}>
                  <Icon size={14} />
                  {cfg.label}
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                {bill.payment_status !== 'paid' && (
                  <button onClick={() => updateStatus(bill, 'paid')} className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 cursor-pointer">Đã thanh toán</button>
                )}
                {bill.payment_status !== 'unpaid' && (
                  <button onClick={() => updateStatus(bill, 'unpaid')} className="text-xs border px-3 py-1.5 rounded-lg hover:bg-slate-50 cursor-pointer">Chưa TT</button>
                )}
                <button onClick={() => setEditDebt({ room, amount: bill.debt_amount })} className="text-xs border px-3 py-1.5 rounded-lg hover:bg-slate-50 cursor-pointer">Ghi nợ</button>
              </div>
              {bill.debt_amount > 0 && <p className="text-xs text-red-500 mt-2">Nợ: {formatVND(bill.debt_amount)}</p>}
            </div>
          );
        })}
      </div>

      {editDebt && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4">
            <h3>Ghi nợ phòng {editDebt.room}</h3>
            <input type="number" className="w-full border rounded-lg px-3 py-2 text-sm" value={editDebt.amount} onChange={e => setEditDebt({ ...editDebt, amount: +e.target.value })} />
            <div className="flex gap-3 justify-end">
              <button onClick={() => setEditDebt(null)} className="px-4 py-2 text-sm border rounded-lg cursor-pointer">Hủy</button>
              <button onClick={saveDebt} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg cursor-pointer">Lưu</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
