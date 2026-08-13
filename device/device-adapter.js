/**
 * LIVE MODE integration contract.
 * Implement connect/disconnect/subscribe in a site-specific adapter and map
 * charger payloads to this normalized snapshot. The exhibition UI remains
 * independent from CAN, RS-485, Ethernet, WebSocket or local REST transports.
 */
export class DeviceAdapter {
  async connect() { throw new Error('DeviceAdapter.connect() is not implemented'); }
  async disconnect() {}
  subscribe(_listener) { return () => {}; }
}

export const emptySnapshot = Object.freeze({
  battery_soc: 0, charging_power_kw: 0, efficiency_percent: 0,
  pad_temperature_c: 0, elapsed_time_sec: 0, estimated_remaining_time_sec: 0,
  alignment_left_right_percent: 0, alignment_front_back_percent: 0,
  pad_gap_mm: 0, fod_status: 'unknown', communication_status: 'disconnected',
  charger_status: 'standby'
});
