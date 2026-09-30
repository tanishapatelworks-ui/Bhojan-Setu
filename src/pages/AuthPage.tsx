import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  HeartHandshake,
  Mail,
  Lock,
  User as UserIcon,
  Eye,
  EyeOff,
  UtensilsCrossed,
  Bike,
  Building2,
  Shield,
  Loader2,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { ROLES } from '@/lib/constants';
import type { UserRole } from '@/types';

export function AuthPage() {
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<UserRole>('donor');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (mode === 'register') {
      if (!fullName.trim()) {
        setError('Please enter your name');
        setLoading(false);
        return;
      }
      const { error } = await signUp(email, password, fullName.trim(), role);
      if (error) {
        setError(error);
        setLoading(false);
      } else {
        navigate('/dashboard');
      }
    } else {
      const { error } = await signIn(email, password);
      if (error) {
        setError(error);
        setLoading(false);
      } else {
        navigate('/dashboard');
      }
    }
  };

  const ROLE_ICONS: Record<UserRole, typeof UtensilsCrossed> = {
    donor: UtensilsCrossed,
    volunteer: Bike,
    ngo: Building2,
    admin: Shield,
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-brand-50 via-white to-amber-50">
      {/* Decorative background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 -top-24 h-96 w-96 rounded-full bg-brand-200/30 blur-3xl" />
        <div className="absolute -right-24 top-1/3 h-96 w-96 rounded-full bg-amber-200/30 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-emerald-200/20 blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-6xl items-center justify-center px-4 py-8">
        <div className="grid w-full overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-gray-200/50 md:grid-cols-2">
          {/* Left panel — branding */}
          <div className="relative hidden flex-col justify-between bg-gradient-to-br from-brand-600 via-brand-700 to-emerald-800 p-10 text-white md:flex">
            <div>
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
                  <HeartHandshake className="h-6 w-6" />
                </div>
                <span className="text-xl font-bold">
                  Food<span className="text-brand-200">Rescue</span>
                </span>
              </div>
              <h2 className="mt-12 text-3xl font-bold leading-tight">
                Rescue food.<br />
                Nourish communities.<br />
                Reduce waste.
              </h2>
              <p className="mt-4 text-sm text-brand-100">
                Join thousands of donors, volunteers, and NGOs working together
                to end food waste and feed those who need it most.
              </p>
            </div>

            <div className="space-y-3">
              {[
                { icon: UtensilsCrossed, text: 'Post surplus food in seconds' },
                { icon: Bike, text: 'Volunteers pick up & deliver' },
                { icon: Building2, text: 'NGOs receive food for communities' },
              ].map((item, i) => {
                const Icon = item.icon;
                return (
                  <div key={i} className="flex items-center gap-3 text-sm text-brand-100">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10">
                      <Icon className="h-4 w-4" />
                    </div>
                    {item.text}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right panel — form */}
          <div className="p-8 sm:p-10">
            <Link to="/" className="mb-8 flex items-center gap-2 md:hidden">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600">
                <HeartHandshake className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-bold text-gray-900">
                Food<span className="text-brand-600">Rescue</span>
              </span>
            </Link>

            <h1 className="text-2xl font-bold text-gray-900">
              {mode === 'login' ? 'Welcome back' : 'Create your account'}
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              {mode === 'login'
                ? 'Sign in to continue rescuing food'
                : 'Join the food rescue movement today'}
            </p>

            {/* Mode toggle */}
            <div className="mt-6 flex rounded-xl bg-gray-100 p-1">
              <button
                onClick={() => { setMode('login'); setError(''); }}
                className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all ${
                  mode === 'login' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => { setMode('register'); setError(''); }}
                className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all ${
                  mode === 'register' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
                }`}
              >
                Sign Up
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              {mode === 'register' && (
                <div>
                  <label className="label-field">Full Name</label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Jane Doe"
                      className="input-field pl-10"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="label-field">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="input-field pl-10"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="label-field">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="input-field px-10"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {mode === 'register' && (
                <div>
                  <label className="label-field">I am a...</label>
                  <div className="grid grid-cols-2 gap-2">
                    {ROLES.filter((r) => r.value !== 'admin').map((r) => {
                      const Icon = ROLE_ICONS[r.value];
                      return (
                        <button
                          key={r.value}
                          type="button"
                          onClick={() => setRole(r.value)}
                          className={`flex items-center gap-2 rounded-xl border-2 px-3 py-2.5 text-sm font-medium transition-all ${
                            role === r.value
                              ? 'border-brand-500 bg-brand-50 text-brand-700'
                              : 'border-gray-200 text-gray-600 hover:border-gray-300'
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                          {r.label}
                        </button>
                      );
                    })}
                  </div>
                  <p className="mt-2 text-xs text-gray-400">
                    {ROLES.find((r) => r.value === role)?.description}
                  </p>
                </div>
              )}

              {error && (
                <div className="rounded-xl bg-coral-50 px-4 py-3 text-sm text-coral-700 ring-1 ring-coral-200">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Please wait...
                  </>
                ) : mode === 'login' ? (
                  'Sign In'
                ) : (
                  'Create Account'
                )}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-gray-500">
              {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
              <button
                onClick={() => {
                  setMode(mode === 'login' ? 'register' : 'login');
                  setError('');
                }}
                className="font-semibold text-brand-600 hover:text-brand-700"
              >
                {mode === 'login' ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
