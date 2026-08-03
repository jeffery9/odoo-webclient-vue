import { describe, test, expect, vi, beforeAll, afterAll } from 'vitest';
import { OdooBusClient } from '../../src/bus/client.js';

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
    await new Promise(resolve => setTimeout(resolve, 15));

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
