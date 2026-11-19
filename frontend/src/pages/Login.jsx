import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { Activity, Mail, Lock, AlertCircle, ArrowRight } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setIsLoading(true);
    const result = await login(email, password);
    if (result.success) {
      const user = result.user;
      navigate(user.role === 'doctor' ? '/doctor/dashboard' : '/patient/dashboard');
    } else {
      setError(result.message);
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="w-full">

        {/* Header */}
        <div className="mb-6 text-center sm:mb-8">
          <div className="mx-auto mb-4 grid size-12 place-items-center rounded-2xl bg-[#17604e]">
            <Activity className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[#102f28]">Welcome back</h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">Sign in to your ColonAI account</p>
        </div>

        {/* Card */}
        <div className="card panel-padding">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl flex items-center gap-2.5 text-sm mb-5">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />{error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="login-email" className="form-label">Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input id="login-email" type="email" required value={email} onChange={e => setEmail(e.target.value)}
                  className="input-field pl-10" placeholder="you@example.com" />
              </div>
            </div>

            <div>
              <label htmlFor="login-password" className="form-label">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input id="login-password" type="password" required value={password} onChange={e => setPassword(e.target.value)}
                  className="input-field pl-10" placeholder="••••••••" />
              </div>
            </div>

            <button type="submit" disabled={isLoading}
              className="w-full btn-primary py-3 flex items-center justify-center gap-2 mt-1 disabled:opacity-60">
              {isLoading ? 'Signing in…' : <><span>Sign in</span><ArrowRight className="h-4 w-4" /></>}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-slate-500 mt-5">
          No account?{' '}
          <Link to="/register" className="font-semibold text-[#17604e] hover:underline">Create one free</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
