import type {
  DonationStatus,
  FoodCategory,
  FoodType,
  UserRole,
} from '@/types';

export const ROLES: { value: UserRole; label: string; description: string }[] = [
  {
    value: 'donor',
    label: 'Donor',
    description: 'Restaurants, hotels, events & households with surplus food',
  },
  {
    value: 'volunteer',
    label: 'Volunteer',
    description: 'Pick up surplus food and deliver it to those in need',
  },
  {
    value: 'ngo',
    label: 'NGO',
    description: 'Receive rescued food for your community programs',
  },
  {
    value: 'admin',
    label: 'Admin',
    description: 'Manage the platform and oversee all activity',
  },
];

export const CATEGORIES: { value: FoodCategory; label: string; icon: string }[] = [
  { value: 'prepared', label: 'Prepared Meals', icon: 'UtensilsCrossed' },
  { value: 'produce', label: 'Fresh Produce', icon: 'Apple' },
  { value: 'bakery', label: 'Bakery', icon: 'Croissant' },
  { value: 'packaged', label: 'Packaged', icon: 'Package' },
  { value: 'other', label: 'Other', icon: 'Cookie' },
];

export const FOOD_TYPES: { value: FoodType; label: string }[] = [
  { value: 'veg', label: 'Vegetarian' },
  { value: 'non-veg', label: 'Non-Vegetarian' },
  { value: 'vegan', label: 'Vegan' },
];

export const STATUS_FLOW: DonationStatus[] = [
  'available',
  'claimed',
  'picked_up',
  'delivered',
];

export const STATUS_META: Record<
  DonationStatus,
  { label: string; color: string; dotColor: string }
> = {
  available: {
    label: 'Available',
    color: 'bg-brand-100 text-brand-700',
    dotColor: 'bg-brand-500',
  },
  claimed: {
    label: 'Claimed',
    color: 'bg-amber-100 text-amber-700',
    dotColor: 'bg-amber-500',
  },
  picked_up: {
    label: 'Picked Up',
    color: 'bg-blue-100 text-blue-700',
    dotColor: 'bg-blue-500',
  },
  delivered: {
    label: 'Delivered',
    color: 'bg-emerald-100 text-emerald-700',
    dotColor: 'bg-emerald-600',
  },
  expired: {
    label: 'Expired',
    color: 'bg-gray-200 text-gray-600',
    dotColor: 'bg-gray-400',
  },
};

export const DISTANCE_OPTIONS = [
  { value: 1, label: 'Within 1 km' },
  { value: 3, label: 'Within 3 km' },
  { value: 5, label: 'Within 5 km' },
  { value: 10, label: 'Within 10 km' },
  { value: 50, label: 'Any distance' },
];

export const PICKUP_TIME_OPTIONS = [
  { value: 'all', label: 'Any time' },
  { value: '1', label: 'Within 1 hour' },
  { value: '3', label: 'Within 3 hours' },
  { value: '6', label: 'Within 6 hours' },
  { value: '24', label: 'Within 24 hours' },
];

export function formatRelativeTime(date: string | null): string {
  if (!date) return '';
  const now = new Date();
  const d = new Date(date);
  const diff = d.getTime() - now.getTime();
  const absMin = Math.abs(diff) / 60000;

  if (absMin < 1) return 'just now';
  if (absMin < 60) {
    return diff > 0
      ? `in ${Math.floor(absMin)} min`
      : `${Math.floor(absMin)} min ago`;
  }
  const absHr = absMin / 60;
  if (absHr < 24) {
    return diff > 0
      ? `in ${Math.floor(absHr)} hr`
      : `${Math.floor(absHr)} hr ago`;
  }
  const absDay = absHr / 24;
  if (absDay < 7) {
    return diff > 0
      ? `in ${Math.floor(absDay)} days`
      : `${Math.floor(absDay)} days ago`;
  }
  return d.toLocaleDateString();
}

export function formatDateTime(date: string | null): string {
  if (!date) return '';
  return new Date(date).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function timeUntil(date: string): string {
  const diff = new Date(date).getTime() - Date.now();
  if (diff <= 0) return 'Expired';
  const hours = Math.floor(diff / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  if (hours > 0) return `${hours}h ${minutes}m left`;
  return `${minutes}m left`;
}

export function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
