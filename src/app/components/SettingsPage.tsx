import { useState, useEffect } from 'react';
import { getSettings, saveSettings, formatVND, type Settings } from '../lib/store';
import { toast } from 'sonner';

const fields: { key: keyof Settings; label: string; unit: string }[] = [
  { key: 'room_price', label: 'Giá phòng', unit: 'đ/tháng' },
  { key: 'electric_price', label: 'Giá điện', unit: 'đ/kWh' },
  { key: 'water_price', label: 'Giá nước', unit: 'đ/m³' },
  { key: 'hao_tai', label: 'Hao tài', unit: 'đ' },
  { key: 'trash_fee', label: 'Phí rác', unit: 'đ' },
  { key: 'wifi_fee', label: 'Phí wifi', unit: 'đ' },
  { key: 'meter_limit', label: 'Giới hạn đồng hồ', unit: '' },
];

export function SettingsPage() {
  const [s, setS] = useState<Settings>(getSettings());
  useEffect(() => setS(getSettings()), []);

  const handleSave = () => {
    saveSettings(s);
    toast.success('Đã lưu cài đặt');
  };

  return (
    <div className="max-w-lg mx-auto space-y-4">
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <h2 className="text-lg mb-4">Cài đặt chung</h2>
        <div className="space-y-3">
          {fields.map(f => (
            <div key={f.key} className="flex items-center justify-between gap-4">
              <label className="text-sm text-slate-600 shrink-0">{f.label}</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  className="w-36 text-right border rounded-lg px-3 py-2 text-sm focus:outline-blue-400"
                  value={s[f.key]}
                  onChange={e => setS({ ...s, [f.key]: +e.target.value })}
                />
                {f.unit && <span className="text-xs text-slate-400 w-16">{f.unit}</span>}
              </div>
            </div>
          ))}
        </div>
        <button onClick={handleSave} className="mt-6 w-full bg-blue-600 text-white rounded-xl py-2.5 text-sm hover:bg-blue-700 cursor-pointer">Lưu cài đặt</button>
      </div>
      <div className="bg-white rounded-xl p-4 shadow-sm text-sm text-slate-500 space-y-1">
        <p>• Thay đổi cài đặt chỉ ảnh hưởng hóa đơn <strong>mới</strong>.</p>
        <p>• Hóa đơn đã lưu giữ nguyên snapshot cài đặt cũ.</p>
        <p>• Giới hạn đồng hồ dùng cho tính vòng (rollover).</p>
      </div>
    </div>
  );
}
