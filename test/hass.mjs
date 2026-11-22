// A mock Home Assistant with a mailbox: a vibration sensor on the flap, a door sensor, an input_button for the
// Collected button, the Parcel integration's deliveries sensor, and callWS answering the history of the last 7 days.
// The days are the machine's: the times are built from local midnight.
export const st = (entity_id, state, attributes = {}, last_changed = "2026-01-01T00:00:00Z") => ({ entity_id, state, attributes, last_changed });

export const at = (offset, hour, minute = 0) => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + offset);
  d.setHours(hour, minute);
  return d.getTime();
};

// The history: the mail sensor's taps (on, then off a minute later) and the door's openings, as minimal states.
const series = (ons) => ons.flatMap((t) => [{ s: "on", lu: t / 1000 }, { s: "off", lu: (t + 60000) / 1000 }]);

export const makeHass = ({ mail = [at(-5, 10, 5), at(-3, 11, 20), at(-3, 11, 24), at(-1, 9, 50), at(0, 10, 42)], door = [at(-5, 18, 0), at(-3, 18, 30), at(-1, 19, 0)], pressed = null, ws = true, ...overrides } = {}) => {
  const today = new Date(at(0, 12)).toISOString().slice(0, 10);
  const hass = {
    language: "en",
    locale: { language: "en" },
    themes: { darkMode: false },
    entities: {
      "binary_sensor.mailbox_vibration": { device_id: "mb", platform: "zha" },
      "binary_sensor.mailbox_door": { device_id: "mbd", platform: "zha" },
      "sensor.parcel_deliveries": { device_id: "p", platform: "parcel", translation_key: "deliveries" },
    },
    states: {
      "binary_sensor.mailbox_vibration": st("binary_sensor.mailbox_vibration", "off", { friendly_name: "Mailbox vibration", device_class: "vibration" }),
      "binary_sensor.mailbox_door": st("binary_sensor.mailbox_door", "off", { friendly_name: "Mailbox door", device_class: "door" }),
      "binary_sensor.front_door": st("binary_sensor.front_door", "off", { friendly_name: "Front door", device_class: "door" }),
      "input_button.mail_collected": st("input_button.mail_collected", pressed ? new Date(pressed).toISOString() : "unknown", { friendly_name: "Mail collected" }),
      "sensor.parcel_deliveries": st("sensor.parcel_deliveries", "3", {
        deliveries: [
          { description: "Running shoes", carrier_name: "Colissimo", status: "out_for_delivery", timestamp_expected_end: at(0, 13) / 1000 },
          { description: "Printer ink", carrier_name: "Chronopost", status: "delivered", date_expected: today },
          { description: "Desk lamp", carrier_name: "UPS", status: "in_transit", date_expected: new Date(at(2, 12)).toISOString().slice(0, 10) },
        ],
      }),
    },
    calls: [],
    ws: [],
    callService(domain, service, data) {
      this.calls.push([domain, service, data]);
    },
    ...overrides,
  };
  if (ws)
    hass.callWS = async (msg) => {
      hass.ws.push(msg);
      if (msg.type === "history/history_during_period") return { "binary_sensor.mailbox_vibration": series(mail), "binary_sensor.mailbox_door": series(door) };
      return null;
    };
  return hass;
};
