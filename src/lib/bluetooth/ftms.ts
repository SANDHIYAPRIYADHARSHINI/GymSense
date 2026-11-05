// Bluetooth SIG GATT Supplement, Treadmill Data 0x2ACD, little-endian fields.
export const FTMS_SERVICE = 0x1826;
export const TREADMILL_DATA = 0x2acd;
export type TreadmillTelemetry = {
  speedKph?: number;
  averageSpeedKph?: number;
  inclinePercent?: number;
  distanceMeters?: number;
  elapsedSeconds?: number;
};
export function parseTreadmillData(view: DataView): TreadmillTelemetry {
  let offset = 0;
  function need(bytes: number) {
    if (offset + bytes > view.byteLength)
      throw new RangeError("Truncated FTMS treadmill data");
  }
  function u8() {
    need(1);
    return view.getUint8(offset++);
  }
  function u16() {
    need(2);
    const value = view.getUint16(offset, true);
    offset += 2;
    return value;
  }
  function i16() {
    need(2);
    const value = view.getInt16(offset, true);
    offset += 2;
    return value;
  }
  function skip(bytes: number) {
    need(bytes);
    offset += bytes;
  }
  const flags = u16();
  const result: TreadmillTelemetry = {};
  if (!(flags & 1)) {
    const value = u16();
    if (value !== 0xffff) result.speedKph = value / 100;
  }
  if (flags & 2) {
    const value = u16();
    if (value !== 0xffff) result.averageSpeedKph = value / 100;
  }
  if (flags & 4) result.distanceMeters = u8() + (u16() << 8);
  if (flags & 8) {
    const value = i16();
    if (value !== 0x7fff) result.inclinePercent = value / 10;
    skip(2);
  }
  if (flags & 16) skip(4);
  if (flags & 32) skip(1);
  if (flags & 64) skip(1);
  if (flags & 128) skip(5);
  if (flags & 256) skip(1);
  if (flags & 512) skip(1);
  if (flags & 1024) result.elapsedSeconds = u16();
  if (flags & 2048) skip(2);
  if (flags & 4096) skip(4);
  return result;
}
