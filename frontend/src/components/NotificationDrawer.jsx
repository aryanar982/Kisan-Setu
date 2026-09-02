import React from 'react';
import { Bell, CheckCheck, X, MessageSquare, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { api } from '../api';

export default function NotificationDrawer({ isOpen, onClose, notifications = [], onRefresh }) {
  if (!isOpen) return null;

  const handleMarkRead = async (id) => {
    try {
      await api.markNotificationRead(id);
      if (onRefresh) onRefresh();
    } catch (e) {
      console.error(e);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      if (onRefresh) onRefresh();
    } catch (e) {
      console.error(e);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'PAYMENT_COMPLETE':
      case 'PROCUREMENT_COMPLETE':
        return <CheckCircle className="w-5 h-5 text-emerald" />;
      case 'QUEUE_STARTED':
      case 'TOKEN_NEAR':
        return <AlertTriangle className="w-5 h-5 text-gold" />;
      default:
        return <Info className="w-5 h-5 text-blue" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col border-l border-border">
        {/* Header */}
        <div className="p-4 bg-[#1F2E22] text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-gold" />
            <h3 className="font-serif font-bold text-base">Mandi Alerts & SMS</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleMarkAllRead}
              className="text-xs text-sage-light hover:text-white flex items-center gap-1 transition-colors"
            >
              <CheckCheck className="w-4 h-4" /> Mark all read
            </button>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {notifications.length === 0 ? (
            <div className="text-center py-12 text-ink/50 space-y-2">
              <MessageSquare className="w-10 h-10 mx-auto opacity-40 text-sage" />
              <p className="text-sm">No new notifications</p>
              <p className="text-xs text-ink/40">Real-time alerts for queue status, weighing, and DBT credits appear here.</p>
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n._id}
                onClick={() => !n.read && handleMarkRead(n._id)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                  n.read
                    ? 'bg-white border-border/70 text-ink/80'
                    : 'bg-[#FFF8EB] border-gold/40 text-ink shadow-sm'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">{getIcon(n.type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-sm font-semibold truncate">{n.title}</h4>
                      <span className="text-[10px] text-ink/40 whitespace-nowrap">
                        {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs text-ink/70 mt-1 leading-relaxed">{n.message}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-black/5 text-ink/60">
                        {n.channel === 'all' ? 'SMS + App' : n.channel}
                      </span>
                      {!n.read && (
                        <span className="w-2 h-2 rounded-full bg-gold animate-pulse"></span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
