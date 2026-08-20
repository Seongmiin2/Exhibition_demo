'use strict';

const { BaseRelayDriver } = require('./base-relay-driver.cjs');

class HidRelayDriver extends BaseRelayDriver {
  constructor(options = {}) {
    super({
      name: 'hid',
      simulated: false,
      device: {
        vendorId: options.vendorId ?? null,
        productId: options.productId ?? null
      }
    });
    this.options = {
      vendorId: options.vendorId ?? null,
      productId: options.productId ?? null,
      usagePage: options.usagePage ?? null,
      usage: options.usage ?? null,
      reportId: options.reportId ?? null
    };
    this.deviceHandle = null;
  }

  async connect() {
    let HID;
    try {
      HID = require('node-hid');
    } catch {
      this.connected = false;
      this.error = 'HID relay driver requires node-hid. Install it after hardware type is confirmed. No hardware command was sent.';
      throw new Error(this.error);
    }
    if (this.options.vendorId === null || this.options.productId === null) {
      this.connected = false;
      this.error = 'TODO(HARDWARE): HID relay VID/PID is not configured.';
      throw new Error(this.error);
    }
    this.deviceHandle = new HID.HID(this.options.vendorId, this.options.productId);
    this.connected = true;
    this.error = null;
    return this.getStatus();
  }

  buildHidReport(_channels) {
    throw new Error('TODO(HARDWARE): HID relay vendor protocol is not configured.');
  }

  async write(channels) {
    let report;
    try {
      report = this.buildHidReport(channels);
    } catch (error) {
      this.error = error instanceof Error ? error.message : String(error);
      throw error;
    }
    if (!this.connected) await this.connect();
    this.deviceHandle.write(report);
    this.channels = [...channels];
    this.error = null;
    return this.getStatus();
  }

  async disconnect() {
    if (this.deviceHandle) this.deviceHandle.close();
    this.deviceHandle = null;
    await super.disconnect();
  }
}

module.exports = { HidRelayDriver };
