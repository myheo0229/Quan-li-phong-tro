// LocalStorage-based data store for the boarding house management system

export const ROOMS = ['1A', '2A', '3A', '4A', '5A', '6A', '1B', '2B', '3B', '4B', '5B', '6B'];

export interface Settings {
  room_price: number;
  electric_price: number;
  water_price: number;
  hao_tai: number;
  trash_fee: number;
  wifi_fee: number;
  meter_limit: number;
}

export interface SettingsVersion {
  month: string;
  settings: Settings;
  updated_at: string;
}

export interface Bill {
  room_id: string;
  month: string;
  electric_old: number;
  electric_new: number;
  water_old: number;
  water_new: number;
  electric_usage: number;
  water_usage: number;
  room_price: number;
  electric_price: number;
  water_price: number;
  hao_tai: number;
  trash_fee: number;
  wifi_fee: number;
  total_amount: number;
  payment_status: 'unpaid' | 'partial' | 'paid';
  debt_amount: number;
  is_locked: boolean;
  created_at: string;
  updated_at: string;
}

export interface Tenant {
  room_id: string;
  name: string;
  phone: string;
  start_date: string;
  deposit: number;
}

export interface ActivityLog {
  action_type: string;
  timestamp: string;
  description: string;
}

const DEFAULT_SETTINGS: Settings = {
  room_price: 1500000,
  electric_price: 3500,
  water_price: 15000,
  hao_tai: 0,
  trash_fee: 50000,
  wifi_fee: 100000,
  meter_limit: 9999,
};

function getItem<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  } catch { return fallback; }
}
function setItem(key: string, val: unknown) {
  localStorage.setItem(key, JSON.stringify(val));
}

// Auth
export function isLoggedIn(): boolean { return getItem('auth', false); }
export function login(user: string, pass: string): boolean {
  if (user === 'admin' && pass === 'admin123') { setItem('auth', true); return true; }
  return false;
}
export function logout() { setItem('auth', false); }

// Settings
export function getSettings(): Settings { return getItem('settings', DEFAULT_SETTINGS); }
export function saveSettings(s: Settings) {
  setItem('settings', s);
  addLog('settings', 'Updated global settings');
}
export function getSettingsForMonth(month: string): Settings {
  const versions: SettingsVersion[] = getItem('settings_versions', []);
  const v = versions.find(x => x.month === month);
  return v ? v.settings : getSettings();
}
export function snapshotSettings(month: string) {
  const versions: SettingsVersion[] = getItem('settings_versions', []);
  const existing = versions.findIndex(x => x.month === month);
  const entry: SettingsVersion = { month, settings: getSettings(), updated_at: new Date().toISOString() };
  if (existing >= 0) versions[existing] = entry; else versions.push(entry);
  setItem('settings_versions', versions);
}

// Bills
export function getBills(): Bill[] { return getItem('bills', []); }
export function getBillsForMonth(month: string): Bill[] { return getBills().filter(b => b.month === month); }
export function getBill(room_id: string, month: string): Bill | undefined {
  return getBills().find(b => b.room_id === room_id && b.month === month);
}
export function saveBill(bill: Bill) {
  const bills = getBills();
  const idx = bills.findIndex(b => b.room_id === bill.room_id && b.month === bill.month);
  bill.updated_at = new Date().toISOString();
  if (idx >= 0) { if (bills[idx].is_locked) return; bills[idx] = bill; }
  else { bill.created_at = new Date().toISOString(); bills.push(bill); }
  setItem('bills', bills);
}
export function lockBill(room_id: string, month: string) {
  const bills = getBills();
  const b = bills.find(x => x.room_id === room_id && x.month === month);
  if (b) { b.is_locked = true; b.updated_at = new Date().toISOString(); setItem('bills', bills); }
}
export function unlockBill(room_id: string, month: string) {
  const bills = getBills();
  const b = bills.find(x => x.room_id === room_id && x.month === month);
  if (b) { b.is_locked = false; b.updated_at = new Date().toISOString(); setItem('bills', bills); }
}

// Calculate usage
export function calcUsage(oldVal: number, newVal: number, meterLimit: number): number {
  if (newVal >= oldVal) return newVal - oldVal;
  return (meterLimit + newVal) - oldVal;
}
export function calcTotal(bill: Partial<Bill>): number {
  return (bill.room_price || 0)
    + (bill.electric_usage || 0) * (bill.electric_price || 0)
    + (bill.water_usage || 0) * (bill.water_price || 0)
    + (bill.hao_tai || 0)
    + (bill.trash_fee || 0)
    + (bill.wifi_fee || 0);
}

// Previous month
export function getPrevMonth(month: string): string {
  const [y, m] = month.split('-').map(Number);
  const d = new Date(y, m - 2, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

// Tenants
export function getTenants(): Tenant[] { return getItem('tenants', []); }
export function getTenant(room_id: string): Tenant | undefined { return getTenants().find(t => t.room_id === room_id); }
export function saveTenant(t: Tenant) {
  const tenants = getTenants();
  const idx = tenants.findIndex(x => x.room_id === t.room_id);
  if (idx >= 0) tenants[idx] = t; else tenants.push(t);
  setItem('tenants', tenants);
  addLog('tenant', `Updated tenant for room ${t.room_id}`);
}

// Logs
export function getLogs(): ActivityLog[] { return getItem('logs', []); }
export function addLog(action_type: string, description: string) {
  const logs = getLogs();
  logs.unshift({ action_type, timestamp: new Date().toISOString(), description });
  if (logs.length > 500) logs.length = 500;
  setItem('logs', logs);
}

// Format currency VND
export function formatVND(n: number): string {
  return new Intl.NumberFormat('vi-VN').format(n) + 'đ';
}

// Current month string
export function getCurrentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}
