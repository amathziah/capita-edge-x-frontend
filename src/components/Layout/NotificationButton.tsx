import { useState, useRef, useEffect } from 'react';
import { Bell, X, Check, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { useNotifications } from '../../contexts/NotificationContext';
import { formatDistanceToNow } from 'date-fns';

export function NotificationButton() {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { notifications, unreadCount, markAllAsRead, markAsRead, removeNotification } = useNotifications();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return <Check className="w-4 h-4 text-green-600" />;
      case 'error': return <AlertCircle className="w-4 h-4 text-red-600" />;
      case 'warn': return <AlertTriangle className="w-4 h-4 text-amber-600" />;
      default: return <Info className="w-4 h-4 text-blue-600" />;
    }
  };

  const getColor = (type: string) => {
    switch (type) {
      case 'success': return 'bg-green-50 border-green-100';
      case 'error': return 'bg-red-50 border-red-100';
      case 'warn': return 'bg-amber-50 border-amber-100';
      default: return 'bg-blue-50 border-blue-100';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Button */}
      <button
        className="relative p-2 text-gray-600 hover:text-violet-600 focus:outline-none focus:ring-2 focus:ring-violet-500 rounded-full transition"
        onClick={() => setOpen(!open)}
        aria-label="Notifications"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 inline-flex items-center justify-center h-4 w-4 text-[10px] font-bold text-white bg-red-500 rounded-full ring-2 ring-white animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 mt-2 w-80 md:w-96 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
            <h3 className="font-semibold text-gray-900">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-primary hover:text-primary-dark font-medium transition-colors"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-[60vh] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500 flex flex-col items-center">
                <Bell className="w-8 h-8 text-gray-300 mb-2" />
                <p className="text-sm">No notifications yet</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`relative group p-4 transition-colors ${notif.read ? 'bg-white' : 'bg-blue-50/30'}`}
                    onClick={() => markAsRead(notif.id)}
                  >
                    <div className="flex gap-3">
                      <div className={`mt-0.5 shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${getColor(notif.type)}`}>
                        {getIcon(notif.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm ${notif.read ? 'text-gray-600' : 'text-gray-900 font-medium'}`}>
                          {notif.message}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {formatDistanceToNow(notif.timestamp, { addSuffix: true })}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeNotification(notif.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-all self-start"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
