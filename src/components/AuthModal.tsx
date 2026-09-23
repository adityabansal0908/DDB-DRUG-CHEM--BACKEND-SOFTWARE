import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { DdbLogo } from './DdbLogo';
import {
  EnvelopeSimple,
  Lock,
  User,
  ShieldCheck,
  DeviceMobile,
  ArrowRight,
  Sparkle,
  CheckCircle,
  Eye,
  EyeSlash
} from '@phosphor-icons/react';

export const AuthModal: React.FC = () => {
  const { login, register, authUsers, currentUser } = useApp();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'admin' | 'sales_rep'>('admin');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If already logged in, do not render modal
  if (currentUser) {
    return null;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password.trim()) {
      setError('Please provide both email address and password');
      return;
    }

    if (mode === 'register') {
      if (!name.trim()) {
        setError('Please enter your full name');
        return;
      }
      if (password.length < 4) {
        setError('Password should be at least 4 characters long');
        return;
      }

      const success = register(email.trim(), password, name.trim(), role);
      if (!success) {
        setError('An account with this email already exists.');
      }
    } else {
      const success = login(email.trim(), password);
      if (!success) {
        setError('Invalid credentials. Check email and password or use one of the quick accounts below.');
      }
    }
  };

  const fillQuickAccount = (quickEmail: string, quickPass: string) => {
    setEmail(quickEmail);
    setPassword(quickPass);
    setError(null);
    setMode('login');
    // Instant login for immediate access
    login(quickEmail, quickPass);
  };

  return (
    <div
      id="auth-modal-overlay"
      data-testid="auth-modal-overlay"
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
    >
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Brand Banner */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-6 text-center relative">
          <div className="flex justify-center mb-2">
            <DdbLogo className="w-12 h-12 shadow-lg ring-2 ring-white/20" />
          </div>
          <h2 className="text-xl font-bold font-heading tracking-tight">DDB DRUG CHEM</h2>
          <p className="text-xs text-blue-200 mt-0.5">
            Pharmaceutical Formulary & Sales Field Intelligence
          </p>

          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-[11px] text-blue-100 border border-white/10 font-medium">
            <ShieldCheck size={14} className="text-emerald-400" weight="fill" />
            <span>Secure Role-Based Authentication &bull; 15-Min Inactivity Timeout</span>
          </div>
        </div>

        {/* Tab switch: Login vs Register */}
        <div className="flex border-b border-slate-200 bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError(null);
            }}
            className={`flex-1 py-3 text-center transition-colors border-b-2 ${
              mode === 'login'
                ? 'border-blue-600 text-blue-600 bg-white'
                : 'border-transparent hover:text-slate-800'
            }`}
          >
            Sign In with Email
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setError(null);
            }}
            className={`flex-1 py-3 text-center transition-colors border-b-2 ${
              mode === 'register'
                ? 'border-blue-600 text-blue-600 bg-white'
                : 'border-transparent hover:text-slate-800'
            }`}
          >
            Create New Account
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
              <span className="font-bold">Error:</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Full Name *
                  </label>
                  <div className="relative">
                    <User size={18} className="absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Dr. Rajesh Verma or Amit Sen"
                      className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    System Role *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setRole('admin')}
                      className={`p-2.5 rounded-lg border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                        role === 'admin'
                          ? 'border-blue-600 bg-blue-50 text-blue-800 ring-2 ring-blue-500/20'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <ShieldCheck size={16} weight="bold" />
                      <span>Admin Console</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole('sales_rep')}
                      className={`p-2.5 rounded-lg border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                        role === 'sales_rep'
                          ? 'border-blue-600 bg-blue-50 text-blue-800 ring-2 ring-blue-500/20'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <DeviceMobile size={16} weight="bold" />
                      <span>Sales Rep Field</span>
                    </button>
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Email Address *
              </label>
              <div className="relative">
                <EnvelopeSimple size={18} className="absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@ddbdrugchem.com"
                  className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Password *
              </label>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-2.5 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-10 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeSlash size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-xs flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <span>{mode === 'login' ? 'Sign In to Workspace' : 'Create & Access Account'}</span>
              <ArrowRight size={16} weight="bold" />
            </button>
          </form>

          {/* Quick Demo Login Credentials for convenience */}
          <div className="mt-5 pt-4 border-t border-slate-200">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1">
              <Sparkle size={13} className="text-amber-500" weight="fill" />
              <span>1-Click Instant Sign-In</span>
            </p>
            <div className="space-y-2">
              <button
                type="button"
                id="quick-login-admin"
                onClick={() => fillQuickAccount('admin@ddbdrugchem.com', 'admin123')}
                className="w-full p-2.5 rounded-lg bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 text-left flex items-center justify-between text-xs transition-all cursor-pointer group hover:shadow-xs"
              >
                <div>
                  <span className="font-semibold text-slate-800 group-hover:text-blue-700 block">
                    Regional Admin (Dr. Rajesh Verma)
                  </span>
                  <span className="text-[11px] text-slate-500">admin@ddbdrugchem.com</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                    Admin
                  </span>
                  <ArrowRight size={14} className="text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </button>

              <button
                type="button"
                id="quick-login-rep"
                onClick={() => fillQuickAccount('amitabh.sen@ddbdrugchem.com', 'rep123')}
                className="w-full p-2.5 rounded-lg bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 text-left flex items-center justify-between text-xs transition-all cursor-pointer group hover:shadow-xs"
              >
                <div>
                  <span className="font-semibold text-slate-800 group-hover:text-emerald-700 block">
                    Sales Rep (Amitabh Sen)
                  </span>
                  <span className="text-[11px] text-slate-500">amitabh.sen@ddbdrugchem.com</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Sales Rep
                  </span>
                  <ArrowRight size={14} className="text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
