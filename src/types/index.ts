export type UserRole = 'donor' | 'ngo' | 'volunteer' | 'admin';

export type DonationStatus =
  | 'available'
  | 'claimed'
  | 'picked_up'
  | 'delivered'
  | 'expired';

export type FoodCategory =
  | 'prepared'
  | 'produce'
  | 'bakery'
  | 'packaged'
  | 'other';

export type FoodType = 'veg' | 'non-veg' | 'vegan';

export type NotificationType =
  | 'claim'
  | 'pickup'
  | 'delivery'
  | 'system'
  | 'expiry';

export interface Profile {
  id: string;
  full_name: string;
  role: UserRole;
  phone: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  avatar_url: string | null;
  created_at: string;
}

export interface Donation {
  id: string;
  donor_id: string;
  title: string;
  description: string;
  quantity: string;
  category: FoodCategory;
  food_type: FoodType;
  prepared_at: string | null;
  pickup_deadline: string;
  latitude: number | null;
  longitude: number | null;
  address: string;
  image_url: string | null;
  status: DonationStatus;
  claimed_by: string | null;
  claimed_at: string | null;
  picked_up_at: string | null;
  delivered_at: string | null;
  created_at: string;
  donor?: Profile;
  claimer?: Profile;
}

export interface Notification {
  id: string;
  user_id: string;
  message: string;
  type: NotificationType;
  donation_id: string | null;
  is_read: boolean;
  created_at: string;
}

export interface ImpactStats {
  id: string;
  user_id: string;
  meals_rescued: number;
  kg_saved: number;
  people_served: number;
  rescues_completed: number;
}

export interface DonationWithRelations extends Donation {
  donor?: Profile;
  claimer?: Profile;
}
