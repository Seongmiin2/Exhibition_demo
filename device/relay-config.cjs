'use strict';

const toNumberOrNull = (value) => {
  if (value === undefined || value === null || value === '') return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

const relayConfig = {
  mode: process.env.WIP_RELAY_MODE || 'mock',
  serial: {
    port: process.env.WIP_RELAY_PORT || null,
    baudRate: toNumberOrNull(process.env.WIP_RELAY_BAUD),
    dataBits: toNumberOrNull(process.env.WIP_RELAY_DATA_BITS) || 8,
    stopBits: toNumberOrNull(process.env.WIP_RELAY_STOP_BITS) || 1,
    parity: process.env.WIP_RELAY_PARITY || 'none'
  },
  hid: {
    vendorId: toNumberOrNull(process.env.WIP_RELAY_VENDOR_ID),
    productId: toNumberOrNull(process.env.WIP_RELAY_PRODUCT_ID),
    usagePage: toNumberOrNull(process.env.WIP_RELAY_USAGE_PAGE),
    usage: toNumberOrNull(process.env.WIP_RELAY_USAGE),
    reportId: toNumberOrNull(process.env.WIP_RELAY_REPORT_ID)
  },
  channels: {
    EV: 2,
    AMR: 4
  }
};

module.exports = { relayConfig };
