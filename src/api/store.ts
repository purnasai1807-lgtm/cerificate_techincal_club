import { AppNotification } from '../types';

/**
 * UI-only in-memory event store.
 *
 * Authoritative application data is NEVER stored here. Participants,
 * certificates, templates, settings, imports, email logs and audit logs are
 * loaded from the authenticated backend API and persisted by the server.
 */
class UiStore {
  private notifications: AppNotification[] = [];
  private listeners = new Set<() => void>();

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    for (const listener of this.listeners) {
      try { listener(); } catch (error) { console.error('UI store listener error', error); }
    }
  }

  getNotifications(): AppNotification[] {
    return [...this.notifications];
  }

  saveNotifications(data: AppNotification[]) {
    this.notifications = [...data];
    this.notify();
  }
}

export const store = new UiStore();
