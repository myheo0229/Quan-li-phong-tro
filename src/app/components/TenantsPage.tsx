import { useState, useEffect } from 'react';
import { ROOMS, getTenants, saveTenant, formatVND, type Tenant } from '../lib/store';
import { toast } from 'sonner';
import { User, Phone, Calendar, Banknote } from 'lucide-react';

export function TenantsPage() {
  const [tenants, setTenants] = useState<Record<string, Tenant>>({});
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<Tenant>({ room_id: '', name: '', phone: '', start_date: '', deposit: 0 });

  const load = () => {
    const map: Record<string, Tenant> = {};
    for (const t of getTenants()) map[t.room_id] = t;
    setTenants(map);
  };
  useEffect(load, []);

  const edit = (room: string) => {
    setEditing(room);
    setForm(tenants[room] || { room_id: room, name: '', phone: '', start_date: '', deposit: 0 });
  };

  const save = () => {
    if (!editing) return;
    saveTenant({ ...form, room_id: editing });
    toast.success(`Đã cập nhật phòng ${editing}`);
    setEditing(null);
    load();
  };

  return (
    <div className="space-y-3">
      <h2 className="text-lg bg-white rounded-xl p-4 shadow-sm">Thông tin người thuê</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {ROOMS.map(room => {
          const t = tenants[room];
          return (
            <div key={room} className="bg-white rounded-xl p-4 shadow-sm cursor-pointer hover:ring-2 hover:ring-blue-200 transition" onClick={() => edit(room)}>
              <div className="flex items-center justify-between mb-3">
                <span className="bg-blue-600 text-white px-3 py-1 rounded-lg text-sm">{room}</span>
                {t?.name ? <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">Có người</span> : <span className="text-xs text-slate-400">Trống</span>}
              </div>
              {t?.name ? (
                <div className="space-y-1 text-sm">
                  <p className="flex items-center gap-2"><User size={14} className="text-slate-400" />{t.name}</p>
                  <p className="flex items-center gap-2"><Phone size={14} className="text-slate-400" />{t.phone || '—'}</p>
                  <p className="flex items-center gap-2"><Calendar size={14} className="text-slate-400" />{t.start_date || '—'}</p>
                  <p className="flex items-center gap-2"><Banknote size={14} className="text-slate-400" />{t.deposit ? formatVND(t.deposit) : '—'}</p>
                </div>
              ) : <p className="text-sm text-slate-400">Nhấn để thêm</p>}
            </div>
          );
        })}
      </div>

      {editing && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4">
            <h3>Phòng {editing}</h3>
            <input placeholder="Họ tên" className="w-full border rounded-lg px-3 py-2 text-sm" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            <input placeholder="SĐT" className="w-full border rounded-lg px-3 py-2 text-sm" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
            <input type="date" className="w-full border rounded-lg px-3 py-2 text-sm" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} />
            <input type="number" placeholder="Tiền cọc" className="w-full border rounded-lg px-3 py-2 text-sm" value={form.deposit || ''} onChange={e => setForm({ ...form, deposit: +e.target.value })} />
            <div className="flex gap-3 justify-end">
              <button onClick={() => setEditing(null)} className="px-4 py-2 text-sm border rounded-lg cursor-pointer">Hủy</button>
              <button onClick={save} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg cursor-pointer">Lưu</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
