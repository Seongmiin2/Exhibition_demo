'use strict';

const { relayConfig } = require('./relay-config.cjs');
const { createRelayDriver } = require('./relay-driver-factory.cjs');
const { MockRelayDriver } = require('./relay-drivers/mock-relay-driver.cjs');

class RelayController {
  constructor(driver = createRelayDriver(relayConfig), config = relayConfig) {
    this.driver = driver;
    this.config = config;
    this.last = { product: 'EV', phase: 'idle' };
    this.lastError = null;
    this.pending = Promise.resolve();
  }

  outputsFor(product, phase) {
    const channels = [false, false, false, false];
    if (phase !== 'charging') return channels;
    const configuredChannel = this.config.channels?.[product];
    const channelIndex = Number(configuredChannel) - 1;
    if (channelIndex >= 0 && channelIndex < channels.length) channels[channelIndex] = true;
    return channels;
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
        try { await this.driver.allOff(); } catch {}
        throw error;
      }
      return this.getStatus();
    });
    return this.pending;
  }

  async allOff() { return this.setState({ product: this.last.product, phase: 'idle' }); }
  async initialize() { return this.allOff(); }
  getStatus() {
    const driverStatus = this.driver.getStatus();
    return {
      ...driverStatus,
      ...this.last,
      error: this.lastError || driverStatus.error
    };
  }
}

module.exports = { RelayController, MockRelayDriver, relayController: new RelayController() };
