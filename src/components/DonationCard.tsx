import { Link } from 'react-router-dom';
import { MapPin, Clock, UtensilsCrossed, Apple, Croissant, Package, Cookie } from 'lucide-react';
import type { Donation, FoodCategory } from '@/types';
import { STATUS_META, timeUntil, FOOD_TYPES } from '@/lib/constants';
import { StatusBadge } from './StatusBadge';

const CATEGORY_ICONS: Record<FoodCategory, typeof UtensilsCrossed> = {
  prepared: UtensilsCrossed,
  produce: Apple,
  bakery: Croissant,
  packaged: Package,
  other: Cookie,
};

const CATEGORY_LABELS: Record<FoodCategory, string> = {
  prepared: 'Prepared',
  produce: 'Produce',
  bakery: 'Bakery',
  packaged: 'Packaged',
  other: 'Other',
};

export function DonationCard({ donation }: { donation: Donation }) {
  const Icon = CATEGORY_ICONS[donation.category];
  const foodType = FOOD_TYPES.find((ft) => ft.value === donation.food_type);
  const meta = STATUS_META[donation.status];

  return (
    <Link
      to={`/find-food?id=${donation.id}`}
      className="card group block overflow-hidden animate-slide-up"
    >
      <div className="relative h-44 overflow-hidden">
        {donation.image_url ? (
          <img
            src={donation.image_url}
            alt={donation.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-100 via-brand-50 to-amber-50">
            <Icon className="h-12 w-12 text-brand-300" strokeWidth={1.5} />
          </div>
        )}
        <div className="absolute left-3 top-3">
          <StatusBadge status={donation.status} />
        </div>
        <div className="absolute right-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-medium text-gray-700 backdrop-blur-sm">
          <span className="flex items-center gap-1">
            <Icon className="h-3 w-3" />
            {CATEGORY_LABELS[donation.category]}
          </span>
        </div>
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-gray-900 group-hover:text-brand-700 transition-colors">
          {donation.title}
        </h3>
        <p className="mt-1 text-sm text-gray-500 line-clamp-2">
          {donation.description || 'No description provided'}
        </p>

        <div className="mt-3 flex items-center gap-3 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <span className="font-medium text-gray-700">{donation.quantity}</span>
          </span>
          {foodType && (
            <span className="flex items-center gap-1">
              <span className={`h-2 w-2 rounded-full ${
                donation.food_type === 'veg' ? 'bg-green-500' :
                donation.food_type === 'vegan' ? 'bg-emerald-600' : 'bg-red-400'
              }`} />
              {foodType.label}
            </span>
          )}
        </div>

        <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3">
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <MapPin className="h-3.5 w-3.5 text-brand-500" />
            <span className="truncate max-w-[140px]">
              {donation.address || 'Location on map'}
            </span>
          </div>
          {donation.status === 'available' && (
            <span className={`flex items-center gap-1 text-xs font-medium ${
              new Date(donation.pickup_deadline).getTime() < Date.now()
                ? 'text-red-500'
                : 'text-amber-600'
            }`}>
              <Clock className="h-3.5 w-3.5" />
              {timeUntil(donation.pickup_deadline)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
