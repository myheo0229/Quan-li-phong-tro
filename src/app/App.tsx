import { useState, useEffect } from "react";
import { isLoggedIn, logout } from "./lib/store";
import { LoginPage } from "./components/LoginPage";
import { BillingPage } from "./components/BillingPage";
import { PaymentPage } from "./components/PaymentPage";
import { SettingsPage } from "./components/SettingsPage";
import { TenantsPage } from "./components/TenantsPage";
import { StatsPage } from "./components/StatsPage";
import { ExportPage } from "./components/ExportPage";
import { LogsPage } from "./components/LogsPage";
import { Toaster } from "sonner";
import {
  Zap,
  CreditCard,
  Users,
  BarChart3,
  Download,
  Settings,
  ScrollText,
  LogOut,
  Menu,
  X,
  Home,
} from "lucide-react";

type Page =
  | "billing"
  | "payment"
  | "tenants"
  | "stats"
  | "export"
  | "settings"
  | "logs";

const navItems: {
  key: Page;
  label: string;
  icon: typeof Zap;
}[] = [
  { key: "billing", label: "Nhập liệu", icon: Zap },
  { key: "payment", label: "Thanh toán", icon: CreditCard },
  { key: "tenants", label: "Người thuê", icon: Users },
  { key: "stats", label: "Thống kê", icon: BarChart3 },
  { key: "export", label: "Xuất / Hóa đơn", icon: Download },
  { key: "settings", label: "Cài đặt", icon: Settings },
  { key: "logs", label: "Nhật ký", icon: ScrollText },
];

export default function App() {
  const [auth, setAuth] = useState(isLoggedIn());
  const [page, setPage] = useState<Page>("billing");
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setAuth(isLoggedIn());
  }, []);

  if (!auth)
    return (
      <>
        <LoginPage onLogin={() => setAuth(true)} />
        <Toaster position="top-center" richColors />
      </>
    );

  const handleNav = (p: Page) => {
    setPage(p);
    setMenuOpen(false);
  };
  const handleLogout = () => {
    logout();
    setAuth(false);
  };

  const PageComponent = {
    billing: BillingPage,
    payment: PaymentPage,
    tenants: TenantsPage,
    stats: StatsPage,
    export: ExportPage,
    settings: SettingsPage,
    logs: LogsPage,
  }[page];

  return (
    <div className="min-h-screen bg-slate-100">
      <Toaster position="top-center" richColors />

      {/* Top bar */}
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden p-1.5 hover:bg-slate-100 rounded-lg cursor-pointer"
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <Home size={20} className="text-blue-600" />
            <span className="text-sm hidden sm:inline">
              Quản lý phòng trọ
            </span>
          </div>
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.key}
                  onClick={() => handleNav(item.key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm cursor-pointer transition ${page === item.key ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-50"}`}
                >
                  <Icon size={16} />
                  {item.label}
                </button>
              );
            })}
          </nav>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1 text-sm text-slate-500 hover:text-red-500 cursor-pointer"
          >
            <LogOut size={16} />
            <span className="hidden sm:inline">Đăng xuất</span>
          </button>
        </div>
      </header>

      {/* Mobile nav overlay */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-30 md:hidden"
          onClick={() => setMenuOpen(false)}
        >
          <div
            className="absolute top-14 left-0 right-0 bg-white border-b shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.key}
                  onClick={() => handleNav(item.key)}
                  className={`flex items-center gap-3 w-full px-5 py-3 text-sm cursor-pointer ${page === item.key ? "bg-blue-50 text-blue-700" : "text-slate-600"}`}
                >
                  <Icon size={18} />
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Content */}
      <main className="max-w-6xl mx-auto p-4">
        <PageComponent />
      </main>
    </div>
  );
}