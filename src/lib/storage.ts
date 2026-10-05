/**
 * Safe LocalStorage Utilities with QuotaExceededError recovery and auto-pruning.
 * Prevents unhandled QuotaExceededError exceptions that crash React ErrorBoundaries.
 */

export function safeStorageGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch (err) {
    console.warn(`[SafeStorage] Failed to read "${key}":`, err);
    return null;
  }
}

export function safeStorageRemove(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch (err) {
    console.warn(`[SafeStorage] Failed to remove "${key}":`, err);
  }
}

export function safeStorageSet(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (err: any) {
    console.warn(`[SafeStorage] Initial setItem failed for "${key}":`, err?.message || err);

    // Check if error is QuotaExceededError
    const isQuotaError =
      err?.name === 'QuotaExceededError' ||
      err?.code === 22 ||
      err?.code === 1014 ||
      err?.number === -2147024882 ||
      (typeof err?.message === 'string' && err.message.toLowerCase().includes('quota'));

    if (isQuotaError) {
      try {
        console.warn(`[SafeStorage] Quota exceeded. Pruning non-essential cache to free storage...`);

        // If the key itself is notifications, prune to the latest 20 items immediately
        if (key === 'ddb_admin_notifications') {
          try {
            const parsed = JSON.parse(value);
            if (Array.isArray(parsed) && parsed.length > 20) {
              const pruned = parsed.slice(0, 20).map((n: any) => ({
                id: n.id,
                title: n.title,
                message: typeof n.message === 'string' && n.message.length > 150 ? n.message.slice(0, 150) + '...' : n.message,
                timestamp: n.timestamp,
                formattedTime: n.formattedTime,
                type: n.type,
                read: n.read,
                tenantId: n.tenantId,
                repName: n.repName
              }));
              localStorage.setItem(key, JSON.stringify(pruned));
              return true;
            }
          } catch (_) {}
        }

        // Prune or clear non-critical keys to free space
        const prunableKeys = [
          'ddb_admin_notifications',
          'ddb_audit_logs',
          'pharmatrack_visits',
          'pharmatrack_orders'
        ];

        for (const pruneKey of prunableKeys) {
          if (pruneKey !== key) {
            try {
              const item = localStorage.getItem(pruneKey);
              if (item) {
                const parsed = JSON.parse(item);
                if (Array.isArray(parsed) && parsed.length > 15) {
                  // Keep only top 15 newest items
                  localStorage.setItem(pruneKey, JSON.stringify(parsed.slice(0, 15)));
                } else if (pruneKey === 'ddb_admin_notifications') {
                  localStorage.removeItem(pruneKey);
                }
              }
            } catch (_) {
              localStorage.removeItem(pruneKey);
            }
          }
        }

        // Retry saving target key
        localStorage.setItem(key, value);
        return true;
      } catch (retryErr: any) {
        console.warn(`[SafeStorage] Retry setItem failed for "${key}". Attempting fallback compression...`, retryErr);

        // If it's a list, try truncating to first 10 items
        try {
          const parsed = JSON.parse(value);
          if (Array.isArray(parsed)) {
            const compact = parsed.slice(0, 10);
            localStorage.setItem(key, JSON.stringify(compact));
            return true;
          }
        } catch (_) {}

        // Fallback: Swallow error gracefully so React never crashes
        return false;
      }
    }

    return false;
  }
}
