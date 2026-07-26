export interface OdooNotification {
  id: number;
  message: string;
  type: string;
  channel: string;
}

export class OdooBusClient {
  private wsUrl: string;
  private socket: WebSocket | null = null;
  private channels = new Set<string>();
  private listeners = new Set<(notifications: OdooNotification[]) => void>();
  private isClosedIntentional = false;
  private reconnectTimeout: any = null;
  private reconnectDelay = 1000;
  private maxReconnectDelay = 16000;

  constructor(endpoint: string) {
    const cleanEndpoint = endpoint.replace(/\/$/, '');
    this.wsUrl = cleanEndpoint
      .replace(/^http:/, 'ws:')
      .replace(/^https:/, 'wss:') + '/websocket';
  }

  get isConnected(): boolean {
    return this.socket !== null && this.socket.readyState === 1; // WebSocket.OPEN
  }

  connect() {
    this.isClosedIntentional = false;
    this.socket = new WebSocket(this.wsUrl);

    this.socket.onopen = () => {
      this.reconnectDelay = 1000;
      this.sendSubscription();
    };

    this.socket.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === 'notification' && Array.isArray(payload.notifications)) {
          this.dispatch(payload.notifications);
        }
      } catch (err) {
        // Skip unparseable frames
      }
    };

    this.socket.onclose = () => {
      this.socket = null;
      if (!this.isClosedIntentional) {
        this.scheduleReconnect();
      }
    };

    this.socket.onerror = () => {
      // Socket closing will trigger scheduleReconnect
    };
  }

  subscribe(channels: string[], callback: (notifications: OdooNotification[]) => void) {
    channels.forEach(ch => this.channels.add(ch));
    this.listeners.add(callback);

    if (this.isConnected) {
      this.sendSubscription();
    }
  }

  unsubscribe(callback: (notifications: OdooNotification[]) => void) {
    this.listeners.delete(callback);
  }

  close() {
    this.isClosedIntentional = true;
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }

  private sendSubscription() {
    if (!this.isConnected || this.channels.size === 0) return;
    this.socket!.send(JSON.stringify({
      event: 'subscribe',
      data: {
        channels: Array.from(this.channels),
        last: 0
      }
    }));
  }

  private dispatch(notifications: OdooNotification[]) {
    this.listeners.forEach(fn => fn(notifications));
  }

  private scheduleReconnect() {
    if (this.reconnectTimeout) return;
    this.reconnectTimeout = setTimeout(() => {
      this.reconnectTimeout = null;
      this.reconnectDelay = Math.min(this.reconnectDelay * 2, this.maxReconnectDelay);
      this.connect();
    }, this.reconnectDelay);
  }
}
