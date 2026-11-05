export type GpsFix = {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
  speed: number | null;
};
export function haversineMeters(
  a: Pick<GpsFix, "latitude" | "longitude">,
  b: Pick<GpsFix, "latitude" | "longitude">,
) {
  const radians = (n: number) => (n * Math.PI) / 180;
  const dLat = radians(b.latitude - a.latitude),
    dLon = radians(b.longitude - a.longitude);
  const value =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(radians(a.latitude)) *
      Math.cos(radians(b.latitude)) *
      Math.sin(dLon / 2) ** 2;
  return (
    6371000 *
    2 *
    Math.atan2(Math.sqrt(value), Math.sqrt(Math.max(0, 1 - value)))
  );
}
export class GpsDistanceTracker {
  private previous: GpsFix | null = null;
  reset() {
    this.previous = null;
  }
  push(fix: GpsFix, receivedAt: number) {
    const invalid =
      ![fix.latitude, fix.longitude, fix.accuracy, fix.timestamp].every(
        Number.isFinite,
      ) ||
      Math.abs(fix.latitude) > 90 ||
      Math.abs(fix.longitude) > 180 ||
      fix.accuracy < 0 ||
      fix.accuracy > 40 ||
      Math.abs(receivedAt - fix.timestamp) > 10000;
    if (invalid) {
      this.reset();
      return {
        meters: 0,
        speedMps: null,
        message: "Waiting for a recent GPS fix with accuracy within 40 m.",
      };
    }
    const previous = this.previous;
    if (previous && fix.timestamp <= previous.timestamp)
      return {
        meters: 0,
        speedMps: null,
        message: "Waiting for a newer GPS fix.",
      };
    if (!previous || fix.timestamp - previous.timestamp > 20000) {
      this.previous = fix;
      return {
        meters: 0,
        speedMps: null,
        message: "GPS ready. Move to begin measuring distance.",
      };
    }
    const meters = haversineMeters(previous, fix);
    const seconds = (fix.timestamp - previous.timestamp) / 1000;
    const derivedSpeed = meters / seconds;
    if (
      derivedSpeed > 12 ||
      (fix.speed !== null &&
        (!Number.isFinite(fix.speed) || fix.speed > 12 || fix.speed < 0))
    ) {
      this.reset();
      return {
        meters: 0,
        speedMps: null,
        message: "GPS jump ignored. Reacquiring your position.",
      };
    }
    const threshold = Math.max(3, (previous.accuracy + fix.accuracy) * 0.15);
    if (meters < threshold)
      return {
        meters: 0,
        speedMps: fix.speed !== null && fix.speed >= 0 ? fix.speed : 0,
        message: "GPS tracking. Small position drift is filtered.",
      };
    this.previous = fix;
    return {
      meters,
      speedMps: fix.speed ?? derivedSpeed,
      message: "GPS tracking active.",
    };
  }
}
