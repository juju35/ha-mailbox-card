/**
 * mailbox-card / mailbox-mini-card: a connected mailbox, illustrated. The flag goes up when mail has come, with the time
 * it came, and down when it is collected; the parcels expected today and the last 7 days.
 * https://github.com/juju35/ha-mailbox-card
 */

// The badge's icon of each state (its colour is the stylesheet's).
const MB_ICONS = { mail: "mdi:mailbox-up", empty: "mdi:mailbox-outline", collected: "mdi:mailbox-open-outline", offline: "mdi:lan-disconnect", none: "mdi:mailbox" };
// One loop of the animation (s): the flag rises, holds up, and starts again.
const MB_LOOP = 3;
// How often the history is fetched again (ms), and at each change of the sensors.
const MB_REFRESH = 5 * 60 * 1000;

// ── Banner ───────────────────────────────────────────────────────────────────
// The illustrated header's scene: 200 × 80, drawn to the banner's right edge. A white picket fence, the mailbox on
// its post, its red flag up while mail waits (rising, when animated), a bush. By night, the same in the dark.
const mbScene = ({ night, up, animate }) => {
  const fence = night ? ["#3a4250", "#2a303a"] : ["#ffffff", "#d6dbe0"];
  const pickets = Array.from({ length: 12 }, (_, i) => `<path d="M${i * 18} 80 V44 l5 -6 l5 6 V80 Z"/>`).join("");
  return `<g fill="${fence[0]}" stroke="${fence[1]}">${pickets}<rect x="0" y="52" width="200" height="4"/></g>
    <rect x="104" y="40" width="8" height="40" fill="${night ? "#4a3a30" : "#8a5a3b"}"/>
    ${mbBox({ x: 86, y: 22, s: 1, night, up, animate })}
    <circle cx="170" cy="58" r="9" fill="${night ? "#2c4a34" : "#5aa83c"}"/><circle cx="182" cy="62" r="7" fill="${night ? "#335a3c" : "#6fbe4e"}"/>`;
};

// The mailbox: a rounded box, its door, the letters inside when there is mail (`letters`), its flag on the side, up
// (`up`) or down; `animate` raises the flag once per loop. Drawn at (x, y), scale `s`.
const mbBox = ({ x, y, s, night, up, animate, letters = false }) => {
  const [dark, light] = night ? ["#24508a", "#2f65aa"] : ["#2f6fb5", "#3b7fd4"];
  // The flag's pole, on the box's side, standing above it when up; down, it lies along the box (a quarter turn
  // around its foot).
  const fx = 38;
  const pv = `${fx + 1.5} 24`;
  const turn = up && animate ? `<animateTransform attributeName="transform" type="rotate" values="-90 ${pv};-90 ${pv};0 ${pv};0 ${pv}" keyTimes="0;.2;.45;1" dur="${MB_LOOP}s" repeatCount="indefinite"/>` : "";
  const flag = `<g transform="${up ? "" : `rotate(-90 ${pv})`}"><rect x="${fx}" y="-12" width="3" height="36" fill="${night ? "#8c96a3" : "#7b8794"}"/><path d="M${fx + 3} -12 h14 v9 h-14z" fill="#e03131"/>${turn}</g>`;
  // The letter, inside the box's mouth (its bottom at 28): it never hangs below the box.
  const mail = letters ? `<rect x="4" y="15" width="20" height="11" rx="1.5" fill="#fff"/><path d="M4 15 l10 6 l10 -6" fill="none" stroke="#c9ced6" stroke-width="1"/>` : "";
  return `<g transform="translate(${x} ${y}) scale(${s})">
      <path d="M0 14 a14 14 0 0 1 28 0 v14 h-28 z" fill="${dark}"/>${mail}
      <path d="M0 28 h44 v-14 a14 14 0 0 0 -14 -14 h-16 a14 14 0 0 1 14 14" fill="${light}"/>
      <rect x="4" y="18" width="12" height="2" rx="1" fill="#fff" opacity="${letters ? 0 : 0.7}"/>${flag}</g>`;
};

// The status pill's place, decided by measurement after each render and each new width (the same rule on every
// card): on the title row, right after the title, only when the whole title and the pill's whole label fit there;
// otherwise on its own line under the subtitle (clamped to one line). When the label is still cut there, or the text
// block leaves the banner or runs over its ground strip, the pill keeps its dot alone, on the title row (its label
// stays in title and aria-label). A card of 200 px or less shows the dot alone anyway (CSS), beside the title.
const mbPlacePill = (head, row, ground) => {
  if (!head) return;
  head.removeAttribute("data-wrap");
  head.removeAttribute("data-dot");
  const pill = row.querySelector(":scope > .bpill, :scope > .pill");
  const text = pill?.querySelector(".bpt, .pt");
  if (!text?.getBoundingClientRect || text.getBoundingClientRect().width <= 1) return;
  const name = row.querySelector(".title");
  const gap = parseFloat(getComputedStyle(row).columnGap) || 0;
  const title = name ? (name.scrollWidth > name.clientWidth ? name.scrollWidth : name.getBoundingClientRect().width) + gap : 0;
  if (title + pill.getBoundingClientRect().width <= row.getBoundingClientRect().width + 0.5) return;
  head.setAttribute("data-wrap", "");
  const box = row.parentElement.getBoundingClientRect();
  const frame = head.getBoundingClientRect();
  const out = ground && (box.bottom > ground.getBoundingClientRect().top + 0.5 || box.top < frame.top - 0.5);
  if (text.scrollWidth > text.clientWidth + 0.5 || out) {
    head.removeAttribute("data-wrap");
    head.setAttribute("data-dot", "");
  }
};

// ── Card ─────────────────────────────────────────────────────────────────────
class MailboxCard extends RcCard {
  static tag = "mailbox-card";
  static i18n = MB_I18N;
  static defaults = { illustration: true, illustration_theme: "auto", show_subtitle: true, show_week: true, animations: true };

  // The most likely mail sensor of the home.
  static getStubConfig(hass) {
    const entity = hass ? mbSensors(hass)[0] : undefined;
    return entity ? { entity } : {};
  }

  getCardSize() {
    return 6;
  }

  connectedCallback() {
    super.connectedCallback?.();
    this._timer ??= setInterval(() => this._fetch(), MB_REFRESH);
    // A new width: the status pill is fitted again (in the next frame, and only for a new width).
    if (typeof ResizeObserver !== "function") return;
    this._resize ??= new ResizeObserver((entries) => {
      const w = Math.round(entries.at(-1).contentRect.width);
      if (w === this._fitWidth) return;
      this._fitWidth = w;
      cancelAnimationFrame(this._fitFrame);
      this._fitFrame = requestAnimationFrame(() => this._fitPill());
    });
    this._resize.observe(this);
  }

  disconnectedCallback() {
    super.disconnectedCallback?.();
    clearInterval(this._timer);
    this._timer = undefined;
    this._resize?.disconnect();
    this._fitWidth = undefined;
    if (this._fitFrame) cancelAnimationFrame(this._fitFrame);
  }

  // Without `entity`: the first mail sensor of the home, looked for again only when the registry changes.
  _mailId() {
    return this._config.entity || rcMemo((this._memo ||= {}), "mail", [this._hass.entities], () => mbSensors(this._hass))[0];
  }

  // The Parcel deliveries sensor: `parcels`, else the Parcel integration's.
  _parcelsId() {
    const c = this._config;
    if (c.parcels) return c.parcels;
    const reg = this._hass.entities || {};
    return Object.keys(reg).find((id) => reg[id].platform === "parcel" && id.startsWith("sensor.") && (reg[id].translation_key === "deliveries" || /deliver/.test(id)));
  }

  // The last 7 days of the mail and door sensors, from the history.
  async _fetch() {
    const h = this._hass;
    const ids = [this._mailId(), this._config.door].filter(Boolean);
    if (!h?.callWS || this._busy || !ids.length) return;
    this._busy = true;
    const now = Date.now();
    try {
      const hist = await h
        .callWS({
          type: "history/history_during_period",
          start_time: new Date(mbDay(now, -6)).toISOString(),
          entity_ids: ids,
          minimal_response: true,
          no_attributes: true,
          significant_changes_only: false,
        })
        .catch(() => null);
      this._ws = { hist, key: this._key(ids), at: now };
    } finally {
      this._busy = false;
    }
    this._sig = null;
    this._render();
  }

  // What the history depends on: the sensors and their last changes.
  _key(ids) {
    return ids.map((id) => `${id}@${this._hass.states[id]?.last_changed || ""}`).join("|");
  }

  _time(t, opts) {
    try {
      return new Intl.DateTimeFormat(this._lang(), opts).format(new Date(t));
    } catch {
      return new Date(t).toTimeString().slice(0, 5);
    }
  }

  _hm(t) {
    return this._time(t, { hour: "numeric", minute: "2-digit" });
  }

  // A time with its day: the time alone today, "yesterday 10:42", else "Mon 10:42".
  _when(t, now) {
    const d = mbDay(now);
    if (t >= d) return this._hm(t);
    if (t >= mbDay(now, -1)) return `${this._t("yesterday")} ${this._hm(t)}`;
    return `${this._time(t, { weekday: "short" })} ${this._hm(t)}`;
  }

  // How long ago, in minutes, hours or days: the language's own words and plurals (Intl).
  _ago(t, now) {
    const m = Math.max(0, Math.round((now - t) / 60000));
    const [v, unit] = m < 60 ? [m, "minute"] : m < 24 * 60 ? [Math.floor(m / 60), "hour"] : [Math.floor(m / 1440), "day"];
    try {
      return new Intl.RelativeTimeFormat(this._lang(), { numeric: "always", style: "short" }).format(-v, unit);
    } catch {
      return `-${v} ${unit}`;
    }
  }

  // The time the helper was last set: an input_button's state, an input_datetime's timestamp.
  _helperTime() {
    const st = this._config.collected && this._hass.states[this._config.collected];
    if (!st) return null;
    const t = st.attributes?.timestamp != null && st.attributes.has_date !== false ? st.attributes.timestamp * 1000 : Date.parse(st.state);
    return Number.isFinite(t) ? t : null;
  }

  // The mail: deliveries and collections, the state, the week and the parcels.
  _collect() {
    const h = this._hass;
    const c = this._config;
    const now = Date.now();
    const id = this._mailId();
    const st = id ? h.states[id] : undefined;
    const ids = [id, c.door].filter(Boolean);
    // Fetched at first, every MB_REFRESH, and when a sensor changes.
    if (h.callWS && !this._busy && ids.length && (!this._ws || this._ws.key !== this._key(ids))) this._fetch();
    const helper = this._helperTime();
    let ev;
    if (this._ws?.hist) ev = mbEvents(this._ws.hist, id, c.door, helper);
    else {
      // No history: the sensors' last changes.
      const door = c.door && h.states[c.door];
      const collects = [door?.state === "on" ? Date.parse(door.last_changed) : null, helper].filter((x) => Number.isFinite(x));
      ev = { arrivals: st?.state === "on" ? [Date.parse(st.last_changed)] : [], collects };
    }
    const lastA = ev.arrivals.at(-1) ?? null;
    const lastC = ev.collects.length ? Math.max(...ev.collects) : null;
    const d0 = mbDay(now);
    let state;
    if (!id) state = "none";
    else if (!st || ["unavailable", "unknown"].includes(st.state)) state = "offline";
    // Without a door sensor nor a `collected` helper nothing tells the mail was collected: it counts as collected at
    // midnight, the box empty again the next day.
    else if (lastA != null && (lastC == null || lastA > lastC) && (c.door || c.collected || lastA >= d0)) state = "mail";
    else if (lastC != null && lastC >= d0) state = "collected";
    else state = "empty";
    const week = Array.from({ length: 7 }, (_, i) => {
      const t = mbDay(now, i - 6);
      const day = ev.arrivals.filter((a) => a >= t && a < mbDay(now, i - 5));
      return { t, n: day.length, first: day[0] ?? null };
    });
    const pid = this._parcelsId();
    const pst = pid ? h.states[pid] : undefined;
    return {
      id,
      none: state === "none",
      state,
      name: c.title || this._t("title"),
      lastA,
      lastC,
      now,
      week,
      weekDays: week.filter((d) => d.n).length,
      pid: pst ? pid : null,
      parcels: pst ? mbParcels(pst, now) : [],
      canCollect: state === "mail" && !!c.collected && /^input_(button|datetime)\./.test(c.collected) && !!h.states[c.collected],
    };
  }

  _dark() {
    return !!this._hass.themes?.darkMode;
  }

  // The banner's night: forced by `illustration_theme`, else Home Assistant's dark theme alone.
  _night() {
    const theme = this._config.illustration_theme;
    if (theme === "night" || theme === "day") return theme === "night";
    return this._dark();
  }

  _animate() {
    if (this._config.animations === false) return false;
    try {
      return !window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    } catch {
      return true;
    }
  }

  // The illustrated header: the badge (the state's icon, in the state's colour), the title and `sub` on the sky at the
  // left, the fence and the mailbox at the right (`right`: something else in their place), a 10 px gravel strip.
  _banner(m, sub, pill = "", right = null) {
    const c = this._config;
    const nav = c.navigation_path;
    const night = this._night();
    const chip = pill ? `<span class="bpill" title="${rcEsc(pill)}" aria-label="${rcEsc(pill)}"><span class="bdot"></span><span class="bpt">${rcEsc(pill)}</span></span>` : "";
    const scene = right ?? `<svg class="room" viewBox="0 0 200 80" preserveAspectRatio="xMaxYMax slice" aria-hidden="true">${mbScene({ night, up: m.state === "mail", animate: this._animate() })}</svg>`;
    return `
      <div class="banner${night ? " night" : ""}">
        <div class="head${nav ? " nav" : ""}"${nav ? ' role="link" tabindex="0"' : ""}>
          <div class="badge"><ha-icon icon="${MB_ICONS[m.state]}"></ha-icon></div>
          <div class="tt"><div class="trow"><div class="title">${rcEsc(m.name)}</div>${chip}</div>${sub}</div>
        </div>
        ${scene}
        <div class="ground"></div>
      </div>`;
  }

  // The status pill's place, on the banner and on the classic header (see mbPlacePill).
  _fitPill() {
    for (const row of this.shadowRoot?.querySelectorAll?.(".trow") || []) {
      const banner = row.closest(".banner");
      mbPlacePill(banner || row.closest(".head"), row, banner?.querySelector(".ground"));
    }
  }

  _sub(m) {
    if (m.state === "mail") return this._t("arrived_at", { t: this._when(m.lastA, m.now) });
    if (m.state === "collected") return this._t("collected_at", { t: this._hm(m.lastC) });
    if (m.state === "empty") return m.lastA != null ? this._t("last_mail", { d: this._when(m.lastA, m.now) }) : this._t("no_mail");
    return "";
  }

  // The mailbox, big: its flag, the letters inside, what it says and the Collected button.
  _hero(m) {
    const night = this._dark();
    const mail = m.state === "mail";
    const svg = `<svg class="box-svg" viewBox="0 0 170 150" role="img" aria-label="${rcEsc(this._t(mail ? "got_mail" : "no_mail"))}">
      <rect x="61" y="88" width="14" height="62" fill="${night ? "#4a3a30" : "#8a5a3b"}"/>${mbBox({ x: 14, y: 30, s: 2.14, night, up: mail, animate: this._animate(), letters: mail })}</svg>`;
    const head = this._t(mail ? "got_mail" : m.state === "collected" ? "mail_collected" : "no_mail");
    const line = this._sub(m);
    const wait = mail ? `<span class="wt">${rcEsc(this._t("waiting", { d: this._ago(m.lastA, m.now) }))}</span>` : "";
    const btn = m.canCollect ? `<button class="pb act-collect" data-k="collect">${rcEsc(this._t("collect"))}</button>` : "";
    return `<div class="box hero">${svg}<div class="ht"><span class="hh">${rcEsc(head)}</span>${line ? `<span class="hl">${rcEsc(line)}</span>` : ""}${wait}${btn}</div></div>`;
  }

  _tileRow(m) {
    const tile = (label, value, unit, sub, id) =>
      `<button class="xt"${id ? ` data-id="${rcEsc(id)}"` : ""}><span class="xl">${rcEsc(this._t(label))}</span><span class="xv">${rcEsc(value)}${unit ? `<small>${rcEsc(unit)}</small>` : ""}</span>${sub ? `<span class="xs">${rcEsc(sub)}</span>` : ""}</button>`;
    const arrived = m.lastA != null ? this._hm(m.lastA) : "—";
    const day = m.lastA == null ? "" : m.lastA >= mbDay(m.now) ? this._t("today") : m.lastA >= mbDay(m.now, -1) ? this._t("yesterday") : this._time(m.lastA, { weekday: "long" });
    const tiles = [
      tile("t_arrived", arrived, "", day, m.id),
      m.pid && tile("t_parcels", String(m.parcels.length), this._t("today"), this._t("from_parcel"), m.pid),
      tile("week", String(m.weekDays), "", this._tn("days_mail", m.weekDays), m.id),
    ].filter(Boolean);
    return `<div class="tiles" style="--n:${tiles.length}">${tiles.join("")}</div>`;
  }

  _parcelList(m) {
    if (!m.parcels.length) return "";
    const row = (p) => {
      const right = p.status === "delivered" ? `<span class="pr ok">${rcEsc(this._t("ps_delivered"))}</span>` : p.end ? `<span class="pr">${rcEsc(this._t("by_time", { t: this._hm(p.end) }))}</span>` : "";
      const status = this._t(`ps_${p.status}`) === `ps_${p.status}` ? this._t("ps_unknown") : this._t(`ps_${p.status}`);
      return `<div class="pi"><ha-icon icon="mdi:package-variant-closed"></ha-icon><span class="pt2"><b>${rcEsc(p.name)}</b><span>${rcEsc([p.carrier, status].filter(Boolean).join(" · "))}</span></span>${right}</div>`;
    };
    return `<div class="box pl"><div class="ph">${rcEsc(this._t("expected"))}</div>${m.parcels.map(row).join("")}</div>`;
  }

  // The last 7 days: a cell per day, red with mail, its first time under it.
  _week(m, cls = "") {
    const cells = m.week
      .map((d, i) => {
        const label = this._time(d.t, { weekday: "narrow" });
        const title = `${this._time(d.t, { weekday: "long" })}${d.first != null ? ` · ${this._hm(d.first)}` : ""}`;
        return `<span class="wd${d.n ? " on" : ""}${i === 6 ? " td" : ""}" title="${rcEsc(title)}"><span class="wc"></span><span class="wl">${rcEsc(label)}</span></span>`;
      })
      .join("");
    return `<div class="wk${cls}" aria-label="${rcEsc(this._t("week"))}">${cells}</div>`;
  }

  _draw(m) {
    const c = this._config;
    const status = this._t(`st_${m.state === "none" ? "offline" : m.state}`);
    const parts = [m.state, m.lastA, m.lastC, m.week, m.parcels, m.canCollect, Math.floor((m.now - (m.lastA || 0)) / 600000), this._night(), this._dark()];
    if (!this._changed(parts)) return;
    const sub = this._sub(m);
    const subHtml = c.show_subtitle !== false && sub ? `<div class="subt">${rcEsc(sub)}</div>` : "";
    const head =
      c.illustration !== false
        ? this._banner(m, subHtml, m.none ? "" : status)
        : `<div class="head${c.navigation_path ? " nav" : ""}"${c.navigation_path ? ' role="link" tabindex="0"' : ""}>
            <div class="badge"><ha-icon icon="${MB_ICONS[m.state]}"></ha-icon></div>
            <div class="tt"><div class="trow"><div class="title">${rcEsc(m.name)}</div>${m.none ? "" : `<span class="pill" title="${rcEsc(status)}" aria-label="${rcEsc(status)}"><span class="pt">${rcEsc(status)}</span></span>`}</div>${subHtml}</div>
          </div>`;
    if (m.none) {
      this._paint("none", `${head}<div class="box none">${rcEsc(this._t("no_sensor"))}</div>`, "");
      this._fitPill();
      return;
    }
    const week = c.show_week !== false ? `<div class="box">${this._week(m)}</div>` : "";
    this._paint(m.state, head + this._hero(m) + this._tileRow(m) + this._parcelList(m) + week, "");
    this._fitPill();
  }

  _bindAfter(root) {
    for (const b of root.querySelectorAll(".xt[data-id]") || []) b.addEventListener("click", () => rcMoreInfo(this, b.dataset.id));
    root.querySelector(".act-collect")?.addEventListener("click", (ev) => {
      ev.stopPropagation();
      this._collectNow();
    });
  }

  // The Collected button: presses the input_button, or sets the input_datetime to now.
  _collectNow() {
    const id = this._config.collected;
    if (id.startsWith("input_button.")) rcCall(this._hass, "input_button", "press", { entity_id: id });
    else rcCall(this._hass, "input_datetime", "set_datetime", { entity_id: id, timestamp: Math.floor(Date.now() / 1000) });
  }

  static styles = `
    ha-card.lvl-mail { --c: #e03131; }
    ha-card.lvl-collected, ha-card.lvl-empty { --c: #2f9e44; }
    ha-card.lvl-offline, ha-card.lvl-none { --c: var(--rc-idle); }
    .tt { flex: 1 1 0; min-width: 5ch; display: flex; flex-direction: column; }
    .tt .title { flex: none; }
    .subt { font-size: 12px; color: var(--secondary-text-color); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    :host([hide-title]) .head .tt { visibility: hidden; }
    .box { margin-top: 10px; border-radius: 12px; padding: 10px 12px; background: var(--secondary-background-color, rgba(127,127,127,.08)); }
    .none { font-size: 13px; color: var(--secondary-text-color); }
    .hero { display: flex; align-items: center; gap: 14px; padding: 12px; }
    .box-svg { flex: none; width: 120px; height: auto; }
    .ht { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
    .hh { font-size: 22px; font-weight: 500; line-height: 1.15; color: var(--primary-text-color); }
    .hl { font-size: 14px; color: var(--secondary-text-color); }
    .wt { font-size: 13px; font-weight: 500; color: color-mix(in srgb, var(--c) 62%, var(--primary-text-color, #212121)); }
    .pb { all: unset; box-sizing: border-box; cursor: pointer; align-self: flex-start; display: inline-flex; align-items: center; min-height: 40px; margin-top: 4px; padding: 0 16px;
          border-radius: 999px; font-size: 14px; font-weight: 500; color: color-mix(in srgb, var(--c) 50%, var(--primary-text-color, #212121)); background: color-mix(in srgb, var(--c) 15%, transparent); }
    .pb:hover { background: color-mix(in srgb, var(--c) 24%, transparent); }
    .pb:focus-visible, .xt:focus-visible { outline: 2px solid var(--primary-color); outline-offset: 2px; }
    .tiles { display: grid; grid-template-columns: repeat(var(--n), minmax(0, 1fr)); gap: 8px; margin-top: 10px; }
    .xt { all: unset; box-sizing: border-box; cursor: pointer; min-width: 0; border-radius: 12px; padding: 9px 11px; display: flex; flex-direction: column; gap: 3px;
          background: var(--secondary-background-color, rgba(127,127,127,.08)); }
    .xl { font-size: 12px; color: var(--secondary-text-color); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .xv { font-size: 18px; font-weight: 500; line-height: 1.15; color: var(--primary-text-color); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .xv small { font-size: 12px; font-weight: 400; color: var(--secondary-text-color); margin-left: 4px; }
    .xs { font-size: 12px; color: var(--secondary-text-color); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .ph { font-size: 12px; color: var(--secondary-text-color); margin-bottom: 2px; }
    .pi { display: flex; align-items: center; gap: 10px; padding: 7px 0; border-top: 1px solid var(--divider-color, rgba(127,127,127,.2)); }
    .pi ha-icon { --mdc-icon-size: 20px; color: var(--secondary-text-color); flex: none; }
    .pt2 { flex: 1; min-width: 0; display: flex; flex-direction: column; }
    .pt2 b { font-size: 14px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .pt2 span { font-size: 12px; color: var(--secondary-text-color); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .pr { flex: none; font-size: 13px; font-weight: 500; color: var(--primary-text-color); }
    .pr.ok { color: color-mix(in srgb, #2f9e44 65%, var(--primary-text-color, #212121)); }
    .wk { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 6px; }
    .wd { display: flex; flex-direction: column; align-items: center; gap: 4px; min-width: 0; }
    .wc { width: 100%; height: 22px; border-radius: 6px; background: rgba(127,127,127,.18); }
    .wd.on .wc { background: #e03131; }
    .wd.td .wc { box-shadow: 0 0 0 2px var(--card-background-color, #fff), 0 0 0 3px var(--primary-text-color); }
    .wl { font-size: 11px; color: var(--secondary-text-color); }
    @container (max-width: 340px) {
      .box-svg { width: 84px; }
      .hh { font-size: 18px; }
      .tiles { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .tiles > :nth-child(3):last-child { grid-column: 1 / -1; }
    }
    /* Illustrated header (banner): 90 px, edge to edge, the title on the sky, the fence and the mailbox at the
       right, a 10 px gravel strip at the bottom. The badge's icon is in the state's colour, grey when idle, by day and night. */
    .banner { position: relative; display: flex; height: 90px; margin: -12px -12px 0; overflow: hidden;
              background: linear-gradient(180deg, #e3f1fb 0%, #d1e8f5 100%);
              --bt: #0d2a45; --bs: #3b5b78; --ic: color-mix(in srgb, var(--c) 85%, #10283f); --sw: min(200px, 56%); }
    .banner.night { background: linear-gradient(180deg, #142339 0%, #1d3150 100%); --bt: #fff; --bs: rgba(255,255,255,.78); --ic: color-mix(in srgb, var(--c) 72%, #fff); }
    .lvl-offline .banner, .lvl-none .banner { --ic: #6b7680; }
    .lvl-offline .banner.night, .lvl-none .banner.night { --ic: #a7b0b8; }
    .banner .head { position: relative; z-index: 1; flex: 1; min-width: 0; height: 80px; box-sizing: border-box;
                    padding: 0 calc(var(--sw) + 4px) 0 14px; flex-wrap: nowrap; }
    .banner .head::after { content: none; }
    .banner .badge { position: relative; color: var(--ic); background: rgba(255,255,255,.62); box-shadow: inset 0 0 0 1px rgba(13,42,69,.12); }
    .banner.night .badge { background: rgba(255,255,255,.12); box-shadow: inset 0 0 0 1px rgba(255,255,255,.14); }
    .banner .title { color: var(--bt); }
    .banner .subt { color: var(--bs); font-size: 13px; }
    .banner .room { position: absolute; right: 0; bottom: 10px; width: var(--sw); height: calc(80px * var(--sk, 1)); }
    .banner .ground { position: absolute; left: 0; right: 0; bottom: 0; height: 10px; background: repeating-linear-gradient(90deg, #b9ad9a 0 30px, #a99c87 30px 32px); }
    .banner.night .ground { background: repeating-linear-gradient(90deg, #3a3631 0 30px, #2e2b27 30px 32px); }
    /* The mini card's expand / collapse button: 24 px, frosted, 5 px from the banner's top right corner. */
    .banner .zoom { position: absolute; z-index: 2; top: 5px; right: 5px; width: 24px; height: 24px; margin: 0; color: #33506b;
                    background: rgba(255,255,255,.55); box-shadow: inset 0 0 0 1px rgba(255,255,255,.7); backdrop-filter: blur(4px); }
    .banner.night .zoom { color: #fff; background: rgba(255,255,255,.12); box-shadow: inset 0 0 0 1px rgba(255,255,255,.2); }
    .banner .zoom:hover { background: rgba(255,255,255,.75); color: #33506b; }
    .banner.night .zoom:hover { background: rgba(255,255,255,.22); color: #fff; }
    .banner .tt { min-width: 0; flex: 1 1 auto; }
    /* Status pill right after the title (see mbPlacePill). */
    .trow { display: flex; align-items: center; gap: 8px; min-width: 0; }
    .trow > .title { flex: 0 1 auto; min-width: 0; }
    .trow > .bpill, .trow > .pill { flex: none; max-width: none; }
    :host([hide-title]) .trow .title { visibility: hidden; }
    .head:has(.trow) { flex-wrap: nowrap; }
    .head:has(.trow)::after { content: none; }
    .bpill { display: inline-flex; align-items: center; gap: 4px; min-width: 0; box-sizing: border-box; overflow: hidden;
             white-space: nowrap; padding: 1px 8px; border-radius: 12px; font-size: 11px; font-weight: 500; line-height: 16px;
             background: color-mix(in srgb, var(--c) 18%, rgba(255,255,255,.78)); color: color-mix(in srgb, var(--c) 45%, #0d2a45); }
    .banner.night .bpill { background: color-mix(in srgb, var(--c) 30%, rgba(8,18,38,.55)); color: color-mix(in srgb, var(--c) 35%, #ffffff); }
    .bdot { width: 7px; height: 7px; border-radius: 50%; background: var(--c); flex: none; }
    .bpt { min-width: 0; overflow: hidden; text-overflow: ellipsis; }
    [data-wrap] .trow { display: contents; }
    [data-wrap] .trow > .bpill, [data-wrap] .trow > .pill { order: 9; align-self: flex-start; max-width: 100%; margin-top: 3px; }
    .banner[data-wrap] .trow > .bpill { max-width: calc(100cqw - 80px); }
    [data-wrap] .subt { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    [data-dot] .bpill { padding: 0; background: none; }
    [data-dot] .bpt, [data-dot] .trow > .pill .pt { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); }
    [data-dot] .trow > .pill { padding: 0; width: 18px; height: 18px; justify-content: center; background: none; }
    [data-dot] .trow > .pill::before { content: ""; width: 8px; height: 8px; border-radius: 50%; background: var(--c); }
    @container (max-width: 200px) {
      .bpill { padding: 0; background: none; }
      .bpt, .trow > .pill .pt { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); }
      .trow > .pill { padding: 0; width: 18px; height: 18px; justify-content: center; background: none; }
      .trow > .pill::before { content: ""; width: 8px; height: 8px; border-radius: 50%; background: var(--c); }
    }
    /* The mini card: the banner alone, its readings as chips on the sky. */
    ha-card.bn { padding: 0; }
    ha-card.bn > .banner { margin: 0; --sw: min(200px, 46%); }
    /* Narrower cards: the fence is drawn smaller (75 %, 62 %, then 50 % of its height, its left part cropped). */
    @container (max-width: 420px) { .banner, ha-card.bn > .banner { --sw: 150px; --sk: .75; } }
    @container (max-width: 340px) { .banner, ha-card.bn > .banner { --sw: 112px; --sk: .62; } }
    @container (max-width: 260px) { .banner, ha-card.bn > .banner { --sw: 70px; --sk: .5; } }
    /* The chips that do not fit wrap to a second line, hidden: never a chip cut to "R…". */
    .banner .rs { display: flex; flex-wrap: wrap; gap: 4px; height: 20px; margin: 3px 0 0 -2px; min-width: 0; overflow: hidden; }
    .banner .r { flex: none; line-height: 20px; padding: 0 7px; color: var(--bt); background: rgba(255,255,255,.62); }
    .banner.night .r { background: rgba(10,20,40,.4); }
    /* The mini card's week: on the banner's right, in place of the fence. */
    .banner .wk.wkm { position: absolute; right: 40px; bottom: 18px; width: min(150px, 34%); gap: 3px; }
    .banner .wk.wkm .wc { height: 22px; border-radius: 5px; background: rgba(255,255,255,.8); }
    .banner.night .wk.wkm .wc { background: rgba(255,255,255,.14); }
    .banner .wk.wkm .wd.on .wc { background: #e03131; }
    .banner .wk.wkm .wd.td .wc { box-shadow: 0 0 0 2px #fff; }
    .banner .wk.wkm .wl { display: none; }
    @container (max-width: 340px) { .banner .wk.wkm { display: none; } }
  `;
}

// ── Editor ───────────────────────────────────────────────────────────────────
const mbSchema = (booleans) => (lang) => [
  { name: "entity", selector: { entity: { domain: "binary_sensor" } } },
  { name: "title", selector: { text: {} } },
  { name: "navigation_path", selector: { navigation: {} } },
  { name: "door", selector: { entity: { domain: "binary_sensor" } } },
  { name: "collected", selector: { entity: { domain: ["input_button", "input_datetime"] } } },
  { name: "parcels", selector: { entity: { domain: "sensor" } } },
  ...rcBooleans(...booleans),
  {
    name: "illustration_theme",
    selector: { select: { mode: "dropdown", options: ["auto", "day", "night"].map((value) => ({ value, label: rcT(MB_I18N, lang, `ed_theme_${value}`) })) } },
  },
  ...rcAdvanced(MB_I18N, lang, "language"),
];

const MB_HELPERS = ["entity", "title", "door", "collected", "parcels", "zoom", "language"];

const MailboxCardEditor = rcEditor({
  card: MailboxCard,
  helpers: MB_HELPERS,
  schema: mbSchema(["show_title", "show_subtitle", "illustration", "show_week", "animations"]),
});

rcRegister(MailboxCard, MailboxCardEditor, "Mailbox Card", "A connected mailbox, illustrated: the flag up when mail has come, the time it came, the parcels expected today and the last 7 days");

// ── Mini card ────────────────────────────────────────────────────────────────
// The mailbox on two lines: the badge, the title and the state, then since when mail waits (or the last mail) and the
// parcels as chips; the last 7 days on the banner's right; the zoom button opens the full card in place.
class MailboxMiniCard extends rcMini(MailboxCard, "mailbox-mini-card", "") {
  getCardSize() {
    return this._zoomed ? super.getCardSize() : 1;
  }

  _drawMini(m) {
    const night = this._night();
    if (!this._changed(["mini", m.state, m.lastA, m.lastC, m.week, m.parcels.length, night, this._dark()])) return;
    const status = this._t(`st_${m.state === "none" ? "offline" : m.state}`);
    const chip = (text, id) => `<button class="r"${id ? ` data-id="${rcEsc(id)}"` : ""} title="${rcEsc(text)}"><span>${rcEsc(text)}</span></button>`;
    const first =
      m.none ? this._t("no_sensor") : m.state === "mail" ? this._t("waiting_since", { t: this._when(m.lastA, m.now) }) : m.lastA != null ? this._t("last_mail", { d: this._when(m.lastA, m.now) }) : this._t("no_mail");
    const n = m.parcels.length;
    const chips = chip(first, m.id) + (n ? chip(this._tn("parcels", n), m.pid) : "");
    const c = this._config;
    this.shadowRoot.innerHTML = `<style>${RC_BASE_STYLES}${this.constructor.styles}</style>
      <ha-card class="lvl-${m.state} bn">${this._banner(m, `<div class="rs">${chips}</div>`, m.none ? "" : status, m.none ? "" : this._week(m, " wkm"))}</ha-card>`;
    const root = this.shadowRoot;
    if (c.navigation_path) rcBindNav(root.querySelector(".head"), c.navigation_path);
    for (const el of root.querySelectorAll(".r[data-id]")) el.addEventListener("click", () => rcMoreInfo(this, el.dataset.id));
    this._fitPill();
  }
}

const MailboxMiniCardEditor = rcEditor({
  card: MailboxMiniCard,
  helpers: MB_HELPERS,
  schema: mbSchema(["show_title", "show_subtitle", "illustration", "show_week", "animations", "zoom"]),
});

rcRegister(
  MailboxMiniCard,
  MailboxMiniCardEditor,
  "Mailbox Mini Card",
  "The mailbox on two lines: since when mail waits, the parcels and the last 7 days, with a zoom to the full card",
);
