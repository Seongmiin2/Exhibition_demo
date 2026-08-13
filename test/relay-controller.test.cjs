'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { RelayController, MockRelayDriver } = require('../device/relay-controller.cjs');

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
    status() { return { driver: 'test', connected: false, channels: writes.at(-1) }; }
  };
  const relay = new RelayController(driver);
  await assert.rejects(relay.setState({ product: 'EV', phase: 'charging' }), /USB disconnected/);
  assert.deepEqual(writes.at(-1), [false, false, false, false]);
  assert.equal(relay.getStatus().phase, 'fault');
  assert.equal(relay.getStatus().error, 'USB disconnected');
});
