import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { Cloud, Loader, LogIn } from 'lucide-react';
import { auth, describeServiceError, emulatorMode } from './firebase';

export default function Login({ initialError = '' }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function submit(event) {
    event.preventDefault();
    if (submitting) return;
    setError('');
    setSubmitting(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (failure) {
      setError(describeServiceError(failure));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 flex items-center justify-center p-5">
      <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
        <div className="w-12 h-12 rounded-xl bg-slate-900 text-yellow-400 flex items-center justify-center mb-5"><Cloud aria-hidden="true" /></div>
        <h1 className="text-2xl font-bold tracking-wide text-slate-900">MING JII</h1>
        <p className="text-slate-600 mt-2">登录云端进销存系统</p>
        <p className="text-sm text-slate-500 mt-2 mb-6">使用同一个账号，即可在不同电脑查看相同订单。</p>
        {emulatorMode && <p className="text-sm text-amber-800 bg-amber-50 rounded-lg p-3 mb-5">当前是本机测试环境。</p>}
        <form onSubmit={submit} className="space-y-5">
          <div>
            <label htmlFor="login-email" className="block text-sm font-medium mb-2">邮箱</label>
            <input id="login-email" type="email" autoComplete="username" required value={email} onChange={event => setEmail(event.target.value)} disabled={submitting} className="w-full border border-slate-300 rounded-lg px-3 py-2.5" />
          </div>
          <div>
            <label htmlFor="login-password" className="block text-sm font-medium mb-2">密码</label>
            <input id="login-password" type="password" autoComplete="current-password" required value={password} onChange={event => setPassword(event.target.value)} disabled={submitting} className="w-full border border-slate-300 rounded-lg px-3 py-2.5" />
          </div>
          {(error || initialError) && <p role="alert" className="text-sm text-red-700 bg-red-50 rounded-lg p-3">{error || initialError}</p>}
          <button type="submit" disabled={submitting} className="w-full bg-slate-900 text-white rounded-lg py-3 font-medium inline-flex items-center justify-center gap-2 disabled:opacity-60">{submitting ? <Loader size={18} className="animate-spin" /> : <LogIn size={18} />} {submitting ? '正在登录…' : '登录'}</button>
        </form>
        <p className="text-xs text-slate-500 mt-6">账号由管理员提供。忘记密码或需要账号时，请联系管理员。</p>
      </div>
    </main>
  );
}
