import { VaultEvent } from '../types';

/**
 * Event monitoring utilities - Subscribe to vault events
 */

export type EventCallback = (event: VaultEvent) => void;

export class EventMonitor {
  private listeners: Map<string, Set<EventCallback>> = new Map();
  private wsConnection: WebSocket | null = null;

  constructor(private wsUrl: string) {}

  /**
   * Connect to event stream
   */
  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.wsConnection = new WebSocket(this.wsUrl);

      this.wsConnection.onopen = () => {
        resolve();
      };

      this.wsConnection.onerror = (error) => {
        reject(error);
      };

      this.wsConnection.onmessage = (message) => {
        try {
          const event: VaultEvent = JSON.parse(message.data);
          this.emitEvent(event);
        } catch (error) {
          console.error('Failed to parse event:', error);
        }
      };
    });
  }

  /**
   * Subscribe to events for a specific vault
   */
  subscribe(vaultId: string, callback: EventCallback): () => void {
    if (!this.listeners.has(vaultId)) {
      this.listeners.set(vaultId, new Set());
    }

    this.listeners.get(vaultId)!.add(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.listeners.get(vaultId);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.listeners.delete(vaultId);
        }
      }
    };
  }

  /**
   * Subscribe to all events
   */
  subscribeAll(callback: EventCallback): () => void {
    return this.subscribe('*', callback);
  }

  /**
   * Disconnect from event stream
   */
  disconnect(): void {
    if (this.wsConnection) {
      this.wsConnection.close();
      this.wsConnection = null;
    }
    this.listeners.clear();
  }

  private emitEvent(event: VaultEvent): void {
    // Emit to vault-specific listeners
    const vaultListeners = this.listeners.get(event.vaultId);
    if (vaultListeners) {
      vaultListeners.forEach(callback => callback(event));
    }

    // Emit to global listeners
    const globalListeners = this.listeners.get('*');
    if (globalListeners) {
      globalListeners.forEach(callback => callback(event));
    }
  }
}
