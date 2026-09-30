import { useEffect, useState, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Search,
  SlidersHorizontal,
  MapPin,
  X,
  UtensilsCrossed,
  Apple,
  Croissant,
  Package,
  Cookie,
  Loader2,
  Inbox,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Donation, FoodCategory, FoodType } from '@/types';
import { DonationCard } from '@/components/DonationCard';
import {
  CATEGORIES,
  FOOD_TYPES,
  DISTANCE_OPTIONS,
  PICKUP_TIME_OPTIONS,
  haversineDistance,
  STATUS_META,
  timeUntil,
  formatDateTime,
} from '@/lib/constants';
import { useAuth } from '@/lib/auth';
import { StatusBadge } from '@/components/StatusBadge';
import { createNotification } from '@/lib/notifications';

const CATEGORY_ICONS: Record<FoodCategory, typeof UtensilsCrossed> = {
  prepared: UtensilsCrossed,
  produce: Apple,
  bakery: Croissant,
  packaged: Package,
  other: Cookie,
};

export function FindFoodPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<FoodCategory[]>([]);
  const [selectedFoodTypes, setSelectedFoodTypes] = useState<FoodType[]>([]);
  const [maxDistance, setMaxDistance] = useState(50);
  const [pickupTime, setPickupTime] = useState('all');
  const [userLat, setUserLat] = useState<number | null>(null);
  const [userLon, setUserLon] = useState<number | null>(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLat(pos.coords.latitude);
          setUserLon(pos.coords.longitude);
        },
        () => {}
      );
    }
  }, []);

  useEffect(() => {
    const fetchDonations = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('donations')
        .select(`
          *,
          donor:profiles!donations_donor_id_fkey(id, full_name, role),
          claimer:profiles!donations_claimed_by_fkey(id, full_name, role)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching donations:', error);
      } else {
        setDonations((data as Donation[]) || []);
      }
      setLoading(false);
    };
    fetchDonations();

    const channel = supabase
      .channel('donations-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'donations' },
        () => fetchDonations()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const filtered = useMemo(() => {
    return donations.filter((d) => {
      if (d.status !== 'available') return false;

      if (search) {
        const q = search.toLowerCase();
        if (
          !d.title.toLowerCase().includes(q) &&
          !d.description?.toLowerCase().includes(q) &&
          !d.address?.toLowerCase().includes(q)
        )
          return false;
      }

      if (selectedCategories.length > 0 && !selectedCategories.includes(d.category))
        return false;

      if (selectedFoodTypes.length > 0 && !selectedFoodTypes.includes(d.food_type))
        return false;

      if (userLat != null && userLon != null && d.latitude != null && d.longitude != null) {
        const dist = haversineDistance(userLat, userLon, d.latitude, d.longitude);
        if (dist > maxDistance) return false;
      }

      if (pickupTime !== 'all') {
        const hours = parseFloat(pickupTime);
        const deadline = new Date(d.pickup_deadline).getTime();
        const cutoff = Date.now() + hours * 3600000;
        if (deadline > cutoff) return false;
      }

      return true;
    });
  }, [donations, search, selectedCategories, selectedFoodTypes, maxDistance, pickupTime, userLat, userLon]);

  const toggleCategory = (cat: FoodCategory) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const toggleFoodType = (ft: FoodType) => {
    setSelectedFoodTypes((prev) =>
      prev.includes(ft) ? prev.filter((f) => f !== ft) : [...prev, ft]
    );
  };

  const clearFilters = () => {
    setSelectedCategories([]);
    setSelectedFoodTypes([]);
    setMaxDistance(50);
    setPickupTime('all');
    setSearch('');
  };

  const activeFilterCount =
    selectedCategories.length +
    selectedFoodTypes.length +
    (maxDistance !== 50 ? 1 : 0) +
    (pickupTime !== 'all' ? 1 : 0);

  const selectedId = searchParams.get('id');

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Find Food</h1>
        <p className="mt-1 text-gray-500">
          Browse available surplus food near you
        </p>
      </div>

      {/* Search bar */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, description, or location..."
            className="input-field pl-11"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <button
          onClick={() => setShowFilters((f) => !f)}
          className={`btn-secondary ${showFilters ? 'ring-brand-500' : ''}`}
        >
          <SlidersHorizontal className="h-4 w-4" />
          <span className="hidden sm:inline">Filters</span>
          {activeFilterCount > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-600 px-1.5 text-xs font-bold text-white">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* Filters panel */}
      {showFilters && (
        <div className="mt-4 animate-fade-in-fast rounded-2xl bg-white p-5 ring-1 ring-gray-200">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">Filters</h3>
            {activeFilterCount > 0 && (
              <button
                onClick={clearFilters}
                className="text-xs font-medium text-brand-600 hover:text-brand-700"
              >
                Clear all
              </button>
            )}
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {/* Category */}
            <div>
              <label className="label-field">Food Category</label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((cat) => {
                  const Icon = CATEGORY_ICONS[cat.value];
                  const active = selectedCategories.includes(cat.value);
                  return (
                    <button
                      key={cat.value}
                      onClick={() => toggleCategory(cat.value)}
                      className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                        active
                          ? 'bg-brand-600 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {cat.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Food Type */}
            <div>
              <label className="label-field">Food Type</label>
              <div className="flex flex-wrap gap-2">
                {FOOD_TYPES.map((ft) => {
                  const active = selectedFoodTypes.includes(ft.value);
                  return (
                    <button
                      key={ft.value}
                      onClick={() => toggleFoodType(ft.value)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                        active
                          ? 'bg-brand-600 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {ft.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Distance */}
            <div>
              <label className="label-field">Distance</label>
              <select
                value={maxDistance}
                onChange={(e) => setMaxDistance(Number(e.target.value))}
                className="input-field cursor-pointer"
              >
                {DISTANCE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              {!userLat && (
                <p className="mt-1 text-xs text-gray-400">
                  Enable location for distance filtering
                </p>
              )}
            </div>

            {/* Pickup Time */}
            <div>
              <label className="label-field">Pickup Time</label>
              <select
                value={pickupTime}
                onChange={(e) => setPickupTime(e.target.value)}
                className="input-field cursor-pointer"
              >
                {PICKUP_TIME_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Results count */}
      <div className="mt-6 flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {loading ? 'Loading...' : `${filtered.length} food ${filtered.length === 1 ? 'listing' : 'listings'} found`}
        </p>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex min-h-[40vh] flex-col items-center justify-center text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gray-100">
            <Inbox className="h-10 w-10 text-gray-300" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-gray-900">
            No food available
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Try adjusting your filters or check back later
          </p>
          {activeFilterCount > 0 && (
            <button onClick={clearFilters} className="btn-secondary mt-4">
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((donation) => (
            <DonationCard key={donation.id} donation={donation} />
          ))}
        </div>
      )}

      {/* Detail modal */}
      {selectedId && (
        <DonationDetailModal
          donationId={selectedId}
          onClose={() => setSearchParams({})}
        />
      )}
    </div>
  );
}

function DonationDetailModal({
  donationId,
  onClose,
}: {
  donationId: string;
  onClose: () => void;
}) {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [donation, setDonation] = useState<Donation | null>(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from('donations')
        .select(`
          *,
          donor:profiles!donations_donor_id_fkey(id, full_name, role, phone),
          claimer:profiles!donations_claimed_by_fkey(id, full_name, role)
        `)
        .eq('id', donationId)
        .maybeSingle();
      setDonation(data as Donation | null);
      setLoading(false);
    };
    fetch();
  }, [donationId]);

  const handleClaim = async () => {
    if (!user || !donation) return;
    setClaiming(true);
    const { error } = await supabase
      .from('donations')
      .update({
        status: 'claimed',
        claimed_by: user.id,
        claimed_at: new Date().toISOString(),
      })
      .eq('id', donation.id);
    if (!error) {
      await createNotification(
        donation.donor_id,
        `${profile?.full_name || 'Someone'} has claimed your food "${donation.title}"`,
        'claim',
        donation.id
      );
      onClose();
      navigate('/volunteer');
    }
    setClaiming(false);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    );
  }

  if (!donation) return null;

  const meta = STATUS_META[donation.status];
  const canClaim =
    donation.status === 'available' && user && profile?.role !== 'donor';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm animate-fade-in-fast"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white shadow-2xl animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative h-56 overflow-hidden rounded-t-3xl">
          {donation.image_url ? (
            <img
              src={donation.image_url}
              alt={donation.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-100 via-brand-50 to-amber-50">
              <UtensilsCrossed className="h-16 w-16 text-brand-300" strokeWidth={1.5} />
            </div>
          )}
          <button
            onClick={onClose}
            className="absolute right-3 top-3 rounded-full bg-white/90 p-2 text-gray-600 backdrop-blur-sm transition-colors hover:bg-white hover:text-gray-900"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="absolute left-3 top-3">
            <StatusBadge status={donation.status} />
          </div>
        </div>

        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900">{donation.title}</h2>
          {donation.description && (
            <p className="mt-2 text-sm text-gray-600">{donation.description}</p>
          )}

          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="rounded-xl bg-gray-50 p-3">
              <p className="text-xs text-gray-400">Quantity</p>
              <p className="mt-0.5 font-semibold text-gray-900">{donation.quantity}</p>
            </div>
            <div className="rounded-xl bg-gray-50 p-3">
              <p className="text-xs text-gray-400">Category</p>
              <p className="mt-0.5 font-semibold text-gray-900 capitalize">{donation.category}</p>
            </div>
            <div className="rounded-xl bg-gray-50 p-3">
              <p className="text-xs text-gray-400">Food Type</p>
              <p className="mt-0.5 font-semibold text-gray-900 capitalize">{donation.food_type}</p>
            </div>
            <div className="rounded-xl bg-gray-50 p-3">
              <p className="text-xs text-gray-400">Pickup Deadline</p>
              <p className="mt-0.5 font-semibold text-gray-900">
                {timeUntil(donation.pickup_deadline)}
              </p>
            </div>
          </div>

          {donation.prepared_at && (
            <div className="mt-3 rounded-xl bg-gray-50 p-3">
              <p className="text-xs text-gray-400">Prepared At</p>
              <p className="mt-0.5 font-semibold text-gray-900">
                {formatDateTime(donation.prepared_at)}
              </p>
            </div>
          )}

          {donation.address && (
            <div className="mt-3 flex items-start gap-2 rounded-xl bg-gray-50 p-3">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" />
              <div>
                <p className="text-xs text-gray-400">Pickup Location</p>
                <p className="mt-0.5 text-sm font-medium text-gray-900">{donation.address}</p>
              </div>
            </div>
          )}

          {donation.donor && (
            <div className="mt-3 flex items-center gap-3 rounded-xl bg-gray-50 p-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700">
                {donation.donor.full_name?.[0]?.toUpperCase() || 'D'}
              </div>
              <div>
                <p className="text-xs text-gray-400">Donated by</p>
                <p className="text-sm font-medium text-gray-900">
                  {donation.donor.full_name || 'Anonymous'}
                </p>
              </div>
            </div>
          )}

          {canClaim ? (
            <button
              onClick={handleClaim}
              disabled={claiming}
              className="btn-primary mt-5 w-full"
            >
              {claiming ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Claiming...
                </>
              ) : (
                'Claim This Food'
              )}
            </button>
          ) : !user ? (
            <button
              onClick={() => navigate('/auth')}
              className="btn-primary mt-5 w-full"
            >
              Sign in to claim
            </button>
          ) : donation.status !== 'available' ? (
            <div className="mt-5 rounded-xl bg-amber-50 p-3 text-center text-sm text-amber-700">
              This food has already been {meta.label.toLowerCase()}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
