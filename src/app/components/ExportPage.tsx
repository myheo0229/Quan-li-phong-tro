import { useState } from 'react';
import { getBillsForMonth, getCurrentMonth, getTenant, formatVND, ROOMS, type Bill } from '../lib/store';
import { toast } from 'sonner';
import { Download, FileSpreadsheet, FileText, Share2 } from 'lucide-react';
import * as XLSX from 'xlsx';

export function ExportPage() {
  const [month, setMonth] = useState(getCurrentMonth());
  const [invoiceRoom, setInvoiceRoom] = useState<string | null>(null);

  const bills = getBillsForMonth(month);

  const getRows = () => bills.map(b => ({
    'Phòng': b.room_id,
    'Điện cũ': b.electric_old,
    'Điện mới': b.electric_new,
    'Điện SD': b.electric_usage,
    'Nước cũ': b.water_old,
    'Nước mới': b.water_new,
    'Nước SD': b.water_usage,
    'Tiền phòng': b.room_price,
    'Tiền điện': b.electric_usage * b.electric_price,
    'Tiền nước': b.water_usage * b.water_price,
    'Hao tài': b.hao_tai,
    'Rác': b.trash_fee,
    'Wifi': b.wifi_fee,
    'Tổng': b.total_amount,
    'Thanh toán': b.payment_status === 'paid' ? 'Đã TT' : b.payment_status === 'partial' ? 'Một phần' : 'Chưa TT',
    'Nợ': b.debt_amount,
  }));

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(getRows());
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `Tháng ${month}`);
    XLSX.writeFile(wb, `bao-cao-${month}.xlsx`);
    toast.success('Đã xuất Excel');
  };

  const exportCSV = () => {
    const ws = XLSX.utils.json_to_sheet(getRows());
    const csv = XLSX.utils.sheet_to_csv(ws);
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `bao-cao-${month}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success('Đã xuất CSV');
  };

  const invoiceBill = invoiceRoom ? bills.find(b => b.room_id === invoiceRoom) : null;
  const invoiceTenant = invoiceRoom ? getTenant(invoiceRoom) : undefined;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between bg-white rounded-xl p-4 shadow-sm flex-wrap gap-3">
        <h2 className="text-lg">Xuất báo cáo</h2>
        <input type="month" value={month} onChange={e => setMonth(e.target.value)} className="border rounded-lg px-3 py-1.5 text-sm" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button onClick={exportExcel} className="bg-white rounded-xl p-6 shadow-sm flex items-center gap-4 hover:ring-2 hover:ring-green-300 transition cursor-pointer">
          <FileSpreadsheet size={32} className="text-green-600" />
          <div className="text-left">
            <p className="text-sm">Xuất Excel (.xlsx)</p>
            <p className="text-xs text-slate-500">{bills.length} phòng</p>
          </div>
        </button>
        <button onClick={exportCSV} className="bg-white rounded-xl p-6 shadow-sm flex items-center gap-4 hover:ring-2 hover:ring-blue-300 transition cursor-pointer">
          <FileText size={32} className="text-blue-600" />
          <div className="text-left">
            <p className="text-sm">Xuất CSV</p>
            <p className="text-xs text-slate-500">{bills.length} phòng</p>
          </div>
        </button>
      </div>

      {/* Invoice generator */}
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <h3 className="text-sm text-slate-600 mb-3 flex items-center gap-2"><Share2 size={16} />Tạo hóa đơn chia sẻ</h3>
        <div className="flex flex-wrap gap-2">
          {ROOMS.map(r => (
            <button key={r} onClick={() => setInvoiceRoom(r)} className={`px-3 py-1.5 rounded-lg text-sm border cursor-pointer ${invoiceRoom === r ? 'bg-blue-600 text-white border-blue-600' : 'hover:bg-slate-50'}`}>{r}</button>
          ))}
        </div>
      </div>

      {invoiceBill && (
        <div id="invoice" className="bg-white rounded-xl p-6 shadow-sm max-w-md mx-auto space-y-3">
          <div className="text-center border-b pb-3">
            <h3 className="text-lg">HÓA ĐƠN PHÒNG TRỌ</h3>
            <p className="text-sm text-slate-500">Tháng {month}</p>
          </div>
          <div className="text-sm space-y-1">
            <p>Phòng: <strong>{invoiceBill.room_id}</strong></p>
            {invoiceTenant?.name && <p>Người thuê: {invoiceTenant.name}</p>}
          </div>
          <table className="w-full text-sm">
            <tbody>
              <tr className="border-b"><td className="py-1 text-slate-500">Tiền phòng</td><td className="py-1 text-right">{formatVND(invoiceBill.room_price)}</td></tr>
              <tr className="border-b"><td className="py-1 text-slate-500">Điện ({invoiceBill.electric_old}→{invoiceBill.electric_new} = {invoiceBill.electric_usage} kWh)</td><td className="py-1 text-right">{formatVND(invoiceBill.electric_usage * invoiceBill.electric_price)}</td></tr>
              <tr className="border-b"><td className="py-1 text-slate-500">Nước ({invoiceBill.water_old}→{invoiceBill.water_new} = {invoiceBill.water_usage} m³)</td><td className="py-1 text-right">{formatVND(invoiceBill.water_usage * invoiceBill.water_price)}</td></tr>
              {invoiceBill.hao_tai > 0 && <tr className="border-b"><td className="py-1 text-slate-500">Hao tài</td><td className="py-1 text-right">{formatVND(invoiceBill.hao_tai)}</td></tr>}
              <tr className="border-b"><td className="py-1 text-slate-500">Rác</td><td className="py-1 text-right">{formatVND(invoiceBill.trash_fee)}</td></tr>
              <tr className="border-b"><td className="py-1 text-slate-500">Wifi</td><td className="py-1 text-right">{formatVND(invoiceBill.wifi_fee)}</td></tr>
              {invoiceBill.debt_amount > 0 && <tr className="border-b"><td className="py-1 text-red-500">Nợ cũ</td><td className="py-1 text-right text-red-500">{formatVND(invoiceBill.debt_amount)}</td></tr>}
              <tr><td className="py-2 text-lg">TỔNG</td><td className="py-2 text-right text-lg text-blue-700">{formatVND(invoiceBill.total_amount + invoiceBill.debt_amount)}</td></tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
