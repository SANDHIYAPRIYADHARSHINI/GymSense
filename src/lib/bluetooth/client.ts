import {
  FTMS_SERVICE,
  parseTreadmillData,
  TREADMILL_DATA,
  type TreadmillTelemetry,
} from "./ftms.ts";
export type ConnectionState =
  "Disconnected" | "Connecting" | "Connected" | "Unsupported browser/device";
export interface FtmsCharacteristic extends EventTarget {
  value?: DataView;
  properties: { notify?: boolean; indicate?: boolean; read?: boolean };
  startNotifications(): Promise<FtmsCharacteristic>;
  stopNotifications(): Promise<FtmsCharacteristic>;
  readValue(): Promise<DataView>;
}
export interface FtmsServer {
  connected: boolean;
  connect(): Promise<FtmsServer>;
  disconnect(): void;
  getPrimaryService(
    uuid: number,
  ): Promise<{ getCharacteristic(uuid: number): Promise<FtmsCharacteristic> }>;
}
export interface FtmsDevice extends EventTarget {
  name?: string;
  gatt?: FtmsServer;
}
export interface BluetoothAccess {
  requestDevice(options: {
    filters: { services: number[] }[];
  }): Promise<FtmsDevice>;
}
export function bluetoothAccess(): BluetoothAccess | null {
  return typeof window !== "undefined" &&
    window.isSecureContext &&
    "bluetooth" in navigator
    ? (navigator as unknown as { bluetooth: BluetoothAccess }).bluetooth
    : null;
}
type Callbacks = {
  state: (state: ConnectionState, name?: string) => void;
  data: (data: TreadmillTelemetry) => void;
  error: (message: string) => void;
  disconnected: () => void;
};
export class FtmsClient {
  private device: FtmsDevice | null = null;
  private characteristic: FtmsCharacteristic | null = null;
  private poll: ReturnType<typeof setInterval> | null = null;
  private generation = 0;
  private callbacks: Callbacks | null = null;
  private notification = (event: Event) => {
    const value = (event.target as FtmsCharacteristic).value;
    if (value) this.deliver(value);
  };
  private lost = () => {
    const callbacks = this.callbacks;
    this.disconnect();
    callbacks?.disconnected();
  };
  private deliver(value: DataView) {
    try {
      this.callbacks?.data(parseTreadmillData(value));
    } catch {
      this.callbacks?.error("A malformed treadmill packet was ignored.");
    }
  }
  async connect(callbacks: Callbacks, access = bluetoothAccess()) {
    this.disconnect();
    this.callbacks = callbacks;
    if (!access) {
      callbacks.state("Unsupported browser/device");
      callbacks.error(
        "Web Bluetooth is unavailable here. Use outdoor GPS or a browser and device that support Web Bluetooth.",
      );
      return;
    }
    const generation = ++this.generation;
    callbacks.state("Connecting");
    let selected: FtmsDevice | null = null;
    try {
      // Must stay in the explicit connect button's user-activation call chain.
      selected = await access.requestDevice({
        filters: [{ services: [FTMS_SERVICE] }],
      });
      if (generation !== this.generation) return;
      this.device = selected;
      selected.addEventListener("gattserverdisconnected", this.lost);
      if (!selected.gatt)
        throw new Error("Unsupported device: GATT is unavailable.");
      const server = await selected.gatt.connect();
      if (generation !== this.generation) {
        server.disconnect();
        return;
      }
      const service = await server.getPrimaryService(FTMS_SERVICE);
      const characteristic = await service.getCharacteristic(TREADMILL_DATA);
      if (generation !== this.generation) return;
      this.characteristic = characteristic;
      if (
        characteristic.properties.notify ||
        characteristic.properties.indicate
      ) {
        characteristic.addEventListener(
          "characteristicvaluechanged",
          this.notification,
        );
        await characteristic.startNotifications();
      } else if (!characteristic.properties.read)
        throw new Error("Unsupported device: treadmill data cannot be read.");
      if (generation !== this.generation) return;
      callbacks.state("Connected", selected.name ?? "FTMS treadmill");
      if (characteristic.properties.read) {
        let reading = false;
        const read = async () => {
          if (reading || generation !== this.generation) return;
          reading = true;
          try {
            const value = await characteristic.readValue();
            if (generation === this.generation) this.deliver(value);
          } catch {
            if (generation === this.generation) this.lost();
          } finally {
            reading = false;
          }
        };
        await read();
        if (
          !(
            characteristic.properties.notify ||
            characteristic.properties.indicate
          ) &&
          generation === this.generation
        )
          this.poll = setInterval(() => {
            void read();
          }, 1000);
      }
    } catch (cause) {
      if (generation !== this.generation) return;
      const cancelled =
        cause instanceof DOMException &&
        cause.name === "NotFoundError" &&
        !selected;
      this.disconnect();
      callbacks.state(selected ? "Unsupported browser/device" : "Disconnected");
      callbacks.error(
        cancelled
          ? "No treadmill selected. You can retry the FTMS chooser."
          : selected
            ? "This device could not provide FTMS treadmill data. Try another compatible device or use outdoor GPS."
            : "Bluetooth connection failed. Check browser permissions and retry.",
      );
    }
  }
  disconnect() {
    this.generation++;
    if (this.poll) clearInterval(this.poll);
    this.poll = null;
    this.characteristic?.removeEventListener(
      "characteristicvaluechanged",
      this.notification,
    );
    if (this.characteristic)
      void this.characteristic.stopNotifications().catch(() => {});
    this.characteristic = null;
    this.device?.removeEventListener("gattserverdisconnected", this.lost);
    this.device?.gatt?.disconnect();
    this.device = null;
    const callbacks = this.callbacks;
    this.callbacks = null;
    callbacks?.state("Disconnected");
  }
}
