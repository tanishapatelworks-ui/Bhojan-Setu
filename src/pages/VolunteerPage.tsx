import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bike,
  Package,
  CheckCircle2,
  Truck,
  Loader2,
  MapPin,
  Clock,
  UtensilsCrossed,
  X,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import type { Donation } from '@/types';
import { StatusBadge } from '@/components/StatusBadge';
import { STATUS_FLOW, STATUS_META, timeUntil, formatDateTime } from '@/lib/constants';
import { createNotification, updateImpactStats } from '@/lib/notifications';

export function VolunteerPage() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [available, setAvailable] = useState<Donation[]>([]);
  const [myPickups, setMyPickups] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [tab, setTab] = useState<'available' | 'active'>('available');

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    const fetchData = async () => {
      setLoading(true);
      const [{ data: availData }, { data: myData }] = await Promise.all([
        supabase
          .from('donations')
          .select(`
            *,
            donor:profiles!donations_donor_id_fkey(id, full_name, role, phone, address)
          `)
          .eq('status', 'available')
          .order('pickup_deadline', { ascending: true }),
        supabase
          .from('donations')
          .select(`
            *,
            donor:profiles!donations_donor_id_fkey(id, full_name, role, phone, address)
          `)
          .eq('claimed_by', user.id)
          .in('status', ['claimed', 'picked_up'])
          .order('claimed_at', { ascending: false }),
      ]);
      setAvailable((availData as Donation[]) || []);
      setMyPickups((myData as Donation[]) || []);
      setLoading(false);
    };
    fetchData();

    const channel = supabase
      .channel('volunteer-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'donations' },
        () => fetchData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const handleClaim = async (donation: Donation) => {
    if (!user) return;
    setActionLoading(donation.id);
    const { error } = await supabase
      .from('donations')
      .update({
        status: 'claimed',
        claimed_by: user.id,
        claimed_at: new Date().toISOString(),
      })
      .eq('id', donation.id)
      .eq('status', 'available');
    if (!error) {
      await createNotification(
        donation.donor_id,
        `${profile?.full_name || 'A volunteer'} has claimed your food "${donation.title}"`,
        'claim',
        donation.id
      );
    }
    setActionLoading(null);
  };

  const handlePickup = async (donation: Donation) => {
    setActionLoading(donation.id);
    const { error } = await supabase
      .from('donations')
      .update({
        status: 'picked_up',
        picked_up_at: new Date().toISOString(),
      })
      .eq('id', donation.id);
    if (!error) {
      await createNotification(
        donation.donor_id,
        `${profile?.full_name || 'A volunteer'} has picked up your food "${donation.title}"`,
        'pickup',
        donation.id
      );
    }
    setActionLoading(null);
  };

  const handleDeliver = async (donation: Donation) => {
    setActionLoading(donation.id);
    const { error } = await supabase
      .from('donations')
      .update({
        status: 'delivered',
        delivered_at: new Date().toISOString(),
      })
      .eq('id', donation.id);
    if (!error) {
      await createNotification(
        donation.donor_id,
        `Your food "${donation.title}" has been delivered. Thank you!`,
        'delivery',
        donation.id
      );
      const meals = parseInt(donation.quantity) || 5;
      await updateImpactStats(user!.id, meals, meals * 0.25, meals * 2);
    }
    setActionLoading(null);
  };

  if (!user) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <div className="card p-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-100">
            <Bike className="h-7 w-7 text-brand-600" />
          </div>
          <h2 className="mt-4 text-xl font-bold text-gray-900">
            Sign in to volunteer
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            You need an account to accept pickup requests and track your rescues.
          </p>
          <button onClick={() => navigate('/auth')} className="btn-primary mt-4">
            Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-100">
          <Bike className="h-6 w-6 text-brand-600" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Volunteer Hub</h1>
          <p className="text-gray-500">Accept pickups and track your rescues</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-2 rounded-xl bg-gray-100 p-1">
        <button
          onClick={() => setTab('available')}
          className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all ${
            tab === 'available' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
          }`}
        >
          Available ({available.length})
        </button>
        <button
          onClick={() => setTab('active')}
          className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all ${
            tab === 'active' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
          }`}
        >
          My Pickups ({myPickups.length})
        </button>
      </div>

      {loading ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
        </div>
      ) : tab === 'available' ? (
        available.length === 0 ? (
          <EmptyState icon={Package} title="No pickups available" desc="Check back later for new food donations" />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {available.map((d) => (
              <div key={d.id} className="card overflow-hidden">
                <div className="relative h-36 overflow-hidden">
                  {d.image_url ? (
                    <img src={d.image_url} alt={d.title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-100 via-brand-50 to-amber-50">
                      <UtensilsCrossed className="h-10 w-10 text-brand-300" strokeWidth={1.5} />
                    </div>
                  )}
                  <div className="absolute left-3 top-3">
                    <StatusBadge status={d.status} />
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900">{d.title}</h3>
                  <p className="mt-1 text-sm text-gray-500">{d.quantity}</p>
                  {d.address && (
                    <div className="mt-2 flex items-start gap-1.5 text-xs text-gray-500">
                      <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-500" />
                      {d.address}
                    </div>
                  )}
                  <div className="mt-2 flex items-center gap-1.5 text-xs font-medium text-amber-600">
                    <Clock className="h-3.5 w-3.5" />
                    {timeUntil(d.pickup_deadline)}
                  </div>
                  <button
                    onClick={() => handleClaim(d)}
                    disabled={actionLoading === d.id}
                    className="btn-primary mt-3 w-full text-xs"
                  >
                    {actionLoading === d.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <>
                        <Package className="h-3.5 w-3.5" />
                        Accept Pickup
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : myPickups.length === 0 ? (
          <EmptyState icon={Truck} title="No active pickups" desc="Accept a pickup to see it here" />
        ) : (
          <div className="space-y-4">
            {myPickups.map((d) => (
              <div key={d.id} className="card p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                  <div className="h-24 w-24 shrink-0 overflow-hidden rounded-xl">
                    {d.image_url ? (
                      <img src={d.image_url} alt={d.title} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-100 to-amber-50">
                        <UtensilsCrossed className="h-8 w-8 text-brand-300" strokeWidth={1.5} />
                      </div>
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold text-gray-900">{d.title}</h3>
                        <p className="mt-0.5 text-sm text-gray-500">{d.quantity}</p>
                      </div>
                      <StatusBadge status={d.status} />
                    </div>

                    {/* Progress tracker */}
                    <div className="mt-4 flex items-center gap-2">
                      {STATUS_FLOW.map((status, i) => {
                        const meta = STATUS_META[status];
                        const currentIdx = STATUS_FLOW.indexOf(d.status as typeof STATUS_FLOW[number]);
                        const isDone = i <= currentIdx;
                        const isCurrent = i === currentIdx;
                        return (
                          <div key={status} className="flex flex-1 items-center">
                            <div className="flex flex-col items-center">
                              <div
                                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all ${
                                  isDone
                                    ? `${meta.color} ${isCurrent ? 'ring-2 ring-offset-2 ring-brand-400' : ''}`
                                    : 'bg-gray-100 text-gray-400'
                                }`}
                              >
                                {isDone && i < currentIdx ? (
                                  <CheckCircle2 className="h-4 w-4" />
                                ) : (
                                  i + 1
                                )}
                              </div>
                              <span className="mt-1 text-[10px] font-medium text-gray-500">
                                {meta.label}
                              </span>
                            </div>
                            {i < STATUS_FLOW.length - 1 && (
                              <div className={`mx-1 h-0.5 flex-1 rounded ${i < currentIdx ? 'bg-brand-400' : 'bg-gray-200'}`} />
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Action buttons */}
                    <div className="mt-4 flex gap-2">
                      {d.status === 'claimed' && (
                        <button
                          onClick={() => handlePickup(d)}
                          disabled={actionLoading === d.id}
                          className="btn-primary text-xs"
                        >
                          {actionLoading === d.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <>
                              <Truck className="h-3.5 w-3.5" />
                              Mark as Picked Up
                            </>
                          )}
                        </button>
                      )}
                      {d.status === 'picked_up' && (
                        <button
                          onClick={() => handleDeliver(d)}
                          disabled={actionLoading === d.id}
                          className="btn-primary text-xs"
                        >
                          {actionLoading === d.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <>
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Mark as Delivered
                            </>
                          )}
                        </button>
                      )}
                    </div>

                    {d.donor && (
                      <div className="mt-3 border-t border-gray-100 pt-3 text-xs text-gray-500">
                        <span className="font-medium">From:</span> {d.donor.full_name || 'Anonymous'}
                        {d.donor.phone && (
                          <span className="ml-2 text-brand-600">{d.donor.phone}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
    </div>
  );
}

function EmptyState({ icon: Icon, title, desc }: { icon: typeof Package; title: string; desc: string }) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gray-100">
        <Icon className="h-10 w-10 text-gray-300" />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-gray-900">{title}</h3>
      <p className="mt-1 text-sm text-gray-500">{desc}</p>
    </div>
  );
}
