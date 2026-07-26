# Odoo WebSocket Bus Support Implementation Plan

**Goal:** Implement a high-performance, type-safe, auto-reconnecting Odoo-native WebSocket client in `@odoo/sdk` and integrate it with layout notifications in `apps/web-client`.

**Architecture:**
1. **OdooBusClient (`packages/sdk/src/bus/client.ts`):** Wraps standard browser `WebSocket` API, converting HTTP endpoints to WS/WSS protocols, supporting channel subscriptions, exp-backoff reconnects, and standard JSON message dispatching.
2. **Live Integration:** Connect `OdooBusClient` during login to `/websocket`, subscribe to channels (`res.partner`), and push live messages into navbar `notifications` ref upon incoming WS payloads.

---

### Task 1: Scaffolding Odoo WebSocket Bus Client inside SDK

**Files:**
* Create: `packages/sdk/src/bus/client.ts`
* Create: `packages/sdk/src/bus/index.ts`
* Modify: `packages/sdk/src/index.ts`

- [ ] **Step 1.1: Implement OdooBusClient**

Write `packages/sdk/src/bus/client.ts`:
```typescript
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
    return this.socket !== null && this.socket.readyState === WebSocket.OPEN;
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
```

- [ ] **Step 1.2: Setup module exports**

Write `packages/sdk/src/bus/index.ts`:
```typescript
export * from './client.js';
```

Modify `packages/sdk/src/index.ts` to export `bus` module:
```typescript
export * from './bus/index.js';
```

---

### Task 2: Writing SDK WebSockets Bus Tests

**Files:**
* Create: `packages/sdk/src/bus/client.test.ts`

- [ ] **Step 2.1: Write OdooBusClient tests**

Create `packages/sdk/src/bus/client.test.ts` utilizing mock WebSocket:
```typescript
import { describe, test, expect, vi, beforeAll, afterAll } from 'vitest';
import { OdooBusClient } from './client.js';

// Setup Mock WebSocket for node execution environments
class MockWebSocket {
  static instances: MockWebSocket[] = [];
  url: string;
  readyState = 0; // CONNECTING
  sentMessages: string[] = [];
  onopen: (() => void) | null = null;
  onmessage: ((event: { data: string }) => void) | null = null;
  onclose: (() => void) | null = null;

  constructor(url: string) {
    this.url = url;
    MockWebSocket.instances.push(this);
    setTimeout(() => {
      this.readyState = 1; // OPEN
      if (this.onopen) this.onopen();
    }, 5);
  }

  send(msg: string) {
    this.sentMessages.push(msg);
  }

  close() {
    this.readyState = 3; // CLOSED
    if (this.onclose) this.onclose();
  }

  triggerMessage(data: string) {
    if (this.onmessage) this.onmessage({ data });
  }
}

describe('OdooBusClient WebSocket Service', () => {
  beforeAll(() => {
    vi.stubGlobal('WebSocket', MockWebSocket);
  });

  afterAll(() => {
    vi.unstubAllGlobals();
  });

  test('should establish websocket URL and transmit subscription frames', async () => {
    MockWebSocket.instances = [];
    const client = new OdooBusClient('http://localhost:8069');
    client.connect();

    // Wait for connection simulation
    await new Promise(resolve => setTimeout(resolve, 10));

    expect(client.isConnected).toBe(true);
    expect(MockWebSocket.instances.length).toBe(1);
    expect(MockWebSocket.instances[0].url).toBe('ws://localhost:8069/websocket');

    const callbackSpy = vi.fn();
    client.subscribe(['res.partner', 'mail.channel'], callbackSpy);

    expect(MockWebSocket.instances[0].sentMessages.length).toBe(1);
    const frame = JSON.parse(MockWebSocket.instances[0].sentMessages[0]);
    expect(frame.event).toBe('subscribe');
    expect(frame.data.channels).toContain('res.partner');

    // Simulate incoming server notification
    MockWebSocket.instances[0].triggerMessage(JSON.stringify({
      type: 'notification',
      notifications: [
        { id: 1001, message: 'Partner record 42 updated', type: 'orm_change', channel: 'res.partner' }
      ]
    }));

    expect(callbackSpy).toHaveBeenCalledWith([
      { id: 1001, message: 'Partner record 42 updated', type: 'orm_change', channel: 'res.partner' }
    ]);

    client.close();
    expect(client.isConnected).toBe(false);
  });
});
```

---

### Task 3: Integrating WebSockets with layout notifications in `apps/web-client`

**Files:**
* Modify: `apps/web-client/src/auth/state.ts`

- [ ] **Step 3.1: Connect and subscribe to dynamic notification bus on user connection**

Import `OdooBusClient` and handle connect triggers inside `apps/web-client/src/auth/state.ts`:
```typescript
import { OdooBusClient } from '@odoo/sdk';

export const activeBusClient = ref<OdooBusClient | null>(null);

// Inside handleConnect after successful login:
const bus = new OdooBusClient(hostUrl.value);
bus.connect();
bus.subscribe(['res.partner', 'mail.channel'], (events) => {
  events.forEach(evt => {
    addNotification(`[Live Bus] ${evt.message}`, 'info');
  });
});
activeBusClient.value = bus;

// Inside handleDisconnectCleanup:
if (activeBusClient.value) {
  activeBusClient.value.close();
  activeBusClient.value = null;
}
```

---

### Task 4: Verification & Build

- [ ] **Step 4.1: Compile all monorepo packages**
- [ ] **Step 4.2: Run test suite**
