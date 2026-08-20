'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { RelayController, MockRelayDriver } = require('../device/relay-controller.cjs');
const { createRelayDriver } = require('../device/relay-driver-factory.cjs');
const { SerialRelayDriver } = require('../device/relay-drivers/serial-relay-driver.cjs');
const { HidRelayDriver } = require('../device/relay-drivers/hid-relay-driver.cjs');

test('only the EV charging channel is on during EV charging', async () => {
  const relay = new RelayController(new MockRelayDriver());
  for (const phase of ['idle', 'detected', 'aligning', 'ready', 'complete', 'fault']) {
    await relay.setState({ product: 'EV', phase });
    assert.deepEqual(relay.getStatus().channels, [false, false, false, false]);
  }
  await relay.setState({ product: 'EV', phase: 'charging' });
  assert.deepEqual(relay.getStatus().channels, [false, true, false, false]);
});

test('only the AMR charging channel is on during AMR charging', async () => {
  const relay = new RelayController(new MockRelayDriver());
  for (const phase of ['idle', 'complete', 'fault']) {
    await relay.setState({ product: 'AMR', phase });
    assert.deepEqual(relay.getStatus().channels, [false, false, false, false]);
  }
  await relay.setState({ product: 'AMR', phase: 'charging' });
  assert.deepEqual(relay.getStatus().channels, [false, false, false, true]);
  await relay.allOff();
  assert.deepEqual(relay.getStatus().channels, [false, false, false, false]);
});

test('invalid input fails safe to idle EV outputs', async () => {
  const relay = new RelayController(new MockRelayDriver());
  await relay.setState({ product: 'unknown', phase: 'unknown' });
  assert.equal(relay.getStatus().phase, 'idle');
  assert.deepEqual(relay.getStatus().channels, [false, false, false, false]);
});

test('driver failure records a fault and attempts all-off', async () => {
  const writes = [];
  const driver = {
    async write(channels) {
      writes.push([...channels]);
      if (writes.length === 1) throw new Error('USB disconnected');
    },
    async allOff() { writes.push([false, false, false, false]); },
    getStatus() {
      return {
        driver: 'test',
        connected: false,
        simulated: false,
        device: { name: null, port: null, vendorId: null, productId: null },
        channels: writes.at(-1) || [false, false, false, false],
        error: null
      };
    }
  };
  const relay = new RelayController(driver);
  await assert.rejects(relay.setState({ product: 'EV', phase: 'charging' }), /USB disconnected/);
  assert.deepEqual(writes.at(-1), [false, false, false, false]);
  assert.equal(relay.getStatus().phase, 'fault');
  assert.equal(relay.getStatus().error, 'USB disconnected');
});

test('factory creates the configured relay driver type', () => {
  assert.equal(createRelayDriver({ mode: 'mock' }).getStatus().driver, 'mock');
  assert.equal(createRelayDriver({ mode: 'serial', serial: {} }).getStatus().driver, 'serial');
  assert.equal(createRelayDriver({ mode: 'hid', hid: {} }).getStatus().driver, 'hid');
  assert.throws(() => createRelayDriver({ mode: 'unknown' }), /Unsupported relay mode/);
});

test('serial skeleton fails safe without creating a vendor command', async () => {
  const driver = new SerialRelayDriver({ port: 'COM4', baudRate: 9600 });
  await assert.rejects(driver.write([false, true, false, false]), /TODO\(HARDWARE\): Serial relay vendor protocol is not configured/);
  assert.deepEqual(driver.getStatus().channels, [false, false, false, false]);
});

test('hid skeleton fails safe without creating a vendor report', async () => {
  const driver = new HidRelayDriver({ vendorId: 0x0000, productId: 0x0000 });
  await assert.rejects(driver.write([false, false, false, true]), /TODO\(HARDWARE\): HID relay vendor protocol is not configured/);
  assert.deepEqual(driver.getStatus().channels, [false, false, false, false]);
});
