import { Link } from 'react-router-dom';
import {
  Search,
  Gift,
  HeartHandshake,
  UtensilsCrossed,
  Bike,
  Building2,
  ShieldCheck,
  Leaf,
  Users,
  TrendingDown,
  ArrowRight,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

const COLOR_MAP: Record<string, { bg: string; text: string }> = {
  brand: { bg: 'bg-brand-100', text: 'text-brand-600' },
  emerald: { bg: 'bg-emerald-100', text: 'text-emerald-600' },
  amber: { bg: 'bg-amber-100', text: 'text-amber-600' },
  blue: { bg: 'bg-blue-100', text: 'text-blue-600' },
};

export function HomePage() {
  const [stats, setStats] = useState({
    donations: 0,
    delivered: 0,
    meals: 0,
    volunteers: 0,
  });

  useEffect(() => {
    (async () => {
      const [{ count: donations }, { count: delivered }, { count: volunteers }] =
        await Promise.all([
          supabase.from('donations').select('*', { count: 'exact', head: true }),
          supabase
            .from('donations')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'delivered'),
          supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .eq('role', 'volunteer'),
        ]);
      setStats({
        donations: donations ?? 0,
        delivered: delivered ?? 0,
        meals: (delivered ?? 0) * 15,
        volunteers: volunteers ?? 0,
      });
    })();
  }, []);

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-50 via-white to-amber-50">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-brand-200/30 blur-3xl" />
          <div className="absolute right-0 top-20 h-96 w-96 rounded-full bg-amber-200/30 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div className="animate-slide-up">
              <div className="inline-flex items-center gap-2 rounded-full bg-brand-100 px-4 py-1.5 text-sm font-medium text-brand-700">
                <Sparkles className="h-4 w-4" />
                Together we can end food waste
              </div>
              <h1 className="mt-6 text-4xl font-bold leading-tight text-gray-900 sm:text-5xl lg:text-6xl">
                Rescue food.
                <br />
                <span className="bg-gradient-to-r from-brand-600 to-emerald-600 bg-clip-text text-transparent">
                  Nourish communities.
                </span>
              </h1>
              <p className="mt-6 max-w-lg text-lg text-gray-600">
                Connect restaurants, hotels, events and households with NGOs
                and volunteers. Turn surplus food into meals for those who need
                it most.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link to="/donate-food" className="btn-primary">
                  <Gift className="h-5 w-5" />
                  Donate Food
                </Link>
                <Link to="/find-food" className="btn-secondary">
                  <Search className="h-5 w-5" />
                  Find Food
                </Link>
              </div>
              <div className="mt-8 flex items-center gap-6 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-brand-500" />
                  Safe & verified
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-brand-500" />
                  Community driven
                </div>
              </div>
            </div>

            <div className="relative animate-fade-in">
              <div className="relative overflow-hidden rounded-3xl shadow-2xl ring-1 ring-gray-200/50">
                <img
                  src="https://images.pexels.com/photos/6646878/pexels-photo-6646878.jpeg?auto=compress&cs=tinysrgb&h=650&w=940"
                  alt="Volunteers distributing food to the community"
                  className="h-[400px] w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-brand-900/40 via-transparent to-transparent" />
              </div>
              <div className="absolute -bottom-6 -left-6 hidden rounded-2xl bg-white p-4 shadow-xl ring-1 ring-gray-200/50 sm:block animate-float">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-100">
                    <Leaf className="h-6 w-6 text-brand-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.meals.toLocaleString()}+
                    </p>
                    <p className="text-xs text-gray-500">Meals rescued</p>
                  </div>
                </div>
              </div>
              <div className="absolute -top-4 -right-4 hidden rounded-2xl bg-white p-4 shadow-xl ring-1 ring-gray-200/50 sm:block animate-float" style={{ animationDelay: '1s' }}>
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100">
                    <TrendingDown className="h-6 w-6 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {(stats.delivered * 2.5).toFixed(0)}kg
                    </p>
                    <p className="text-xs text-gray-500">Food saved</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Impact Stats */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
            {[
              { icon: Gift, label: 'Food Donations', value: stats.donations, color: 'brand' },
              { icon: CheckCircle2, label: 'Successful Rescues', value: stats.delivered, color: 'emerald' },
              { icon: UtensilsCrossed, label: 'Meals Provided', value: stats.meals, color: 'amber' },
              { icon: Bike, label: 'Active Volunteers', value: stats.volunteers, color: 'blue' },
            ].map((stat, i) => {
              const Icon = stat.icon;
              const c = COLOR_MAP[stat.color];
              return (
                <div
                  key={i}
                  className="card p-6 text-center animate-slide-up"
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <div className={`mx-auto flex h-14 w-14 items-center justify-center rounded-2xl ${c.bg}`}>
                    <Icon className={`h-7 w-7 ${c.text}`} />
                  </div>
                  <p className="mt-4 text-3xl font-bold text-gray-900">
                    {stat.value.toLocaleString()}
                  </p>
                  <p className="mt-1 text-sm text-gray-500">{stat.label}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-gray-50 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
              How It Works
            </h2>
            <p className="mt-3 text-lg text-gray-500">
              Four simple steps from surplus to served
            </p>
          </div>

          <div className="mt-16 grid gap-8 md:grid-cols-4">
            {[
              { icon: Gift, step: '01', title: 'Donate Food', desc: 'Restaurants, hotels, and households post surplus food with pickup details.', color: 'brand' },
              { icon: Search, step: '02', title: 'Find & Claim', desc: 'Volunteers and NGOs browse available food and claim what they can rescue.', color: 'amber' },
              { icon: Bike, step: '03', title: 'Pick Up', desc: 'Volunteers pick up the food from the donor and confirm the pickup.', color: 'blue' },
              { icon: HeartHandshake, step: '04', title: 'Deliver', desc: 'Food is delivered to NGOs and communities, nourishing those in need.', color: 'emerald' },
            ].map((item, i) => {
              const Icon = item.icon;
              const c = COLOR_MAP[item.color];
              return (
                <div
                  key={i}
                  className="group relative animate-slide-up"
                  style={{ animationDelay: `${i * 150}ms` }}
                >
                  <div className="card h-full p-6">
                    <div className="flex items-center justify-between">
                      <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${c.bg} transition-transform group-hover:scale-110`}>
                        <Icon className={`h-7 w-7 ${c.text}`} />
                      </div>
                      <span className="text-3xl font-bold text-gray-200">
                        {item.step}
                      </span>
                    </div>
                    <h3 className="mt-4 text-lg font-semibold text-gray-900">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-sm text-gray-500">{item.desc}</p>
                  </div>
                  {i < 3 && (
                    <div className="absolute -right-4 top-1/2 hidden -translate-y-1/2 text-gray-300 md:block">
                      <ArrowRight className="h-6 w-6" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Who We Serve */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
              Who We Serve
            </h2>
            <p className="mt-3 text-lg text-gray-500">
              Every role makes a difference in the fight against food waste
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              { icon: UtensilsCrossed, title: 'Donors', desc: 'Restaurants, hotels, event organizers, and households with surplus food.', points: ['Post food in seconds', 'Track pickup status', 'See your impact'], color: 'brand' },
              { icon: Bike, title: 'Volunteers', desc: 'Individuals who pick up surplus food and deliver it to those in need.', points: ['Browse nearby pickups', 'Accept & track tasks', 'Build your rescue record'], color: 'amber' },
              { icon: Building2, title: 'NGOs', desc: 'Organizations that receive rescued food for their community programs.', points: ['Find available food', 'Coordinate deliveries', 'Serve your community'], color: 'emerald' },
            ].map((item, i) => {
              const Icon = item.icon;
              const c = COLOR_MAP[item.color];
              return (
                <div
                  key={i}
                  className="card group p-8 animate-slide-up"
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <div className={`flex h-16 w-16 items-center justify-center rounded-2xl ${c.bg} transition-transform group-hover:scale-110`}>
                    <Icon className={`h-8 w-8 ${c.text}`} />
                  </div>
                  <h3 className="mt-5 text-xl font-bold text-gray-900">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm text-gray-500">{item.desc}</p>
                  <ul className="mt-4 space-y-2">
                    {item.points.map((point, j) => (
                      <li key={j} className="flex items-center gap-2 text-sm text-gray-600">
                        <CheckCircle2 className={`h-4 w-4 ${c.text}`} />
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-600 via-brand-700 to-emerald-800 py-20">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/4 top-0 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute right-1/4 bottom-0 h-64 w-64 rounded-full bg-amber-300/10 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">
            Ready to make a difference?
          </h2>
          <p className="mt-4 text-lg text-brand-100">
            Join thousands of donors, volunteers, and NGOs rescuing food every day.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              to="/auth"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-8 py-3.5 text-sm font-semibold text-brand-700 shadow-lg transition-all hover:bg-brand-50 hover:shadow-xl active:scale-[0.98]"
            >
              Get Started Free
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/impact"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white/10 px-8 py-3.5 text-sm font-semibold text-white ring-1 ring-inset ring-white/30 backdrop-blur-sm transition-all hover:bg-white/20 active:scale-[0.98]"
            >
              See Our Impact
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
