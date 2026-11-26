'use client';

import React, { useEffect, useSyncExternalStore } from 'react';
import { WifiOff } from 'lucide-react';

function subscribeOnline(callback: () => void) {
  window.addEventListener('online', callback);
  window.addEventListener('offline', callback);
  return () => {
    window.removeEventListener('online', callback);
    window.removeEventListener('offline', callback);
  };
}

function getOnlineSnapshot(): boolean {
  return typeof navigator !== 'undefined' ? navigator.onLine : true;
}

export default function PWARegister() {
  const isOnline = useSyncExternalStore(subscribeOnline, getOnlineSnapshot, () => true);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // Ignore registration errors in restricted preview frames
      });
    }
  }, []);

  if (isOnline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-full bg-[var(--gb-elevated)] border border-[var(--gb-border)] px-3.5 py-2 text-xs font-medium text-[var(--gb-text)] shadow-lg"
    >
      <WifiOff className="size-3.5 text-[var(--gb-muted)]" />
      <span>Offline mode: drafts stay saved locally</span>
    </div>
  );
}
