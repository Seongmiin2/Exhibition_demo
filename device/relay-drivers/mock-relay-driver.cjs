'use strict';

const { BaseRelayDriver } = require('./base-relay-driver.cjs');

class MockRelayDriver extends BaseRelayDriver {
  constructor() {
    super({ name: 'mock', simulated: true });
  }

  async connect() {
    this.connected = false;
    this.error = null;
    return this.getStatus();
  }

  async write(channels) {
    this.channels = [...channels];
    this.error = null;
    return this.getStatus();
  }
}

module.exports = { MockRelayDriver };
