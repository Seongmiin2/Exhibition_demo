'use strict';

const { MockRelayDriver } = require('./relay-drivers/mock-relay-driver.cjs');
const { SerialRelayDriver } = require('./relay-drivers/serial-relay-driver.cjs');
const { HidRelayDriver } = require('./relay-drivers/hid-relay-driver.cjs');

function createRelayDriver(config = {}) {
  const mode = config.mode || 'mock';
  if (mode === 'mock') return new MockRelayDriver(config);
  if (mode === 'serial') return new SerialRelayDriver(config.serial || {});
  if (mode === 'hid') return new HidRelayDriver(config.hid || {});
  throw new Error(`Unsupported relay mode: ${mode}`);
}

module.exports = { createRelayDriver };
