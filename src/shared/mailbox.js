// ── Mailbox ──────────────────────────────────────────────────────────────────
// A mailbox is any binary sensor on its flap (an opening, vibration or motion sensor): mail has come when it turns
// on. The mail is collected when the collection door's sensor turns on, or when the Collected button presses its
// helper (an input_button, whose state is the time it was pressed, or an input_datetime set to now). The events of
// the last 7 days come from the history (history/history_during_period). The parcels expected today come from the
// Parcel integration's deliveries sensor, when there is one.
// A mailbox's name: a word starting with one of these (so never "gmail", "e-mail", "e_mail", "compost").
export const MB_NAME = /(?<!\p{L}|(?<!\p{L})e[-_ ])(?:mail|letter|post|courrier|bo[iî]te|lettres|briefkasten|buz[oó]n|cassetta|brievenbus|skrzynk|schr[aá]nk|pošt|почт|γραμματ)/iu;
// Taps closer than this make one delivery (a flap swinging, a vibration sensor's bursts).
export const MB_DEBOUNCE = 10 * 60 * 1000;
// Mail sensor events this close to a collection are the door being opened, not mail.
export const MB_NEAR = 2 * 60 * 1000;
export const MB_DAY = 24 * 3600 * 1000;

// The midnight `offset` days from the day of `t`, in the browser's time zone.
export const mbDay = (t, offset = 0) => {
  const d = new Date(t);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + offset);
  return d.getTime();
};

// The mail sensors of the home, most likely first: binary sensors named like a mailbox.
export const mbSensors = (hass) =>
  Object.keys(hass.states || {}).filter((id) => id.startsWith("binary_sensor.") && MB_NAME.test(`${id} ${hass.states[id].attributes?.friendly_name || ""}`) && !/door|porte|t[uü]r|collect|relev/i.test(id));

// The times (ms) a sensor turned on, from a history list ([{ s, lu }] minimal, or full states).
export const mbOns = (list) => {
  const out = [];
  let prev = null;
  for (const x of list || []) {
    const s = x.s ?? x.state;
    const t = x.lu != null ? x.lu * 1000 : x.lc != null ? x.lc * 1000 : Date.parse(x.last_changed || x.last_updated);
    if (s === "on" && prev !== "on" && Number.isFinite(t)) out.push(t);
    prev = s;
  }
  return out;
};

// The deliveries and the collections: the mail sensor's turns on, one per MB_DEBOUNCE and none close to a
// collection; the collections are the door's turns on and `collected` (the helper's time).
export const mbEvents = (history, mailId, doorId, collected = null) => {
  const collects = mbOns(history?.[doorId]);
  if (collected != null) collects.push(collected);
  collects.sort((a, b) => a - b);
  const arrivals = [];
  for (const t of mbOns(history?.[mailId])) {
    if (collects.some((c) => Math.abs(t - c) < MB_NEAR)) continue;
    if (arrivals.length && t - arrivals.at(-1) < MB_DEBOUNCE) continue;
    arrivals.push(t);
  }
  return { arrivals, collects };
};

// The Parcel deliveries of today: out for delivery, or expected today whatever their status (a parcel expected today
// and delivered stays, marked delivered); name, carrier, status key and the end of the expected window.
export const mbParcels = (st, now) => {
  const list = st?.attributes?.deliveries;
  if (!Array.isArray(list)) return [];
  const d0 = mbDay(now);
  const day = (v) => {
    if (v == null || v === "") return null;
    const t = typeof v === "number" ? (v < 1e12 ? v * 1000 : v) : Date.parse(String(v).length === 10 ? `${v}T12:00:00` : v);
    return Number.isFinite(t) ? t : null;
  };
  return list
    .map((x) => {
      const start = day(x.timestamp_expected) ?? day(x.date_expected);
      const end = day(x.timestamp_expected_end) ?? day(x.date_expected_end);
      return { name: x.description || x.tracking_number || "", carrier: x.carrier_name || x.carrier_code || "", status: x.status || "unknown", start, end };
    })
    .filter((x) => x.status === "out_for_delivery" || (x.start != null && x.start >= d0 && x.start < d0 + MB_DAY));
};
