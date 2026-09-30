import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Gift,
  MapPin,
  Clock,
  Image as ImageIcon,
  Loader2,
  CheckCircle2,
  UtensilsCrossed,
  Apple,
  Croissant,
  Package,
  Cookie,
  Upload,
  X,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { CATEGORIES, FOOD_TYPES } from '@/lib/constants';
import type { FoodCategory, FoodType } from '@/types';

const CATEGORY_ICONS: Record<FoodCategory, typeof UtensilsCrossed> = {
  prepared: UtensilsCrossed,
  produce: Apple,
  bakery: Croissant,
  packaged: Package,
  other: Cookie,
};

export function DonateFoodPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [userLat, setUserLat] = useState<number | null>(null);
  const [userLon, setUserLon] = useState<number | null>(null);

  const [form, setForm] = useState({
    title: '',
    description: '',
    quantity: '',
    category: 'prepared' as FoodCategory,
    food_type: 'veg' as FoodType,
    prepared_at: '',
    pickup_deadline: '',
    address: '',
  });

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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleImageRemove = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile || !user) return null;
    const ext = imageFile.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from('donation-images')
      .upload(fileName, imageFile);
    if (error) {
      console.error('Upload error:', error);
      return null;
    }
    const { data: urlData } = supabase.storage
      .from('donation-images')
      .getPublicUrl(fileName);
    return urlData.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);

    const imageUrl = await uploadImage();

    const { error } = await supabase.from('donations').insert({
      donor_id: user.id,
      title: form.title,
      description: form.description,
      quantity: form.quantity,
      category: form.category,
      food_type: form.food_type,
      prepared_at: form.prepared_at ? new Date(form.prepared_at).toISOString() : null,
      pickup_deadline: new Date(form.pickup_deadline).toISOString(),
      address: form.address,
      latitude: userLat,
      longitude: userLon,
      image_url: imageUrl,
      status: 'available',
    });

    setSubmitting(false);

    if (error) {
      console.error('Insert error:', error);
      alert('Failed to create donation. Please try again.');
    } else {
      setSuccess(true);
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    }
  };

  if (success) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-lg items-center justify-center px-4">
        <div className="card w-full p-10 text-center animate-scale-in">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-brand-100">
            <CheckCircle2 className="h-10 w-10 text-brand-600" />
          </div>
          <h2 className="mt-6 text-2xl font-bold text-gray-900">
            Donation Posted!
          </h2>
          <p className="mt-2 text-gray-500">
            Your food donation is now visible to volunteers and NGOs nearby.
            We'll notify you when someone claims it.
          </p>
          <p className="mt-4 text-sm text-gray-400">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-100">
          <Gift className="h-7 w-7 text-brand-600" />
        </div>
        <h1 className="mt-4 text-3xl font-bold text-gray-900">Donate Food</h1>
        <p className="mt-1 text-gray-500">
          Share your surplus food with those who need it
        </p>
      </div>

      {!user && (
        <div className="mb-6 rounded-2xl bg-amber-50 p-4 text-center ring-1 ring-amber-200">
          <p className="text-sm text-amber-700">
            Please sign in to donate food.{' '}
            <button
              onClick={() => navigate('/auth')}
              className="font-semibold underline"
            >
              Sign in here
            </button>
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card p-6">
          <h3 className="mb-4 text-sm font-semibold text-gray-900">Food Details</h3>

          <div className="space-y-4">
            <div>
              <label className="label-field">Food Name *</label>
              <input
                type="text"
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Fresh vegetable curry, 20 sandwiches"
                className="input-field"
              />
            </div>

            <div>
              <label className="label-field">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Add any details about the food..."
                rows={3}
                className="input-field resize-none"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label-field">Quantity *</label>
                <input
                  type="text"
                  required
                  value={form.quantity}
                  onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                  placeholder="e.g. 20 meals, 5 kg"
                  className="input-field"
                />
              </div>
              <div>
                <label className="label-field">Food Type</label>
                <select
                  value={form.food_type}
                  onChange={(e) => setForm({ ...form, food_type: e.target.value as FoodType })}
                  className="input-field cursor-pointer"
                >
                  {FOOD_TYPES.map((ft) => (
                    <option key={ft.value} value={ft.value}>
                      {ft.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="label-field">Category</label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                {CATEGORIES.map((cat) => {
                  const Icon = CATEGORY_ICONS[cat.value];
                  const active = form.category === cat.value;
                  return (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => setForm({ ...form, category: cat.value })}
                      className={`flex flex-col items-center gap-1.5 rounded-xl border-2 px-2 py-3 text-xs font-medium transition-all ${
                        active
                          ? 'border-brand-500 bg-brand-50 text-brand-700'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      {cat.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <h3 className="mb-4 text-sm font-semibold text-gray-900">Timing</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label-field flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-gray-400" />
                Prepared At
              </label>
              <input
                type="datetime-local"
                value={form.prepared_at}
                onChange={(e) => setForm({ ...form, prepared_at: e.target.value })}
                className="input-field"
              />
            </div>
            <div>
              <label className="label-field flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-coral-500" />
                Pickup Deadline *
              </label>
              <input
                type="datetime-local"
                required
                value={form.pickup_deadline}
                onChange={(e) => setForm({ ...form, pickup_deadline: e.target.value })}
                className="input-field"
              />
            </div>
          </div>
        </div>

        <div className="card p-6">
          <h3 className="mb-4 text-sm font-semibold text-gray-900">Location</h3>
          <div>
            <label className="label-field flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5 text-brand-500" />
              Pickup Address
            </label>
            <input
              type="text"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              placeholder="e.g. 123 Main St, City"
              className="input-field"
            />
            {userLat != null && (
              <p className="mt-2 text-xs text-gray-400">
                GPS coordinates detected: {userLat.toFixed(4)}, {userLon?.toFixed(4)}
              </p>
            )}
          </div>
        </div>

        <div className="card p-6">
          <h3 className="mb-4 text-sm font-semibold text-gray-900">Food Photo</h3>
          {imagePreview ? (
            <div className="relative">
              <img
                src={imagePreview}
                alt="Food preview"
                className="h-48 w-full rounded-xl object-cover"
              />
              <button
                type="button"
                onClick={handleImageRemove}
                className="absolute right-2 top-2 rounded-full bg-white/90 p-2 text-gray-600 backdrop-blur-sm transition-colors hover:bg-white hover:text-coral-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 py-10 transition-colors hover:border-brand-400 hover:bg-brand-50/30">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
                <Upload className="h-6 w-6 text-gray-400" />
              </div>
              <p className="mt-3 text-sm font-medium text-gray-600">
                Click to upload a photo
              </p>
              <p className="mt-1 text-xs text-gray-400">
                PNG, JPG up to 5MB
              </p>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </label>
          )}
        </div>

        <button
          type="submit"
          disabled={submitting || !user}
          className="btn-primary w-full"
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Posting donation...
            </>
          ) : (
            <>
              <Gift className="h-4 w-4" />
              Post Donation
            </>
          )}
        </button>
      </form>
    </div>
  );
}
