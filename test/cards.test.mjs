import assert from "node:assert/strict";
import { test } from "node:test";
import { at, makeHass, st } from "./hass.mjs";
import { fakeNode, load } from "./load.mjs";

const NOW = at(0, 15, 42); // today, 15:42
const mb = load({ now: NOW });
const { cards } = mb;
const json = (v) => JSON.parse(JSON.stringify(v));
const settle = () => new Promise((r) => setTimeout(r, 0));

// A card whose shadow root answers every selector with nodes recording their click listeners; the history fetched
// (callWS) before the test reads it.
const make = async (tag, config, hass = makeHass()) => {
  const card = new cards[tag]();
  card.attachShadow();
  const nodes = {};
  card.shadowRoot.querySelector = (s) => (nodes[s] ||= fakeNode());
  card._nodes = nodes;
  card.setConfig({ type: `custom:${tag}`, ...config });
  card.hass = hass;
  await settle();
  await settle();
  return card;
};
const MAIL = { entity: "binary_sensor.mailbox_vibration", door: "binary_sensor.mailbox_door" };

test("both cards are registered, with their editors and a picker entry", () => {
  for (const tag of ["mailbox-card", "mailbox-mini-card"]) {
    assert.ok(mb.customElements.get(tag), tag);
    assert.ok(mb.customElements.get(`${tag}-editor`), `${tag}-editor`);
  }
  assert.deepEqual(json(mb.window.customCards.map((c) => c.type)), ["mailbox-card", "mailbox-mini-card"]);
});


test("mail sensors: a word starting like a mailbox, never gmail, e-mail or compost", () => {
  const h = makeHass();
  for (const id of ["binary_sensor.gmail_unread", "binary_sensor.e_mail_alert", "binary_sensor.compost_full", "binary_sensor.front_mailbox_flap", "binary_sensor.garage_mailbox"])
    h.states[id] = st(id, "off", { friendly_name: id === "binary_sensor.e_mail_alert" ? "E-mail alert" : "" });
  const ids = mb.mbSensors(h);
  assert.ok(ids.includes("binary_sensor.front_mailbox_flap"));
  assert.ok(ids.includes("binary_sensor.garage_mailbox"), "a word ending in e before it");
  for (const id of ["binary_sensor.gmail_unread", "binary_sensor.compost_full"]) assert.ok(!ids.includes(id), id);
  assert.ok(!ids.includes("binary_sensor.e_mail_alert"), "E-mail alert");
  const named = (name) => mb.mbSensors({ states: { "binary_sensor.x": st("binary_sensor.x", "off", { friendly_name: name }) } }).length === 1;
  assert.ok(named("Boîte aux lettres"));
  assert.ok(named("Почтовый ящик"));
  assert.ok(!named("New e-mail"));
});
test("discovery: binary sensors named like a mailbox, not its door", () => {
  const h = makeHass();
  assert.deepEqual(json(mb.mbSensors(h)), ["binary_sensor.mailbox_vibration"]);
  assert.deepEqual(json(cards["mailbox-card"].getStubConfig(h)), { entity: "binary_sensor.mailbox_vibration" });
});

test("events: one delivery per burst, none when the door opens, collections from the door and the helper", () => {
  const t = at(0, 10);
  const s = (ons) => ons.flatMap((x) => [{ s: "on", lu: x / 1000 }, { s: "off", lu: (x + 30000) / 1000 }]);
  const hist = { mail: s([t, t + 4 * 60000, t + 3 * 3600000, t + 8 * 3600000]), door: s([t + 8 * 3600000 + 30000]) };
  const ev = mb.mbEvents(hist, "mail", "door", t + 9 * 3600000);
  assert.deepEqual(json(ev.arrivals), [t, t + 3 * 3600000], "the burst is one delivery, the tap when the door opens is not mail");
  assert.deepEqual(json(ev.collects), [t + 8 * 3600000 + 30000, t + 9 * 3600000]);
});

test("parcels: out for delivery, expected or delivered today", () => {
  const p = mb.mbParcels(makeHass().states["sensor.parcel_deliveries"], NOW);
  assert.deepEqual(json(p.map((x) => [x.name, x.status])), [
    ["Running shoes", "out_for_delivery"],
    ["Printer ink", "delivered"],
  ]);
  assert.equal(p[0].end, at(0, 13));
});

test("full card: mail waiting, its time, the flag up, the tiles, the parcels and the week", async () => {
  const hass = makeHass();
  const card = await make("mailbox-card", MAIL, hass);
  const m = card._items;
  assert.equal(hass.ws[0].type, "history/history_during_period");
  assert.deepEqual(json(hass.ws[0].entity_ids), ["binary_sensor.mailbox_vibration", "binary_sensor.mailbox_door"]);
  assert.equal(m.state, "mail");
  assert.equal(m.lastA, at(0, 10, 42));
  assert.equal(m.weekDays, 4, "three days with mail, the double tap is one");
  const html = card.shadowRoot.innerHTML;
  assert.match(html, /class="banner"/);
  assert.match(html, /<span class="bpt">Mail<\/span>/);
  assert.match(html, /<div class="subt">Arrived at 10:42\s?AM<\/div>/);
  assert.match(html, /<span class="hh">You&#39;ve got mail<\/span>/);
  assert.match(html, /Not collected yet · 5 hr\. ago/, "Intl's relative time");
  assert.doesNotMatch(html, /act-collect/, "no helper: no Collected button");
  assert.match(html, /<span class="xl">Parcels<\/span><span class="xv">2<small>today<\/small>/);
  assert.match(html, /<b>Running shoes<\/b><span>Colissimo · Out for delivery<\/span><\/span><span class="pr">by 1:00\s?PM<\/span>/);
  assert.equal((html.match(/class="wd on/g) || []).length, 4);
  assert.match(html, /class="wd on td"/, "today has mail");
  assert.match(html, /animateTransform/, "the flag rises");
});

test("collected: by the door, or by the Collected button's helper", async () => {
  const byDoor = await make("mailbox-card", MAIL, makeHass({ door: [at(-5, 18), at(0, 12, 5)] }));
  assert.equal(byDoor._items.state, "collected");
  assert.match(byDoor.shadowRoot.innerHTML, /<div class="subt">Collected at 12:05\s?PM<\/div>/);
  const hass = makeHass();
  const card = await make("mailbox-card", { ...MAIL, collected: "input_button.mail_collected" }, hass);
  assert.equal(card._items.canCollect, true);
  card._collectNow();
  assert.deepEqual(json(hass.calls), [["input_button", "press", { entity_id: "input_button.mail_collected" }]]);
  const pressed = await make("mailbox-card", { ...MAIL, collected: "input_button.mail_collected" }, makeHass({ pressed: at(0, 14) }));
  assert.equal(pressed._items.state, "collected");
});

test("without a door nor a helper: the mail counts as collected at midnight", async () => {
  const only = { entity: "binary_sensor.mailbox_vibration" };
  const today = await make("mailbox-card", only, makeHass({ mail: [at(0, 10, 42)], door: [] }));
  assert.equal(today._items.state, "mail");
  const old = await make("mailbox-card", only, makeHass({ mail: [at(-1, 10, 42)], door: [] }));
  assert.equal(old._items.state, "empty", "yesterday's mail");
  assert.match(old.shadowRoot.innerHTML, /Last mail yesterday 10:42/);
  const door = await make("mailbox-card", MAIL, makeHass({ mail: [at(-1, 10, 42)], door: [] }));
  assert.equal(door._items.state, "mail", "with a door, the mail waits for it");
});

test("empty: the last mail; unavailable; no sensor", async () => {
  const empty = await make("mailbox-card", MAIL, makeHass({ mail: [at(-2, 9, 30)], door: [at(-2, 18)] }));
  assert.equal(empty._items.state, "empty");
  assert.match(empty.shadowRoot.innerHTML, /Last mail [A-Za-z]+ 9:30/);
  const h = makeHass();
  h.states["binary_sensor.mailbox_vibration"] = st("binary_sensor.mailbox_vibration", "unavailable");
  assert.equal((await make("mailbox-card", MAIL, h))._items.state, "offline");
  const none = await make("mailbox-card", {}, { ...makeHass({ ws: false }), states: {}, entities: {} });
  assert.equal(none._items.state, "none");
  assert.match(none.shadowRoot.innerHTML, /No mailbox sensor found/);
});

test("without the history: the sensor's last change", async () => {
  const h = makeHass({ ws: false });
  h.states["binary_sensor.mailbox_vibration"] = st("binary_sensor.mailbox_vibration", "on", {}, new Date(at(0, 9)).toISOString());
  const card = await make("mailbox-card", MAIL, h);
  assert.equal(card._items.state, "mail");
  assert.equal(card._items.lastA, at(0, 9));
});

test("plurals: the parcels and the days with mail, in Polish, Slovenian and Latvian", async () => {
  const pl = await make("mailbox-card", { ...MAIL, language: "pl" });
  assert.deepEqual([1, 2, 5, 22].map((n) => pl._tn("parcels", n)), ["1 paczka", "2 paczki", "5 paczek", "22 paczki"]);
  assert.deepEqual([1, 3, 5].map((n) => pl._tn("days_mail", n)), ["dzień z pocztą", "dni z pocztą", "dni z pocztą"]);
  assert.match(pl._ago(NOW - 26 * 3.6e6, NOW), /1 dzień temu/);
  const sl = await make("mailbox-card", { ...MAIL, language: "sl" });
  assert.deepEqual([1, 2, 3, 5].map((n) => sl._tn("parcels", n)), ["1 paket", "2 paketa", "3 paketi", "5 paketov"]);
  const lv = await make("mailbox-card", { ...MAIL, language: "lv" });
  assert.deepEqual([1, 2, 10].map((n) => lv._tn("parcels", n)), ["1 sūtījums", "2 sūtījumi", "10 sūtījumu"]);
});

test("the tiles open their sensor's details", async () => {
  const card = await make("mailbox-card", MAIL);
  const events = [];
  card.dispatchEvent = (e) => events.push(e.detail?.entityId);
  const tiles = [{ dataset: { id: "sensor.parcel_deliveries" }, addEventListener(_t, fn) { this.fn = fn; } }];
  card.shadowRoot.querySelectorAll = (s) => (s === ".xt[data-id]" ? tiles : []);
  card._bindAfter(card.shadowRoot);
  tiles[0].fn();
  assert.deepEqual(events, ["sensor.parcel_deliveries"]);
});

test("mini card: the chips and the week on the banner, and the zoom to the full card", async () => {
  const card = await make("mailbox-mini-card", MAIL);
  const html = card.shadowRoot.innerHTML;
  assert.match(html, /<ha-card class="lvl-mail bn">/);
  assert.match(html, /Waiting since 10:42/);
  assert.match(html, /2 parcels/);
  assert.match(html, /class="wk wkm"/);
  card._zoomed = true;
  card._sig = null;
  card._render();
  assert.match(card.shadowRoot.innerHTML, /class="box hero"/);
});

test("translations: every language has every English key", () => {
  const en = Object.keys(mb.MB_I18N.en);
  for (const [lang, table] of Object.entries(mb.MB_I18N)) assert.deepEqual(en.filter((k) => !(k in table)), [], lang);
  assert.equal(Object.keys(mb.MB_I18N).length, 22);
});

test("the editor writes only what differs from the defaults", () => {
  const ed = new (mb.customElements.get("mailbox-card-editor"))();
  ed.setConfig({ type: "custom:mailbox-card" });
  ed.hass = makeHass();
  const form = ed.children[0];
  const names = form.schema.flatMap((s) => (s.schema ? s.schema.map((x) => x.name) : [s.name]));
  for (const n of ["entity", "door", "collected", "parcels", "show_week", "illustration_theme", "language"]) assert.ok(names.includes(n), n);
  let out;
  ed.dispatchEvent = (e) => (out = e.detail.config);
  form.listeners["value-changed"]({ detail: { value: { type: "custom:mailbox-card", show_week: true, entity: "binary_sensor.mailbox_vibration" } } });
  assert.deepEqual(json(out), { type: "custom:mailbox-card", entity: "binary_sensor.mailbox_vibration" });
});
