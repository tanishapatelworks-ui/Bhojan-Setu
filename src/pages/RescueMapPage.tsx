import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Loader2, Navigation, UtensilsCrossed } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Donation } from '@/types';
import { StatusBadge } from '@/components/StatusBadge';
import { timeUntil } from '@/lib/constants';

export function RescueMapPage() {
  const navigate = useNavigate();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Donation | null>(null);
  const [userLat, setUserLat] = useState<number | null>(null);
  const [userLon, setUserLon] = useState<number | null>(null);

  useEffect(() => {
    const fetchDonations = async () => {
      const { data } = await supabase
        .from('donations')
        .select(`
          *,
          donor:profiles!donations_donor_id_fkey(id, full_name, role)
        `)
        .in('status', ['available', 'claimed', 'picked_up'])
        .order('created_at', { ascending: false });
      setDonations((data as Donation[]) || []);
      setLoading(false);
    };
    fetchDonations();

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLat(pos.coords.latitude);
          setUserLon(pos.coords.longitude);
        },
        () => {
          setUserLat(40.7128);
          setUserLon(-74.006);
        }
      );
    } else {
      setUserLat(40.7128);
      setUserLon(-74.006);
    }
  }, []);

  // Calculate relative positions for our visual map
  const getMarkerPosition = (donation: Donation) => {
    if (donation.latitude == null || donation.longitude == null || userLat == null || userLon == null)
      return null;
    const latDiff = donation.latitude - userLat;
    const lonDiff = donation.longitude - userLon;
    const scale = 50;
    const x = 50 + lonDiff * scale;
    const y = 50 - latDiff * scale;
    return {
      x: Math.max(5, Math.min(95, x)),
      y: Math.max(5, Math.min(95, y)),
    };
  };

  const statusColors: Record<string, string> = {
    available: 'bg-brand-500',
    claimed: 'bg-amber-500',
    picked_up: 'bg-blue-500',
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Rescue Map</h1>
        <p className="mt-1 text-gray-500">
          See all available and in-progress food rescues near you
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Map */}
        <div className="lg:col-span-2">
          <div className="relative aspect-square overflow-hidden rounded-2xl bg-gradient-to-br from-brand-50 via-emerald-50 to-blue-50 ring-1 ring-gray-200 sm:aspect-[4/3]">
            {/* Grid pattern */}
            <div
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage: `
                  linear-gradient(to right, #86efac 1px, transparent 1px),
                  linear-gradient(to bottom, #86efac 1px, transparent 1px)
                `,
                backgroundSize: '40px 40px',
              }}
            />

            {/* Roads */}
            <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="none">
              <line x1="0%" y1="30%" x2="100%" y2="35%" stroke="#d1d5db" strokeWidth="3" />
              <line x1="0%" y1="65%" x2="100%" y2="60%" stroke="#d1d5db" strokeWidth="3" />
              <line x1="25%" y1="0%" x2="30%" y2="100%" stroke="#d1d5db" strokeWidth="3" />
              <line x1="70%" y1="0%" x2="65%" y2="100%" stroke="#d1d5db" strokeWidth="3" />
            </svg>

            {loading ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
              </div>
            ) : (
              <>
                {/* User location */}
                {userLat != null && userLon != null && (
                  <div
                    className="absolute"
                    style={{ left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}
                  >
                    <div className="relative">
                      <div className="absolute inset-0 animate-pulse-ring rounded-full bg-blue-500" />
                      <div className="relative flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 ring-4 ring-white shadow-lg">
                        <Navigation className="h-2.5 w-2.5 text-white" />
                      </div>
                    </div>
                  </div>
                )}

                {/* Donation markers */}
                {donations.map((d) => {
                  const pos = getMarkerPosition(d);
                  if (!pos) return null;
                  const color = statusColors[d.status] || 'bg-gray-400';
                  return (
                    <button
                      key={d.id}
                      onClick={() => setSelected(d)}
                      className="absolute group"
                      style={{
                        left: `${pos.x}%`,
                        top: `${pos.y}%`,
                        transform: 'translate(-50%, -100%)',
                      }}
                    >
                      <div className="relative flex flex-col items-center">
                        {d.status === 'available' && (
                          <div className={`absolute top-0 h-6 w-6 animate-pulse-ring rounded-full ${color}`} />
                        )}
                        <div className={`relative flex h-8 w-8 items-center justify-center rounded-full ${color} ring-3 ring-white shadow-lg transition-transform group-hover:scale-125`}>
                          <MapPin className="h-4 w-4 text-white" />
                        </div>
                        <div className="mt-0.5 h-2 w-2 rotate-45 -translate-y-1 bg-white shadow-sm" />
                      </div>
                    </button>
                  );
                })}

                {/* Legend */}
                <div className="absolute bottom-4 left-4 rounded-xl bg-white/90 p-3 backdrop-blur-sm ring-1 ring-gray-200">
                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-brand-500" />
                      <span className="text-gray-600">Available</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-amber-500" />
                      <span className="text-gray-600">Claimed</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-blue-500" />
                      <span className="text-gray-600">Picked Up</span>
                    </div>
                  </div>
                </div>

                {donations.length === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <MapPin className="mx-auto h-12 w-12 text-gray-300" />
                      <p className="mt-2 text-sm text-gray-400">
                        No food on the map yet
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Sidebar list */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-900">
            {donations.length} Active {donations.length === 1 ? 'Rescue' : 'Rescues'}
          </h3>
          <div className="max-h-[600px] space-y-3 overflow-y-auto">
            {donations.length === 0 ? (
              <div className="card p-6 text-center">
                <UtensilsCrossed className="mx-auto h-8 w-8 text-gray-300" />
                <p className="mt-2 text-sm text-gray-400">
                  No active rescues nearby
                </p>
              </div>
            ) : (
              donations.map((d) => (
                <button
                  key={d.id}
                  onClick={() => setSelected(d)}
                  className={`card w-full p-4 text-left transition-all ${
                    selected?.id === d.id ? 'ring-2 ring-brand-500' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <h4 className="truncate text-sm font-semibold text-gray-900">
                        {d.title}
                      </h4>
                      <p className="mt-0.5 text-xs text-gray-500">
                        {d.quantity} · {d.address || 'Location on map'}
                      </p>
                    </div>
                    <StatusBadge status={d.status} />
                  </div>
                  {d.status === 'available' && (
                    <p className="mt-2 text-xs font-medium text-amber-600">
                      {timeUntil(d.pickup_deadline)}
                    </p>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Detail popup */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 backdrop-blur-sm animate-fade-in-fast sm:items-center"
          onClick={() => setSelected(null)}
        >
          <div
            className="w-full max-w-md rounded-3xl bg-white shadow-2xl animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative h-40 overflow-hidden rounded-t-3xl">
              {selected.image_url ? (
                <img src={selected.image_url} alt={selected.title} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-100 via-brand-50 to-amber-50">
                  <UtensilsCrossed className="h-12 w-12 text-brand-300" strokeWidth={1.5} />
                </div>
              )}
              <button
                onClick={() => setSelected(null)}
                className="absolute right-3 top-3 rounded-full bg-white/90 p-2 text-gray-600 backdrop-blur-sm hover:text-gray-900"
              >
                ✕
              </button>
            </div>
            <div className="p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900">{selected.title}</h2>
                <StatusBadge status={selected.status} />
              </div>
              <p className="mt-1 text-sm text-gray-500">{selected.quantity}</p>
              {selected.address && (
                <div className="mt-3 flex items-start gap-2 text-sm text-gray-600">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" />
                  {selected.address}
                </div>
              )}
              {selected.status === 'available' && (
                <button
                  onClick={() => navigate(`/find-food?id=${selected.id}`)}
                  className="btn-primary mt-4 w-full"
                >
                  View Details
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
