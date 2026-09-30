import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useState } from 'react';
import {
  HeartHandshake,
  Menu,
  X,
  LayoutDashboard,
  Map,
  Search,
  Gift,
  Bike,
  BarChart3,
  LogOut,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { NotificationBell } from './NotificationBell';

const NAV_LINKS = [
  { to: '/find-food', label: 'Find Food', icon: Search },
  { to: '/donate-food', label: 'Donate Food', icon: Gift },
  { to: '/rescue-map', label: 'Rescue Map', icon: Map },
  { to: '/volunteer', label: 'Volunteer', icon: Bike },
  { to: '/impact', label: 'Impact', icon: BarChart3 },
];

export function Navbar() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200/80 bg-white/80 backdrop-blur-lg">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 shadow-lg shadow-brand-600/20">
            <HeartHandshake className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-bold text-gray-900">
            Food<span className="text-brand-600">Rescue</span>
          </span>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive(link.to)
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <Icon className="h-4 w-4" />
                {link.label}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <NotificationBell />
              <Link
                to="/dashboard"
                className="hidden items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 md:flex"
              >
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </Link>
              <div className="hidden items-center gap-2 lg:flex">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700">
                  {profile?.full_name?.[0]?.toUpperCase() || 'U'}
                </div>
                <span className="text-sm font-medium text-gray-700">
                  {profile?.full_name || 'User'}
                </span>
              </div>
              <button
                onClick={handleSignOut}
                className="rounded-xl p-2.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900"
                aria-label="Sign out"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </>
          ) : (
            <Link to="/auth" className="btn-primary text-xs sm:text-sm">
              Sign In
            </Link>
          )}

          <button
            onClick={() => setMobileOpen((o) => !o)}
            className="rounded-xl p-2.5 text-gray-600 transition-colors hover:bg-gray-100 md:hidden"
            aria-label="Menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      {mobileOpen && (
        <div className="border-t border-gray-100 bg-white md:hidden">
          <div className="space-y-1 px-4 py-3">
            {NAV_LINKS.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive(link.to)
                      ? 'bg-brand-50 text-brand-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {link.label}
                </Link>
              );
            })}
            {user && (
              <Link
                to="/dashboard"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100"
              >
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
