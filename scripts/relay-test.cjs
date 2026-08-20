'use strict';

const { RelayController } = require('../device/relay-controller.cjs');
const { relayConfig } = require('../device/relay-config.cjs');
const { createRelayDriver } = require('../device/relay-driver-factory.cjs');

const command = process.argv[2] || 'status';
const controller = new RelayController(createRelayDriver(relayConfig), relayConfig);

const labels = {
  status: 'STATUS',
  'all-off': 'ALL OFF',
  'ev-charge': 'EV CHARGING',
  'ev-off': 'EV OFF',
  'amr-charge': 'AMR CHARGING',
  'amr-off': 'AMR OFF'
};

const formatChannels = (channels) => `[${channels.map((value) => value ? 'ON' : 'OFF').join(', ')}]`;

async function run() {
  if (!labels[command]) {
    console.error(`Unknown command: ${command}`);
    console.error('Usage: node scripts/relay-test.cjs status|all-off|ev-charge|ev-off|amr-charge|amr-off');
    process.exitCode = 1;
    return;
  }

  const before = controller.getStatus();
  let after = before;
  try {
    if (command === 'all-off') after = await controller.allOff();
    if (command === 'ev-charge') after = await controller.setState({ product: 'EV', phase: 'charging' });
    if (command === 'ev-off') after = await controller.setState({ product: 'EV', phase: 'idle' });
    if (command === 'amr-charge') after = await controller.setState({ product: 'AMR', phase: 'charging' });
    if (command === 'amr-off') after = await controller.setState({ product: 'AMR', phase: 'idle' });
  } catch (error) {
    after = controller.getStatus();
    console.error('Hardware protocol is not configured.');
    console.error('No command was sent.');
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }

  console.log(`Driver: ${after.driver}`);
  console.log(`Simulated: ${after.simulated}`);
  console.log('');
  console.log('Before:');
  console.log(formatChannels(before.channels));
  console.log('');
  console.log('Command:');
  console.log(labels[command]);
  console.log('');
  console.log('After:');
  console.log(formatChannels(after.channels));
  if (after.error) {
    console.log('');
    console.log(`Error: ${after.error}`);
  }
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
