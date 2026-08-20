'use strict';

const { BaseRelayDriver } = require('./base-relay-driver.cjs');

class SerialRelayDriver extends BaseRelayDriver {
  constructor(options = {}) {
    super({
      name: 'serial',
      simulated: false,
      device: { port: options.port || null }
    });
    this.options = {
      port: options.port || null,
      baudRate: options.baudRate || null,
      dataBits: options.dataBits || 8,
      stopBits: options.stopBits || 1,
      parity: options.parity || 'none'
    };
    this.portHandle = null;
  }

  async connect() {
    let SerialPort;
    try {
      ({ SerialPort } = require('serialport'));
    } catch {
      this.connected = false;
      this.error = 'Serial relay driver requires serialport. Install it after hardware type is confirmed. No hardware command was sent.';
      throw new Error(this.error);
    }
    if (!this.options.port) {
      this.connected = false;
      this.error = 'TODO(HARDWARE): Serial relay COM port is not configured.';
      throw new Error(this.error);
    }
    this.portHandle = new SerialPort({ ...this.options, path: this.options.port, autoOpen: false });
    await new Promise((resolve, reject) => this.portHandle.open((error) => error ? reject(error) : resolve()));
    this.connected = true;
    this.error = null;
    return this.getStatus();
  }

  buildRelayCommand(_channels) {
    throw new Error('TODO(HARDWARE): Serial relay vendor protocol is not configured.');
  }

  async write(channels) {
    let command;
    try {
      command = this.buildRelayCommand(channels);
    } catch (error) {
      this.error = error instanceof Error ? error.message : String(error);
      throw error;
    }
    if (!this.connected) await this.connect();
    await new Promise((resolve, reject) => this.portHandle.write(command, (error) => error ? reject(error) : resolve()));
    this.channels = [...channels];
    this.error = null;
    return this.getStatus();
  }

  async disconnect() {
    if (this.portHandle?.isOpen) {
      await new Promise((resolve) => this.portHandle.close(() => resolve()));
    }
    await super.disconnect();
  }
}

module.exports = { SerialRelayDriver };
