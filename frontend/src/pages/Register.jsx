import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { Mail, Lock, User, UserPlus, Stethoscope, AlertCircle, ArrowRight } from 'lucide-react';

const Register = () => {
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'patient' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { register, login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setIsLoading(true);
    const res = await register(formData.name, formData.email, formData.password, formData.role);
    if (res.success) {
      const session = await login(formData.email, formData.password);
      if (!session.success) {
        navigate("/login");
        return;
      }
      navigate(formData.role === 'doctor' ? '/doctor/dashboard' : '/patient/dashboard');
    } else { setError(res.message); setIsLoading(false); }
  };

  return (
    <div className="auth-shell">
      <div className="w-full">

        <div className="mb-6 text-center sm:mb-8">
          <div className="mx-auto mb-4 grid size-12 place-items-center rounded-2xl bg-[#17604e]">
            <UserPlus className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[#102f28]">Create Account</h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">Create an account for the ColonAI research workspace.</p>
        </div>

        <div className="card panel-padding">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl flex items-center gap-2.5 text-sm mb-5">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />{error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="register-name" className="form-label">Full Name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input id="register-name" type="text" name="name" required value={formData.name} onChange={handleChange}
                  className="input-field pl-10" placeholder="John Doe" />
              </div>
            </div>

            <div>
              <label htmlFor="register-email" className="form-label">Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input id="register-email" type="email" name="email" required value={formData.email} onChange={handleChange}
                  className="input-field pl-10" placeholder="you@example.com" />
              </div>
            </div>

            <div>
              <label htmlFor="register-password" className="form-label">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input id="register-password" type="password" name="password" required minLength={8} maxLength={128} value={formData.password} onChange={handleChange}
                  className="input-field pl-10" placeholder="••••••••" />
              </div>
            </div>

            {/* Role toggle */}
            <div>
              <p className="form-label" id="register-role">Account type</p>
              <div role="group" aria-labelledby="register-role" className="grid grid-cols-2 gap-3">
                {[{ val: 'patient', label: 'Patient', Icon: User }, { val: 'doctor', label: 'Reviewer', Icon: Stethoscope }].map(({ val, label, Icon }) => (
                  <button key={val} type="button" aria-pressed={formData.role === val} onClick={() => setFormData({ ...formData, role: val })}
                    className={`py-3 rounded-xl border-2 flex items-center justify-center gap-2 font-semibold text-sm transition-all ${
                      formData.role === val
                        ? 'bg-[#edf5f1] border-[#589784] text-[#17604e]'
                        : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700'
                    }`}>
                    <Icon className="h-4 w-4" />{label}
                  </button>
                ))}
              </div>
            </div>

            <button type="submit" disabled={isLoading}
              className="w-full btn-primary py-3 flex items-center justify-center gap-2 mt-1 disabled:opacity-60">
              {isLoading ? 'Creating account…' : <><span>Create Account</span><ArrowRight className="h-4 w-4" /></>}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-slate-500 mt-5">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-[#17604e] hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
