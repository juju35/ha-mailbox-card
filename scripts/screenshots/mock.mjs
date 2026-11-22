// The mock home of the screenshots and animations: a mailbox with a vibration sensor on its flap and a door sensor,
// an input_button for the Collected button, the Parcel integration's deliveries, and the history of the last 7 days.
// The clock is fixed (15:42 on a November Thursday), so that a capture only changes when the card does.
const st = (entity_id, state, attributes = {}, last_changed = "2026-11-19T00:00:00Z") => ({ entity_id, state, attributes, last_changed });

const DAY = [2026, 10, 19];
const at = (offset, hour, minute = 0) => new Date(DAY[0], DAY[1], DAY[2] + offset, hour, minute).getTime();
const NOW = at(0, 15, 42);

// `scene`: mail (waiting since 10:42, parcels on the way), collected (by the door at 12:05), empty (the last mail two
// days ago, no parcel), offline (the sensor unavailable).
const SCENES = {
  mail: { mail: [at(-6, 10, 5), at(-4, 11, 20), at(-2, 9, 50), at(-1, 10, 15), at(0, 10, 42)], door: [at(-6, 18), at(-4, 18, 30), at(-2, 19), at(-1, 18, 10)], parcels: true },
  collected: { mail: [at(-6, 10, 5), at(-4, 11, 20), at(-1, 10, 15), at(0, 10, 42)], door: [at(-6, 18), at(-4, 18, 30), at(-1, 18, 10), at(0, 12, 5)], parcels: true },
  empty: { mail: [at(-5, 9, 40), at(-2, 9, 30)], door: [at(-5, 18), at(-2, 18)], parcels: false },
  offline: { mail: [], door: [], parcels: false, offline: true },
};

// The page's clock and the card's callWS, as script source: window.Date fixed, window.__ws answering the history put
// on the hass object (`this.__ws`).
export const pageScript = () => `(() => {
  const N = ${NOW};
  const R = Date;
  window.Date = class extends R {
    constructor(...a) { super(...(a.length ? a : [N])); }
    static now() { return N; }
  };
  window.__ws = async function (msg) {
    if (msg.type === "history/history_during_period") return (this.__ws || {}).history ?? null;
    return null;
  };
})();`;

const series = (ons) => ons.flatMap((t) => [{ s: "on", lu: t / 1000 }, { s: "off", lu: (t + 60000) / 1000 }]);

export const setup = (s) => {
  const v = SCENES[s.scene];
  const today = "2026-11-19";
  const states = {
    "binary_sensor.mailbox_vibration": st("binary_sensor.mailbox_vibration", v.offline ? "unavailable" : "off", { friendly_name: "Mailbox vibration", device_class: "vibration" }),
    "binary_sensor.mailbox_door": st("binary_sensor.mailbox_door", "off", { friendly_name: "Mailbox door", device_class: "door" }),
    "input_button.mail_collected": st("input_button.mail_collected", "unknown", { friendly_name: "Mail collected" }),
  };
  const entities = {
    "binary_sensor.mailbox_vibration": { entity_id: "binary_sensor.mailbox_vibration", device_id: "mb", platform: "zha" },
    "binary_sensor.mailbox_door": { entity_id: "binary_sensor.mailbox_door", device_id: "mbd", platform: "zha" },
  };
  if (v.parcels) {
    states["sensor.parcel_deliveries"] = st("sensor.parcel_deliveries", "3", {
      deliveries: [
        { description: "Running shoes", carrier_name: "Colissimo", status: "out_for_delivery", timestamp_expected_end: at(0, 17) / 1000 },
        { description: "Printer ink", carrier_name: "Chronopost", status: "delivered", date_expected: today },
        { description: "Desk lamp", carrier_name: "UPS", status: "in_transit", date_expected: "2026-11-21" },
      ],
    });
    entities["sensor.parcel_deliveries"] = { entity_id: "sensor.parcel_deliveries", device_id: "p", platform: "parcel", translation_key: "deliveries" };
  }
  return {
    hass: {
      language: "en",
      locale: { language: "en" },
      entities,
      states,
      __ws: { history: { "binary_sensor.mailbox_vibration": series(v.mail), "binary_sensor.mailbox_door": series(v.door) } },
    },
    config: { entity: "binary_sensor.mailbox_vibration", door: "binary_sensor.mailbox_door", collected: "input_button.mail_collected", ...s.config },
    open: s.open,
  };
};
