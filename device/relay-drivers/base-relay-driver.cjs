'use strict';

class BaseRelayDriver {
  constructor(options = {}) {
    this.name = options.name || 'base';
    this.connected = false;
    this.simulated = Boolean(options.simulated);
    this.device = {
      name: options.device?.name || null,
      port: options.device?.port || null,
      vendorId: options.device?.vendorId ?? null,
      productId: options.device?.productId ?? null
    };
    this.channels = [false, false, false, false];
    this.error = null;
  }

  async connect() {
    throw new Error('BaseRelayDriver.connect() is not implemented');
  }

  async disconnect() {
    this.connected = false;
  }

  async write(_channels) {
    throw new Error('BaseRelayDriver.write() is not implemented');
  }

  async allOff() {
    return this.write([false, false, false, false]);
  }

  getStatus() {
    return {
      driver: this.name,
      connected: this.connected,
      simulated: this.simulated,
      device: { ...this.device },
      channels: [...this.channels],
      error: this.error
    };
  }
}

module.exports = { BaseRelayDriver };
