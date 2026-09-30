import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Gift,
  Package,
  CheckCircle2,
  Bike,
  Bell,
  TrendingUp,
  Leaf,
  Users,
  Clock,
  MapPin,
  UtensilsCrossed,
  Truck,
  HeartHandshake,
  Trash2,
  Loader2,
  Building2,
  Shield,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import type { Donation, Notification, ImpactStats, UserRole, Profile } from '@/types';
import { StatusBadge } from '@/components/StatusBadge';
import { STATUS_META, formatRelativeTime, timeUntil, formatDateTime } from '@/lib/constants';

const ROLE_ICONS: Record<UserRole, typeof Gift> = {
  donor: Gift,
  volunteer: Bike,
  ngo: Building2,
  admin: Shield,
};

export function DashboardPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [volunteered, setVolunteered] = useState<Donation[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [impact, setImpact] = useState<ImpactStats | null>(null);
  const [allDonations, setAllDonations] = useState<Donation[]>([]);
  const [allProfiles, setAllProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'overview' | 'donations' | 'pickups' | 'notifications'>('overview');

  useEffect(() => {
    if (!user) {
      if (!authLoading) navigate('/auth');
      return;
    }
    const fetchData = async () => {
      setLoading(true);

      if (profile?.role === 'admin') {
        const [{ data: allD }, { data: allP }] = await Promise.all([
          supabase
            .from('donations')
            .select(`
              *,
              donor:profiles!donations_donor_id_fkey(id, full_name, role),
              claimer:profiles!donations_claimed_by_fkey(id, full_name, role)
            `)
            .order('created_at', { ascending: false }),
          supabase.from('profiles').select('*').order('created_at', { ascending: false }),
        ]);
        setAllDonations((allD as Donation[]) || []);
        setAllProfiles((allP as Profile[]) || []);
      } else {
        const [{ data: myD }, { data: myV }] = await Promise.all([
          supabase
            .from('donations')
            .select(`
              *,
              claimer:profiles!donations_claimed_by_fkey(id, full_name, role)
            `)
            .eq('donor_id', user.id)
            .order('created_at', { ascending: false }),
          supabase
            .from('donations')
            .select(`
              *,
              donor:profiles!donations_donor_id_fkey(id, full_name, role)
            `)
            .eq('claimed_by', user.id)
            .order('created_at', { ascending: false }),
        ]);
        setDonations((myD as Donation[]) || []);
        setVolunteered((myV as Donation[]) || []);
      }

      const [{ data: notifData }, { data: impactData }] = await Promise.all([
        supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(20),
        supabase
          .from('impact_stats')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle(),
      ]);
      setNotifications((notifData as Notification[]) || []);
      setImpact(impactData as ImpactStats | null);
      setLoading(false);
    };
    fetchData();

    const channel = supabase
      .channel('dashboard-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'donations' },
        () => fetchData()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        () => fetchData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, profile, authLoading, navigate]);

  const markNotificationRead = async (id: string) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
  };

  const deleteDonation = async (id: string) => {
    if (!confirm('Are you sure you want to delete this donation?')) return;
    await supabase.from('donations').delete().eq('id', id);
  };

  if (authLoading || loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
      </div>
    );
  }

  if (!user || !profile) return null;

  const RoleIcon = ROLE_ICONS[profile.role];
  const myDonations = profile.role === 'admin' ? allDonations : donations;
  const myPickups = profile.role === 'admin' ? allDonations.filter((d) => d.claimed_by) : volunteered;

  const stats = {
    total: myDonations.length,
    available: myDonations.filter((d) => d.status === 'available').length,
    claimed: myDonations.filter((d) => d.status === 'claimed').length,
    delivered: myDonations.filter((d) => d.status === 'delivered').length,
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const TABS = [
    { id: 'overview' as const, label: 'Overview', icon: LayoutDashboard },
    { id: 'donations' as const, label: profile.role === 'volunteer' ? 'My Pickups' : 'Donations', icon: Gift },
    ...(profile.role !== 'donor' ? [{ id: 'pickups' as const, label: 'Pickups', icon: Package }] : []),
    { id: 'notifications' as const, label: 'Notifications', icon: Bell, badge: unreadCount },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-100">
            <RoleIcon className="h-7 w-7 text-brand-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Welcome, {profile.full_name || 'User'}
            </h1>
            <p className="text-sm capitalize text-gray-500">
              {profile.role} Dashboard
            </p>
          </div>
        </div>
        {profile.role === 'donor' && (
          <Link to="/donate-food" className="btn-primary text-xs sm:text-sm">
            <Gift className="h-4 w-4" />
            New Donation
          </Link>
        )}
        {profile.role === 'volunteer' && (
          <Link to="/volunteer" className="btn-primary text-xs sm:text-sm">
            <Bike className="h-4 w-4" />
            Find Pickups
          </Link>
        )}
      </div>

      {/* Stats cards */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { icon: Gift, label: 'Total Donations', value: stats.total, color: 'bg-brand-100 text-brand-600' },
          { icon: Clock, label: 'Available', value: stats.available, color: 'bg-amber-100 text-amber-600' },
          { icon: Package, label: 'Claimed', value: stats.claimed, color: 'bg-blue-100 text-blue-600' },
          { icon: CheckCircle2, label: 'Delivered', value: stats.delivered, color: 'bg-emerald-100 text-emerald-600' },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="card p-5">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${stat.color}`}>
                <Icon className="h-5 w-5" />
              </div>
              <p className="mt-3 text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-xs text-gray-500">{stat.label}</p>
            </div>
          );
        })}
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 overflow-x-auto rounded-xl bg-gray-100 p-1">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg py-2.5 text-sm font-medium transition-all ${
                tab === t.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
              }`}
            >
              <Icon className="h-4 w-4" />
              {t.label}
              {t.badge ? (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-coral-500 px-1 text-[10px] font-bold text-white">
                  {t.badge}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {tab === 'overview' && (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Impact card */}
          <div className="card p-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-brand-600" />
              <h3 className="text-sm font-semibold text-gray-900">Your Impact</h3>
            </div>
            <div className="mt-4 space-y-4">
              {[
                { icon: UtensilsCrossed, label: 'Meals Rescued', value: impact?.meals_rescued ?? 0, color: 'text-brand-600' },
                { icon: Leaf, label: 'Food Saved (kg)', value: (impact?.kg_saved ?? 0).toFixed(1), color: 'text-emerald-600' },
                { icon: Users, label: 'People Served', value: impact?.people_served ?? 0, color: 'text-amber-600' },
                { icon: HeartHandshake, label: 'Rescues Completed', value: impact?.rescues_completed ?? 0, color: 'text-coral-600' },
              ].map((item, i) => {
                const Icon = item.icon;
                return (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className={`h-4 w-4 ${item.color}`} />
                      <span className="text-sm text-gray-600">{item.label}</span>
                    </div>
                    <span className="font-bold text-gray-900">{item.value}</span>
                  </div>
                );
              })}
            </div>
            <Link to="/impact" className="btn-secondary mt-4 w-full text-xs">
              View Full Impact
            </Link>
          </div>

          {/* Recent donations */}
          <div className="card p-6 lg:col-span-2">
            <h3 className="mb-4 text-sm font-semibold text-gray-900">Recent Activity</h3>
            {myDonations.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-sm text-gray-400">No activity yet</p>
                {profile.role === 'donor' && (
                  <Link to="/donate-food" className="btn-secondary mt-3 text-xs">
                    Create your first donation
                  </Link>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {myDonations.slice(0, 5).map((d) => (
                  <div key={d.id} className="flex items-center gap-3 rounded-xl bg-gray-50 p-3">
                    <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg">
                      {d.image_url ? (
                        <img src={d.image_url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-brand-100">
                          <UtensilsCrossed className="h-5 w-5 text-brand-400" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-900">{d.title}</p>
                      <p className="text-xs text-gray-500">
                        {formatRelativeTime(d.created_at)} · {d.quantity}
                      </p>
                    </div>
                    <StatusBadge status={d.status} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'donations' && (
        <div className="space-y-3">
          {myDonations.length === 0 ? (
            <div className="card p-12 text-center">
              <Gift className="mx-auto h-10 w-10 text-gray-300" />
              <p className="mt-3 text-sm text-gray-400">
                {profile.role === 'volunteer' ? 'No pickups yet' : 'No donations yet'}
              </p>
              {profile.role === 'donor' && (
                <Link to="/donate-food" className="btn-primary mt-4 text-xs">
                  Create Donation
                </Link>
              )}
            </div>
          ) : (
            myDonations.map((d) => (
              <div key={d.id} className="card p-4">
                <div className="flex items-start gap-4">
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl">
                    {d.image_url ? (
                      <img src={d.image_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-brand-100">
                        <UtensilsCrossed className="h-6 w-6 text-brand-400" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold text-gray-900">{d.title}</h3>
                        <p className="text-sm text-gray-500">{d.quantity} · {formatRelativeTime(d.created_at)}</p>
                      </div>
                      <StatusBadge status={d.status} />
                    </div>
                    {d.address && (
                      <p className="mt-1 flex items-center gap-1 text-xs text-gray-500">
                        <MapPin className="h-3 w-3" />
                        {d.address}
                      </p>
                    )}
                    {d.status === 'available' && (
                      <p className="mt-1 text-xs font-medium text-amber-600">
                        {timeUntil(d.pickup_deadline)}
                      </p>
                    )}
                    {d.claimer && (
                      <p className="mt-1 text-xs text-blue-600">
                        Claimed by {d.claimer.full_name || 'a volunteer'}
                      </p>
                    )}
                    {profile.role === 'donor' && d.status === 'available' && (
                      <button
                        onClick={() => deleteDonation(d.id)}
                        className="mt-2 flex items-center gap-1 text-xs text-coral-500 hover:text-coral-600"
                      >
                        <Trash2 className="h-3 w-3" />
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'pickups' && (
        <div className="space-y-3">
          {myPickups.length === 0 ? (
            <div className="card p-12 text-center">
              <Package className="mx-auto h-10 w-10 text-gray-300" />
              <p className="mt-3 text-sm text-gray-400">No pickups to track</p>
            </div>
          ) : (
            myPickups.map((d) => (
              <div key={d.id} className="card p-4">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg">
                    {d.image_url ? (
                      <img src={d.image_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-brand-100">
                        <Package className="h-6 w-6 text-brand-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{d.title}</h3>
                    <p className="text-xs text-gray-500">
                      {d.donor?.full_name ? `From ${d.donor.full_name}` : ''}
                      {d.picked_up_at && ` · Picked up ${formatDateTime(d.picked_up_at)}`}
                    </p>
                  </div>
                  <StatusBadge status={d.status} />
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'notifications' && (
        <div className="space-y-2">
          {notifications.length === 0 ? (
            <div className="card p-12 text-center">
              <Bell className="mx-auto h-10 w-10 text-gray-300" />
              <p className="mt-3 text-sm text-gray-400">No notifications yet</p>
            </div>
          ) : (
            notifications.map((n) => (
              <button
                key={n.id}
                onClick={() => !n.is_read && markNotificationRead(n.id)}
                className={`card flex w-full items-start gap-3 p-4 text-left transition-all ${
                  !n.is_read ? 'ring-brand-200 bg-brand-50/30' : ''
                }`}
              >
                <div className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${
                  n.is_read ? 'bg-transparent ring-1 ring-gray-300' : 'bg-brand-500'
                }`} />
                <div className="flex-1">
                  <p className="text-sm text-gray-700">{n.message}</p>
                  <p className="mt-1 text-xs text-gray-400">
                    {formatRelativeTime(n.created_at)}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      )}

      {/* Admin section */}
      {profile.role === 'admin' && tab === 'overview' && (
        <div className="mt-6 card p-6">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-900">
            <Shield className="h-4 w-4 text-brand-600" />
            Platform Overview
          </h3>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl bg-gray-50 p-4">
              <p className="text-2xl font-bold text-gray-900">{allProfiles.length}</p>
              <p className="text-xs text-gray-500">Total Users</p>
            </div>
            <div className="rounded-xl bg-gray-50 p-4">
              <p className="text-2xl font-bold text-gray-900">
                {allProfiles.filter((p) => p.role === 'donor').length}
              </p>
              <p className="text-xs text-gray-500">Donors</p>
            </div>
            <div className="rounded-xl bg-gray-50 p-4">
              <p className="text-2xl font-bold text-gray-900">
                {allProfiles.filter((p) => p.role === 'volunteer').length}
              </p>
              <p className="text-xs text-gray-500">Volunteers</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
