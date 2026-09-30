import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  UtensilsCrossed,
  Leaf,
  Users,
  HeartHandshake,
  TrendingUp,
  Award,
  Loader2,
  Gift,
  Bike,
  Building2,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import type { ImpactStats, Profile } from '@/types';

interface LeaderboardEntry {
  profile: Profile;
  stats: ImpactStats;
}

export function ImpactPage() {
  const { user, profile } = useAuth();
  const [myImpact, setMyImpact] = useState<ImpactStats | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [platformStats, setPlatformStats] = useState({
    totalMeals: 0,
    totalKg: 0,
    totalPeople: 0,
    totalRescues: 0,
    totalDonors: 0,
    totalVolunteers: 0,
    totalNgos: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      const [
        { data: impactData },
        { data: leaderboardData },
        { data: profilesData },
        { count: donorsCount },
        { count: volunteersCount },
        { count: ngosCount },
      ] = await Promise.all([
        user
          ? supabase.from('impact_stats').select('*').eq('user_id', user.id).maybeSingle()
          : Promise.resolve({ data: null }),
        supabase
          .from('impact_stats')
          .select(`
            *,
            profile:profiles!impact_stats_user_id_fkey(id, full_name, role, avatar_url)
          `)
          .order('meals_rescued', { ascending: false })
          .limit(10),
        supabase.from('profiles').select('*'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'donor'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'volunteer'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'ngo'),
      ]);

      setMyImpact(impactData as ImpactStats | null);

      const lb = (leaderboardData || [])
        .filter((e) => (e as Record<string, unknown>).profile)
        .map((e) => ({
          profile: (e as Record<string, unknown>).profile as Profile,
          stats: {
            id: (e as Record<string, string>).id,
            user_id: (e as Record<string, string>).user_id,
            meals_rescued: (e as Record<string, number>).meals_rescued,
            kg_saved: Number((e as Record<string, number>).kg_saved),
            people_served: (e as Record<string, number>).people_served,
            rescues_completed: (e as Record<string, number>).rescues_completed,
          },
        }));
      setLeaderboard(lb);

      const allProfiles = (profilesData as Profile[]) || [];
      const totals = allProfiles.reduce(
        (acc, _p) => acc,
        { totalMeals: 0, totalKg: 0, totalPeople: 0, totalRescues: 0 }
      );
      lb.forEach((e) => {
        totals.totalMeals += e.stats.meals_rescued;
        totals.totalKg += e.stats.kg_saved;
        totals.totalPeople += e.stats.people_served;
        totals.totalRescues += e.stats.rescues_completed;
      });
      setPlatformStats({
        ...totals,
        totalDonors: donorsCount ?? 0,
        totalVolunteers: volunteersCount ?? 0,
        totalNgos: ngosCount ?? 0,
      });
      setLoading(false);
    };
    fetchAll();
  }, [user]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
      </div>
    );
  }

  const heroStats = [
    { icon: UtensilsCrossed, label: 'Meals Rescued', value: platformStats.totalMeals, color: 'brand', suffix: '' },
    { icon: Leaf, label: 'Food Saved', value: platformStats.totalKg, color: 'emerald', suffix: 'kg' },
    { icon: Users, label: 'People Served', value: platformStats.totalPeople, color: 'amber', suffix: '' },
    { icon: HeartHandshake, label: 'Rescues Completed', value: platformStats.totalRescues, color: 'coral', suffix: '' },
  ];

  const COLOR_MAP: Record<string, { bg: string; text: string }> = {
    brand: { bg: 'bg-brand-100', text: 'text-brand-600' },
    emerald: { bg: 'bg-emerald-100', text: 'text-emerald-600' },
    amber: { bg: 'bg-amber-100', text: 'text-amber-600' },
    coral: { bg: 'bg-coral-100', text: 'text-coral-600' },
  };

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-600 via-brand-700 to-emerald-800 py-16">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/4 top-0 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute right-1/4 bottom-0 h-64 w-64 rounded-full bg-amber-300/10 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium text-white backdrop-blur-sm">
              <Sparkles className="h-4 w-4" />
              Our Collective Impact
            </div>
            <h1 className="mt-4 text-4xl font-bold text-white sm:text-5xl">
              Every meal rescued makes a difference
            </h1>
            <p className="mt-3 max-w-2xl mx-auto text-lg text-brand-100">
              Together, our community is reducing food waste and nourishing those who need it most.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {heroStats.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <div
                  key={i}
                  className="rounded-2xl bg-white/10 p-6 text-center backdrop-blur-sm ring-1 ring-white/20 animate-slide-up"
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <Icon className="mx-auto h-8 w-8 text-white" />
                  <p className="mt-3 text-3xl font-bold text-white sm:text-4xl">
                    {stat.value.toLocaleString()}{stat.suffix}
                  </p>
                  <p className="mt-1 text-sm text-brand-100">{stat.label}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Community breakdown */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 text-center">Our Community</h2>
          <p className="mt-2 text-gray-500 text-center">The people making food rescue possible</p>
          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            {[
              { icon: Gift, label: 'Donors', value: platformStats.totalDonors, desc: 'Posting surplus food', color: 'brand' },
              { icon: Bike, label: 'Volunteers', value: platformStats.totalVolunteers, desc: 'Picking up & delivering', color: 'amber' },
              { icon: Building2, label: 'NGOs', value: platformStats.totalNgos, desc: 'Receiving for communities', color: 'emerald' },
            ].map((item, i) => {
              const Icon = item.icon;
              const c = COLOR_MAP[item.color];
              return (
                <div key={i} className="card p-8 text-center animate-slide-up" style={{ animationDelay: `${i * 100}ms` }}>
                  <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-2xl ${c.bg}`}>
                    <Icon className={`h-8 w-8 ${c.text}`} />
                  </div>
                  <p className="mt-4 text-4xl font-bold text-gray-900">{item.value}</p>
                  <p className="mt-1 text-sm font-semibold text-gray-900">{item.label}</p>
                  <p className="text-xs text-gray-500">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Personal impact */}
      {user && myImpact && (
        <section className="bg-gray-50 py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="card overflow-hidden">
              <div className="bg-gradient-to-r from-brand-600 to-emerald-700 p-6 text-white">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20">
                    <TrendingUp className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Your Personal Impact</h2>
                    <p className="text-sm text-brand-100">Thank you for making a difference, {profile?.full_name || 'friend'}!</p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 p-6 lg:grid-cols-4">
                {[
                  { icon: UtensilsCrossed, label: 'Meals Rescued', value: myImpact.meals_rescued, color: 'brand' },
                  { icon: Leaf, label: 'Food Saved (kg)', value: myImpact.kg_saved.toFixed(1), color: 'emerald' },
                  { icon: Users, label: 'People Served', value: myImpact.people_served, color: 'amber' },
                  { icon: HeartHandshake, label: 'Rescues Completed', value: myImpact.rescues_completed, color: 'coral' },
                ].map((item, i) => {
                  const Icon = item.icon;
                  const c = COLOR_MAP[item.color];
                  return (
                    <div key={i} className="rounded-xl bg-gray-50 p-4 text-center">
                      <div className={`mx-auto flex h-10 w-10 items-center justify-center rounded-xl ${c.bg}`}>
                        <Icon className={`h-5 w-5 ${c.text}`} />
                      </div>
                      <p className="mt-2 text-2xl font-bold text-gray-900">{item.value}</p>
                      <p className="text-xs text-gray-500">{item.label}</p>
                    </div>
                  );
                })}
              </div>
              <div className="border-t border-gray-100 p-4">
                <Link to="/dashboard" className="btn-secondary w-full text-sm">
                  View Dashboard
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Leaderboard */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-4 py-1.5 text-sm font-medium text-amber-700">
              <Award className="h-4 w-4" />
              Top Rescuers
            </div>
            <h2 className="mt-4 text-2xl font-bold text-gray-900">Community Leaderboard</h2>
            <p className="mt-2 text-gray-500">Celebrating our most impactful members</p>
          </div>

          {leaderboard.length === 0 ? (
            <div className="mt-10 card p-12 text-center">
              <Award className="mx-auto h-10 w-10 text-gray-300" />
              <p className="mt-3 text-sm text-gray-400">
                No rescues completed yet. Be the first!
              </p>
              {!user && (
                <Link to="/auth" className="btn-primary mt-4 text-sm">
                  Join the Community
                </Link>
              )}
            </div>
          ) : (
            <div className="mt-10 space-y-3">
              {leaderboard.map((entry, i) => (
                <div
                  key={entry.profile.id}
                  className={`card flex items-center gap-4 p-4 animate-slide-up ${
                    i === 0 ? 'ring-2 ring-amber-300' : ''
                  }`}
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                    i === 0 ? 'bg-amber-100 text-amber-700' :
                    i === 1 ? 'bg-gray-200 text-gray-600' :
                    i === 2 ? 'bg-orange-100 text-orange-700' :
                    'bg-gray-100 text-gray-500'
                  }`}>
                    {i + 1}
                  </div>
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700">
                    {entry.profile.full_name?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-gray-900">
                      {entry.profile.full_name || 'Anonymous'}
                    </p>
                    <p className="text-xs capitalize text-gray-500">{entry.profile.role}</p>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="text-center">
                      <p className="font-bold text-gray-900">{entry.stats.meals_rescued}</p>
                      <p className="text-[10px] text-gray-400">Meals</p>
                    </div>
                    <div className="text-center">
                      <p className="font-bold text-gray-900">{entry.stats.rescues_completed}</p>
                      <p className="text-[10px] text-gray-400">Rescues</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      {!user && (
        <section className="bg-gradient-to-br from-brand-600 to-emerald-800 py-16">
          <div className="mx-auto max-w-2xl px-4 text-center sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-white">Start Your Impact Today</h2>
            <p className="mt-3 text-brand-100">
              Every donation, every pickup, every delivery adds up to real change.
            </p>
            <Link
              to="/auth"
              className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-white px-8 py-3.5 text-sm font-semibold text-brand-700 shadow-lg transition-all hover:bg-brand-50 hover:shadow-xl active:scale-[0.98]"
            >
              Join FoodRescue
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
