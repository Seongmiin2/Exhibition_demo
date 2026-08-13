'use strict';

/**
 * Safe USB I/O boundary for the exhibition mock-up.
 *
 * The default driver is intentionally "mock": it records the requested output
 * without touching hardware. Replace MockRelayDriver with the vendor-specific
 * USB relay/HID/serial commands after the purchased model is confirmed.
 * Channel assignment: 2=EV charging, 4=AMR charging.
 * Channels 1 and 3 are reserved. The exhibition specification requires every
 * output to remain off except while the corresponding product is charging.
 */
class MockRelayDriver {
  constructor() { this.channels = [false, false, false, false]; }
  async write(channels) { this.channels = [...channels]; }
  status() { return { driver: 'mock', connected: false, channels: [...this.channels] }; }
}

class RelayController {
  constructor(driver = new MockRelayDriver()) {
    this.driver = driver;
    this.last = { product: 'EV', phase: 'idle' };
    this.lastError = null;
    this.pending = Promise.resolve();
  }

  outputsFor(product, phase) {
    const charging = phase === 'charging';
    return product === 'AMR'
      ? [false, false, false, charging]
      : [false, charging, false, false];
  }

  async setState(payload = {}) {
    const product = payload.product === 'AMR' ? 'AMR' : 'EV';
    const allowed = ['idle', 'detected', 'aligning', 'ready', 'charging', 'complete', 'fault'];
    const phase = allowed.includes(payload.phase) ? payload.phase : 'idle';
    const channels = this.outputsFor(product, phase);
    this.pending = this.pending.catch(() => {}).then(async () => {
      try {
        await this.driver.write(channels);
        this.last = { product, phase };
        this.lastError = null;
      } catch (error) {
        this.last = { product, phase: 'fault' };
        this.lastError = error instanceof Error ? error.message : String(error);
        try { await this.driver.write([false, false, false, false]); } catch {}
        throw error;
      }
      return this.getStatus();
    });
    return this.pending;
  }

  async allOff() { return this.setState({ product: this.last.product, phase: 'idle' }); }
  async initialize() { return this.allOff(); }
  getStatus() { return { ...this.driver.status(), ...this.last, error: this.lastError }; }
}

module.exports = { RelayController, MockRelayDriver, relayController: new RelayController() };
