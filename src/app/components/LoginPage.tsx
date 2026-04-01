import { useState } from 'react';
import { login } from '../lib/store';
import { Lock } from 'lucide-react';

export function LoginPage({ onLogin }: { onLogin: () => void }) {
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (login(user, pass)) onLogin();
    else setError('Sai tài khoản hoặc mật khẩu');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm space-y-5">
        <div className="flex flex-col items-center gap-2">
          <div className="w-14 h-14 rounded-full bg-blue-600 flex items-center justify-center">
            <Lock className="text-white" size={28} />
          </div>
          <h1 className="text-xl">Quản lý phòng trọ</h1>
          <p className="text-sm text-slate-500">Đăng nhập để tiếp tục</p>
        </div>
        {error && <p className="text-red-500 text-sm text-center">{error}</p>}
        <input className="w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-blue-500" placeholder="Tài khoản" value={user} onChange={e => setUser(e.target.value)} />
        <input className="w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-blue-500" type="password" placeholder="Mật khẩu" value={pass} onChange={e => setPass(e.target.value)} />
        <button type="submit" className="w-full bg-blue-600 text-white rounded-lg py-2.5 text-sm hover:bg-blue-700 transition cursor-pointer">Đăng nhập</button>
        <p className="text-xs text-slate-400 text-center">Demo: admin / admin123</p>
      </form>
    </div>
  );
}
