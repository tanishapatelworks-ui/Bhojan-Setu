import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Check } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import type { Notification } from '@/types';
import { formatRelativeTime } from '@/lib/constants';

export function NotificationBell() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchNotifications();
        }
      )
      .subscribe();

    const fetchNotifications = async () => {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);
      if (data) {
        setNotifications(data as Notification[]);
        setUnreadCount(data.filter((n) => !n.is_read).length);
      }
    };

    fetchNotifications();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const markAllRead = async () => {
    if (!user) return;
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
  };

  if (!user) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative rounded-xl p-2.5 text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-coral-500 px-1 text-[10px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-full z-50 mt-2 w-80 max-w-[calc(100vw-2rem)] origin-top-right animate-scale-in">
            <div className="overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-gray-200">
              <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                <h3 className="text-sm font-semibold text-gray-900">
                  Notifications
                </h3>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700"
                  >
                    <Check className="h-3.5 w-3.5" />
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="px-4 py-8 text-center text-sm text-gray-400">
                    No notifications yet
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`flex gap-3 border-b border-gray-50 px-4 py-3 transition-colors hover:bg-gray-50 ${
                        !n.is_read ? 'bg-brand-50/40' : ''
                      }`}
                    >
                      <div
                        className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                          n.is_read ? 'bg-transparent' : 'bg-brand-500'
                        }`}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-gray-700">{n.message}</p>
                        <p className="mt-0.5 text-xs text-gray-400">
                          {formatRelativeTime(n.created_at)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <button
                onClick={() => {
                  setOpen(false);
                  navigate('/dashboard');
                }}
                className="w-full border-t border-gray-100 px-4 py-2.5 text-center text-xs font-medium text-brand-600 hover:bg-brand-50"
              >
                View all in dashboard
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
