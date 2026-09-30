import { Link } from 'react-router-dom';
import { HeartHandshake, Github, Mail } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div className="md:col-span-2">
            <Link to="/" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600">
                <HeartHandshake className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-bold text-gray-900">
                Food<span className="text-brand-600">Rescue</span>
              </span>
            </Link>
            <p className="mt-3 max-w-sm text-sm text-gray-500">
              Connecting restaurants, hotels, events and households with NGOs
              and volunteers so surplus food can be rescued instead of wasted.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-900">Platform</h4>
            <ul className="mt-3 space-y-2 text-sm">
              <li><Link to="/find-food" className="text-gray-500 hover:text-brand-600">Find Food</Link></li>
              <li><Link to="/donate-food" className="text-gray-500 hover:text-brand-600">Donate Food</Link></li>
              <li><Link to="/rescue-map" className="text-gray-500 hover:text-brand-600">Rescue Map</Link></li>
              <li><Link to="/volunteer" className="text-gray-500 hover:text-brand-600">Volunteer</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-900">About</h4>
            <ul className="mt-3 space-y-2 text-sm">
              <li><Link to="/impact" className="text-gray-500 hover:text-brand-600">Our Impact</Link></li>
              <li><Link to="/auth" className="text-gray-500 hover:text-brand-600">Sign In</Link></li>
              <li><a href="#" className="text-gray-500 hover:text-brand-600">Privacy</a></li>
              <li><a href="#" className="text-gray-500 hover:text-brand-600">Terms</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-gray-100 pt-6 sm:flex-row">
          <p className="text-sm text-gray-400">
            © {new Date().getFullYear()} FoodRescue. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-gray-400">
            <a href="#" className="hover:text-brand-600 transition-colors"><Github className="h-5 w-5" /></a>
            <a href="#" className="hover:text-brand-600 transition-colors"><Mail className="h-5 w-5" /></a>
          </div>
        </div>
      </div>
    </footer>
  );
}
