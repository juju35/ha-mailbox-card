/**
 * Shared by the mailbox cards (its names are used by the other src/ files): the mailbox's sensors and events, i18n helpers,
 * the base card (header, tiles, tap / hold), the mini card, the visual editor and the common styles. Same base as ha-room-card.
 * https://github.com/juju35/ha-mailbox-card
 */
const RC_VERSION = "__VERSION__";

const RC_HOLD_MS = 500;
const RC_MOVE_PX = 8;
// A held arrow key repeats some 30 times a second: one brightness step every RC_REPEAT_MS at most.
const RC_REPEAT_MS = 150;

// ── Overviews ────────────────────────────────────────────────────────────────
// Shared by room-overview-card and room-environment-overview-card.

// The zoom / detail button: the same icons on the overviews and the mini cards.
const rcZoomIcon = (card) => (card._zoomed ? "mdi:arrow-collapse" : "mdi:arrow-expand");

// Back to the compact view (mini card, or overview showing the rooms needing a look), when zoomed in.
const rcUnzoom = (card) => {
  if (!card._zoomed) return;
  card._zoomed = false;
  card._sig = null;
  card._render();
};

// True for a click outside `card` that is not in a dialog opened from it (more-info, say): it folds the card back.
const rcOutside = (card, ev) => !ev.composedPath().includes(card) && !rcInDialog(ev);

// "A click elsewhere" is caught on the pointer, not only on the click event: on iOS (Safari and the companion app)
// a tap on something that is not clickable (the background, an empty spot, a card with no action) sends no click to
// the page. The handler runs when the press and the release are both outside the card (a slider dragged out of the
// card does not count), and a scroll does not count (the browser cancels the pointer); keyboard clicks still go
// through the click event. The handler keeps its own checks (outside of the card, not in a dialog).
const watchOutside = (card, handler) => {
  let downOutside = false;
  const onDown = (ev) => {
    downOutside = !ev.composedPath().includes(card);
  };
  const onUp = (ev) => {
    if (downOutside) handler(ev);
    downOutside = false;
  };
  const onClick = (ev) => {
    if (ev.detail === 0) handler(ev);
  };
  return {
    on() {
      document.addEventListener("pointerdown", onDown, true);
      document.addEventListener("pointerup", onUp, true);
      document.addEventListener("click", onClick, true);
    },
    off() {
      document.removeEventListener("pointerdown", onDown, true);
      document.removeEventListener("pointerup", onUp, true);
      document.removeEventListener("click", onClick, true);
    },
    // A tap (press and release at the same spot), for the tests.
    tap(ev) {
      onDown(ev);
      onUp(ev);
    },
  };
};

// A click on the detail button: every room, or back to the rooms needing a look. True when handled.
const rcZoomClick = (card, ev) => {
  if (!ev.target.closest?.(".zoom")) return false;
  ev.stopPropagation();
  card._zoomed = !card._zoomed;
  card._sig = null;
  card._render();
  if (ev.detail === 0) card.shadowRoot.querySelector(".zoom")?.focus({ preventScroll: true });
  return true;
};

// ── i18n ─────────────────────────────────────────────────────────────────────
// Strings shared by the cards; a card's own dictionary wins over these.
const RC_I18N = {
  en: {
    unavailable: "Unavailable",
    turn_all_off: "Turn everything off",
    ed_title: "Title",
    ed_show_title: "Show title",
    ed_advanced: "Advanced",
    ed_language: "Language",
    ed_language_helper: "Empty: the Home Assistant language",
    ed_language_auto: "Automatic",
    ed_navigation_path: "Navigation path",
    err_config: "Set `area` or `entities`",
    zoom_in: "Show the full card",
    zoom_out: "Back to the compact view",
    ed_zoom: "Zoom button",
    ed_zoom_helper: "Switches the mini card to the full card and back",
  },
  fr: {
    unavailable: "Indisponible",
    turn_all_off: "Tout éteindre",
    ed_title: "Titre",
    ed_show_title: "Afficher le titre",
    ed_advanced: "Avancé",
    ed_language: "Langue",
    ed_language_helper: "Vide : la langue de Home Assistant",
    ed_language_auto: "Automatique",
    ed_navigation_path: "Chemin de navigation",
    err_config: "Définis `area` ou `entities`",
    zoom_in: "Afficher la carte complète",
    zoom_out: "Revenir à la vue compacte",
    ed_zoom: "Bouton zoom",
    ed_zoom_helper: "Bascule la mini-carte en carte complète, et inversement",
  },
  de: {
    unavailable: "Nicht verfügbar",
    turn_all_off: "Alles ausschalten",
    ed_title: "Titel",
    ed_show_title: "Titel anzeigen",
    ed_advanced: "Erweitert",
    ed_language: "Sprache",
    ed_language_helper: "Leer: die Sprache von Home Assistant",
    ed_language_auto: "Automatisch",
    ed_navigation_path: "Navigationspfad",
    err_config: "Lege `area` oder `entities` fest",
    zoom_in: "Vollständige Karte anzeigen",
    zoom_out: "Zurück zur kompakten Ansicht",
    ed_zoom: "Zoom-Schaltfläche",
    ed_zoom_helper: "Wechselt von der Mini-Karte zur vollständigen Karte und zurück",
  },
  es: {
    unavailable: "No disponible",
    turn_all_off: "Apagar todo",
    ed_title: "Título",
    ed_show_title: "Mostrar el título",
    ed_advanced: "Avanzado",
    ed_language: "Idioma",
    ed_language_helper: "Vacío: el idioma de Home Assistant",
    ed_language_auto: "Automático",
    ed_navigation_path: "Ruta de navegación",
    err_config: "Define `area` o `entities`",
    zoom_in: "Mostrar la tarjeta completa",
    zoom_out: "Volver a la vista compacta",
    ed_zoom: "Botón de zoom",
    ed_zoom_helper: "Cambia de la minitarjeta a la tarjeta completa y viceversa",
  },
  sr: {
    unavailable: "Недоступно",
    turn_all_off: "Искључи све",
    ed_title: "Наслов",
    ed_show_title: "Прикажи наслов",
    ed_advanced: "Напредно",
    ed_language: "Језик",
    ed_language_helper: "Празно: језик Home Assistant-а",
    ed_language_auto: "Аутоматски",
    ed_navigation_path: "Путања за навигацију",
    err_config: "Подесите `area` или `entities`",
    zoom_in: "Прикажи целу картицу",
    zoom_out: "Назад на компактни приказ",
    ed_zoom: "Дугме за увећање",
    ed_zoom_helper: "Пребацује мини картицу на пун приказ и назад",
  },
  "sr-Latn": {
    unavailable: "Nedostupno",
    turn_all_off: "Isključi sve",
    ed_title: "Naslov",
    ed_show_title: "Prikaži naslov",
    ed_advanced: "Napredno",
    ed_language: "Jezik",
    ed_language_helper: "Prazno: jezik Home Assistant-a",
    ed_language_auto: "Automatski",
    ed_navigation_path: "Putanja za navigaciju",
    err_config: "Podesite `area` ili `entities`",
    zoom_in: "Prikaži celu karticu",
    zoom_out: "Nazad na kompaktni prikaz",
    ed_zoom: "Dugme za uvećanje",
    ed_zoom_helper: "Prebacuje mini karticu na pun prikaz i nazad",
  },
  it: {
    unavailable: "Non disponibile",
    turn_all_off: "Spegni tutto",
    ed_title: "Titolo",
    ed_show_title: "Mostra il titolo",
    ed_advanced: "Avanzate",
    ed_language: "Lingua",
    ed_language_helper: "Vuoto: la lingua di Home Assistant",
    ed_language_auto: "Automatica",
    ed_navigation_path: "Percorso di navigazione",
    err_config: "Imposta `area` o `entities`",
    zoom_in: "Mostra la scheda completa",
    zoom_out: "Torna alla vista compatta",
    ed_zoom: "Pulsante zoom",
    ed_zoom_helper: "Passa dalla mini scheda alla scheda completa e viceversa",
  },
  nl: {
    unavailable: "Niet beschikbaar",
    turn_all_off: "Alles uitschakelen",
    ed_title: "Titel",
    ed_show_title: "Titel tonen",
    ed_advanced: "Geavanceerd",
    ed_language: "Taal",
    ed_language_helper: "Leeg: de taal van Home Assistant",
    ed_language_auto: "Automatisch",
    ed_navigation_path: "Navigatiepad",
    err_config: "Stel `area` of `entities` in",
    zoom_in: "Volledige kaart tonen",
    zoom_out: "Terug naar de compacte weergave",
    ed_zoom: "Zoomknop",
    ed_zoom_helper: "Schakelt de minikaart naar de volledige kaart en terug",
  },
  pt: {
    unavailable: "Indisponível",
    turn_all_off: "Desligar tudo",
    ed_title: "Título",
    ed_show_title: "Mostrar o título",
    ed_advanced: "Avançado",
    ed_language: "Idioma",
    ed_language_helper: "Vazio: o idioma do Home Assistant",
    ed_language_auto: "Automático",
    ed_navigation_path: "Caminho de navegação",
    err_config: "Defina `area` ou `entities`",
    zoom_in: "Mostrar o cartão completo",
    zoom_out: "Voltar à vista compacta",
    ed_zoom: "Botão de zoom",
    ed_zoom_helper: "Alterna entre o minicartão e o cartão completo",
  },
  pl: {
    unavailable: "Niedostępne",
    turn_all_off: "Wyłącz wszystko",
    ed_title: "Tytuł",
    ed_show_title: "Pokaż tytuł",
    ed_advanced: "Zaawansowane",
    ed_language: "Język",
    ed_language_helper: "Puste: język Home Assistanta",
    ed_language_auto: "Automatyczny",
    ed_navigation_path: "Ścieżka nawigacji",
    err_config: "Ustaw `area` lub `entities`",
    zoom_in: "Pokaż pełną kartę",
    zoom_out: "Wróć do widoku kompaktowego",
    ed_zoom: "Przycisk powiększenia",
    ed_zoom_helper: "Przełącza minikartę na pełną kartę i z powrotem",
  },
  ro: {
    unavailable: "Indisponibil",
    turn_all_off: "Oprește tot",
    ed_title: "Titlu",
    ed_show_title: "Afișează titlul",
    ed_advanced: "Avansat",
    ed_language: "Limbă",
    ed_language_helper: "Gol: limba Home Assistant",
    ed_language_auto: "Automată",
    ed_navigation_path: "Cale de navigare",
    err_config: "Setează `area` sau `entities`",
    zoom_in: "Afișează cardul complet",
    zoom_out: "Înapoi la vizualizarea compactă",
    ed_zoom: "Buton de zoom",
    ed_zoom_helper: "Comută între mini-card și cardul complet",
  },
  da: {
    unavailable: "Utilgængelig",
    turn_all_off: "Sluk alt",
    ed_title: "Titel",
    ed_show_title: "Vis titel",
    ed_advanced: "Avanceret",
    ed_language: "Sprog",
    ed_language_helper: "Tomt: Home Assistants sprog",
    ed_language_auto: "Automatisk",
    ed_navigation_path: "Navigationssti",
    err_config: "Angiv `area` eller `entities`",
    zoom_in: "Vis hele kortet",
    zoom_out: "Tilbage til den kompakte visning",
    ed_zoom: "Zoomknap",
    ed_zoom_helper: "Skifter fra minikortet til hele kortet og tilbage",
  },
  sv: {
    unavailable: "Ej tillgänglig",
    turn_all_off: "Stäng av allt",
    ed_title: "Titel",
    ed_show_title: "Visa rubrik",
    ed_advanced: "Avancerat",
    ed_language: "Språk",
    ed_language_helper: "Tomt: Home Assistants språk",
    ed_language_auto: "Automatiskt",
    ed_navigation_path: "Navigeringssökväg",
    err_config: "Ange `area` eller `entities`",
    zoom_in: "Visa hela kortet",
    zoom_out: "Tillbaka till kompakt vy",
    ed_zoom: "Zoomknapp",
    ed_zoom_helper: "Växlar mellan minikortet och hela kortet",
  },
  bg: {
    unavailable: "Недостъпно",
    turn_all_off: "Изключи всичко",
    ed_title: "Заглавие",
    ed_show_title: "Показване на заглавието",
    ed_advanced: "Разширени",
    ed_language: "Език",
    ed_language_helper: "Празно: езикът на Home Assistant",
    ed_language_auto: "Автоматично",
    ed_navigation_path: "Път за навигация",
    err_config: "Задайте `area` или `entities`",
    zoom_in: "Покажи пълната карта",
    zoom_out: "Обратно към компактния изглед",
    ed_zoom: "Бутон за увеличение",
    ed_zoom_helper: "Превключва от мини картата към пълната карта и обратно",
  },
  ru: {
    unavailable: "Недоступно",
    turn_all_off: "Выключить всё",
    ed_title: "Заголовок",
    ed_show_title: "Показывать заголовок",
    ed_advanced: "Дополнительно",
    ed_language: "Язык",
    ed_language_helper: "Пусто: язык Home Assistant",
    ed_language_auto: "Автоматически",
    ed_navigation_path: "Путь навигации",
    err_config: "Укажите `area` или `entities`",
    zoom_in: "Показать полную карточку",
    zoom_out: "Вернуться к компактному виду",
    ed_zoom: "Кнопка масштаба",
    ed_zoom_helper: "Переключает мини-карточку на полную карточку и обратно",
  },
  uk: {
    unavailable: "Недоступно",
    turn_all_off: "Вимкнути все",
    ed_title: "Заголовок",
    ed_show_title: "Показувати заголовок",
    ed_advanced: "Додатково",
    ed_language: "Мова",
    ed_language_helper: "Порожньо: мова Home Assistant",
    ed_language_auto: "Автоматично",
    ed_navigation_path: "Шлях навігації",
    err_config: "Вкажіть `area` або `entities`",
    zoom_in: "Показати повну картку",
    zoom_out: "Повернутися до компактного вигляду",
    ed_zoom: "Кнопка масштабу",
    ed_zoom_helper: "Перемикає міні-картку на повну картку й назад",
  },
  hu: {
    unavailable: "Nem elérhető",
    turn_all_off: "Minden kikapcsolása",
    ed_title: "Cím",
    ed_show_title: "Cím megjelenítése",
    ed_advanced: "Speciális",
    ed_language: "Nyelv",
    ed_language_helper: "Üres: a Home Assistant nyelve",
    ed_language_auto: "Automatikus",
    ed_navigation_path: "Navigációs útvonal",
    err_config: "Állítsd be az `area` vagy az `entities` értékét",
    zoom_in: "A teljes kártya megjelenítése",
    zoom_out: "Vissza a kompakt nézethez",
    ed_zoom: "Nagyítás gomb",
    ed_zoom_helper: "Vált a mini kártya és a teljes kártya között",
  },
  sk: {
    unavailable: "Nedostupné",
    turn_all_off: "Vypnúť všetko",
    ed_title: "Názov",
    ed_show_title: "Zobraziť názov",
    ed_advanced: "Rozšírené",
    ed_language: "Jazyk",
    ed_language_helper: "Prázdne: jazyk Home Assistanta",
    ed_language_auto: "Automaticky",
    ed_navigation_path: "Navigačná cesta",
    err_config: "Nastavte `area` alebo `entities`",
    zoom_in: "Zobraziť celú kartu",
    zoom_out: "Späť na kompaktné zobrazenie",
    ed_zoom: "Tlačidlo priblíženia",
    ed_zoom_helper: "Prepína minikartu na celú kartu a späť",
  },
  cs: {
    unavailable: "Nedostupné",
    turn_all_off: "Vypnout vše",
    ed_title: "Název",
    ed_show_title: "Zobrazit název",
    ed_advanced: "Pokročilé",
    ed_language: "Jazyk",
    ed_language_helper: "Prázdné: jazyk Home Assistanta",
    ed_language_auto: "Automaticky",
    ed_navigation_path: "Navigační cesta",
    err_config: "Nastavte `area` nebo `entities`",
    zoom_in: "Zobrazit celou kartu",
    zoom_out: "Zpět na kompaktní zobrazení",
    ed_zoom: "Tlačítko přiblížení",
    ed_zoom_helper: "Přepíná minikartu na celou kartu a zpět",
  },
  sl: {
    unavailable: "Ni na voljo",
    turn_all_off: "Izklopi vse",
    ed_title: "Naslov",
    ed_show_title: "Prikaži naslov",
    ed_advanced: "Napredno",
    ed_language: "Jezik",
    ed_language_helper: "Prazno: jezik Home Assistanta",
    ed_language_auto: "Samodejno",
    ed_navigation_path: "Navigacijska pot",
    err_config: "Nastavite `area` ali `entities`",
    zoom_in: "Prikaži celotno kartico",
    zoom_out: "Nazaj na strnjen pogled",
    ed_zoom: "Gumb za povečavo",
    ed_zoom_helper: "Preklopi mini kartico v celotno kartico in nazaj",
  },
  lv: {
    unavailable: "Nav pieejams",
    turn_all_off: "Izslēgt visu",
    ed_title: "Virsraksts",
    ed_show_title: "Rādīt virsrakstu",
    ed_advanced: "Papildu",
    ed_language: "Valoda",
    ed_language_helper: "Tukšs: Home Assistant valoda",
    ed_language_auto: "Automātiski",
    ed_navigation_path: "Navigācijas ceļš",
    err_config: "Iestatiet `area` vai `entities`",
    zoom_in: "Rādīt pilno karti",
    zoom_out: "Atpakaļ uz kompakto skatu",
    ed_zoom: "Tālummaiņas poga",
    ed_zoom_helper: "Pārslēdz mini karti uz pilno karti un atpakaļ",
  },
  el: {
    unavailable: "Μη διαθέσιμο",
    turn_all_off: "Απενεργοποίηση όλων",
    ed_title: "Τίτλος",
    ed_show_title: "Εμφάνιση τίτλου",
    ed_advanced: "Για προχωρημένους",
    ed_language: "Γλώσσα",
    ed_language_helper: "Κενό: η γλώσσα του Home Assistant",
    ed_language_auto: "Αυτόματα",
    ed_navigation_path: "Διαδρομή πλοήγησης",
    err_config: "Ορίστε `area` ή `entities`",
    zoom_in: "Εμφάνιση της πλήρους κάρτας",
    zoom_out: "Επιστροφή στη συμπαγή προβολή",
    ed_zoom: "Κουμπί ζουμ",
    ed_zoom_helper: "Εναλλάσσει τη μίνι κάρτα με την πλήρη κάρτα",
  },
};

// ── Mailbox ──────────────────────────────────────────────────────────────────
// A mailbox is any binary sensor on its flap (an opening, vibration or motion sensor): mail has come when it turns
// on. The mail is collected when the collection door's sensor turns on, or when the Collected button presses its
// helper (an input_button, whose state is the time it was pressed, or an input_datetime set to now). The events of
// the last 7 days come from the history (history/history_during_period). The parcels expected today come from the
// Parcel integration's deliveries sensor, when there is one.
const MB_NAME = /mail|letter|post|courrier|bo[iî]te|lettres|briefkasten|buz[oó]n|cassetta|brievenbus|skrzynk|schr[aá]nk|pošt|почт|γραμματ/i;
// Taps closer than this make one delivery (a flap swinging, a vibration sensor's bursts).
const MB_DEBOUNCE = 10 * 60 * 1000;
// Mail sensor events this close to a collection are the door being opened, not mail.
const MB_NEAR = 2 * 60 * 1000;
const MB_DAY = 24 * 3600 * 1000;

// The midnight `offset` days from the day of `t`, in the browser's time zone.
const mbDay = (t, offset = 0) => {
  const d = new Date(t);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + offset);
  return d.getTime();
};

// The mail sensors of the home, most likely first: binary sensors named like a mailbox.
const mbSensors = (hass) =>
  Object.keys(hass.states || {}).filter((id) => id.startsWith("binary_sensor.") && MB_NAME.test(`${id} ${hass.states[id].attributes?.friendly_name || ""}`) && !/door|porte|t[uü]r|collect|relev/i.test(id));

// The times (ms) a sensor turned on, from a history list ([{ s, lu }] minimal, or full states).
const mbOns = (list) => {
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
const mbEvents = (history, mailId, doorId, collected = null) => {
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

// The Parcel deliveries expected today (out for delivery, or expected today, or delivered today): name, carrier,
// status key and the end of the expected window.
const mbParcels = (st, now) => {
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

// Strings of the mailbox cards; the shared ones above (editor basics) complete them.
const MB_I18N = {
  en: {
    title: "Mailbox",
    st_mail: "Mail",
    st_empty: "Empty",
    st_collected: "Collected",
    st_offline: "Unavailable",
    got_mail: "You've got mail",
    no_mail: "No mail",
    mail_collected: "Mail collected",
    arrived_at: "Arrived at {t}",
    collected_at: "Collected at {t}",
    last_mail: "Last mail {d}",
    waiting: "Not collected yet · {d}",
    waiting_since: "Waiting since {t}",
    collect: "Collected",
    t_arrived: "Arrived",
    t_parcels: "Parcels",
    t_week: "This week",
    days_mail: "days with mail",
    today: "today",
    yesterday: "yesterday",
    from_parcel: "from Parcel",
    expected: "Expected today",
    by_time: "by {t}",
    parcels_one: "1 parcel",
    parcels_many: "{n} parcels",
    ago_min: "{n} min ago",
    ago_h: "{n} h ago",
    ago_d: "{n} d ago",
    week: "Last 7 days",
    no_sensor: "No mailbox sensor found",
    ps_out_for_delivery: "Out for delivery",
    ps_delivered: "Delivered",
    ps_in_transit: "In transit",
    ps_awaiting_pickup: "Awaiting pickup",
    ps_failed_attempt: "Failed attempt",
    ps_exception: "Problem",
    ps_info_received: "Label created",
    ps_frozen: "Paused",
    ps_not_found: "Not found",
    ps_unknown: "Unknown",
    ed_entity: "Mail sensor",
    ed_entity_helper: "The flap's opening, vibration or motion sensor: mail has come when it turns on",
    ed_door: "Collection door",
    ed_door_helper: "Optional: the door's sensor; opening it collects the mail",
    ed_collected: "Collected helper",
    ed_collected_helper: "Optional: an input_button or input_datetime that the Collected button sets",
    ed_parcels: "Parcel deliveries",
    ed_parcels_helper: "Optional: the Parcel integration's deliveries sensor (found by itself)",
    ed_show_week: "Last 7 days",
    ed_show_subtitle: "Show subtitle",
    ed_illustration: "Illustrated header",
    ed_illustration_theme: "Header theme",
    ed_theme_auto: "Automatic (follows the theme)",
    ed_theme_day: "Day",
    ed_theme_night: "Night",
    ed_animations: "Animations",
    ed_title_helper: "Empty: Mailbox",
  },
  fr: {
    title: "Boîte aux lettres",
    st_mail: "Courrier",
    st_empty: "Vide",
    st_collected: "Relevée",
    st_offline: "Indisponible",
    got_mail: "Du courrier est arrivé",
    no_mail: "Pas de courrier",
    mail_collected: "Courrier relevé",
    arrived_at: "Arrivé à {t}",
    collected_at: "Relevé à {t}",
    last_mail: "Dernier courrier {d}",
    waiting: "Pas encore relevé · {d}",
    waiting_since: "En attente depuis {t}",
    collect: "Relevé",
    t_arrived: "Arrivé",
    t_parcels: "Colis",
    t_week: "Cette semaine",
    days_mail: "jours avec courrier",
    today: "aujourd'hui",
    yesterday: "hier",
    from_parcel: "depuis Parcel",
    expected: "Attendus aujourd'hui",
    by_time: "avant {t}",
    parcels_one: "1 colis",
    parcels_many: "{n} colis",
    ago_min: "il y a {n} min",
    ago_h: "il y a {n} h",
    ago_d: "il y a {n} j",
    week: "7 derniers jours",
    no_sensor: "Aucun capteur de boîte aux lettres trouvé",
    ps_out_for_delivery: "En cours de livraison",
    ps_delivered: "Livré",
    ps_in_transit: "En transit",
    ps_awaiting_pickup: "À retirer",
    ps_failed_attempt: "Échec de livraison",
    ps_exception: "Problème",
    ps_info_received: "Étiquette créée",
    ps_frozen: "En pause",
    ps_not_found: "Introuvable",
    ps_unknown: "Inconnu",
    ed_entity: "Capteur du courrier",
    ed_entity_helper: "Le capteur d'ouverture, de vibration ou de mouvement du rabat : du courrier est arrivé quand il passe à on",
    ed_door: "Porte de relève",
    ed_door_helper: "Facultatif : le capteur de la porte ; l'ouvrir relève le courrier",
    ed_collected: "Assistant « relevé »",
    ed_collected_helper: "Facultatif : un input_button ou input_datetime que le bouton Relevé règle",
    ed_parcels: "Livraisons Parcel",
    ed_parcels_helper: "Facultatif : le capteur des livraisons de l'intégration Parcel (trouvé tout seul)",
    ed_show_week: "7 derniers jours",
    ed_show_subtitle: "Afficher le sous-titre",
    ed_illustration: "En-tête illustré",
    ed_illustration_theme: "Thème de l'en-tête",
    ed_theme_auto: "Automatique (suit le thème)",
    ed_theme_day: "Jour",
    ed_theme_night: "Nuit",
    ed_animations: "Animations",
    ed_title_helper: "Vide : Boîte aux lettres",
  },
  de: {
    title: "Briefkasten",
    st_mail: "Post",
    st_empty: "Leer",
    st_collected: "Geleert",
    st_offline: "Nicht verfügbar",
    got_mail: "Du hast Post",
    no_mail: "Keine Post",
    mail_collected: "Post geholt",
    arrived_at: "Angekommen um {t}",
    collected_at: "Geleert um {t}",
    last_mail: "Letzte Post {d}",
    waiting: "Noch nicht geholt · {d}",
    waiting_since: "Wartet seit {t}",
    collect: "Geholt",
    t_arrived: "Angekommen",
    t_parcels: "Pakete",
    t_week: "Diese Woche",
    days_mail: "Tage mit Post",
    today: "heute",
    yesterday: "gestern",
    from_parcel: "von Parcel",
    expected: "Heute erwartet",
    by_time: "bis {t}",
    parcels_one: "1 Paket",
    parcels_many: "{n} Pakete",
    ago_min: "vor {n} Min.",
    ago_h: "vor {n} Std.",
    ago_d: "vor {n} T.",
    week: "Letzte 7 Tage",
    no_sensor: "Kein Briefkastensensor gefunden",
    ps_out_for_delivery: "In Zustellung",
    ps_delivered: "Zugestellt",
    ps_in_transit: "Unterwegs",
    ps_awaiting_pickup: "Abholbereit",
    ps_failed_attempt: "Zustellversuch fehlgeschlagen",
    ps_exception: "Problem",
    ps_info_received: "Label erstellt",
    ps_frozen: "Pausiert",
    ps_not_found: "Nicht gefunden",
    ps_unknown: "Unbekannt",
    ed_entity: "Postsensor",
    ed_entity_helper: "Der Öffnungs-, Vibrations- oder Bewegungssensor der Klappe: Post ist da, wenn er auf ein schaltet",
    ed_door: "Entnahmetür",
    ed_door_helper: "Optional: der Sensor der Tür; ihr Öffnen leert den Briefkasten",
    ed_collected: "Helfer „Geholt“",
    ed_collected_helper: "Optional: ein input_button oder input_datetime, den die Schaltfläche Geholt setzt",
    ed_parcels: "Parcel-Lieferungen",
    ed_parcels_helper: "Optional: der Lieferungssensor der Parcel-Integration (wird selbst gefunden)",
    ed_show_week: "Letzte 7 Tage",
    ed_show_subtitle: "Untertitel anzeigen",
    ed_illustration: "Illustrierte Kopfzeile",
    ed_illustration_theme: "Design der Kopfzeile",
    ed_theme_auto: "Automatisch (folgt dem Design)",
    ed_theme_day: "Tag",
    ed_theme_night: "Nacht",
    ed_animations: "Animationen",
    ed_title_helper: "Leer: Briefkasten",
  },
  es: {
    title: "Buzón",
    st_mail: "Correo",
    st_empty: "Vacío",
    st_collected: "Recogido",
    st_offline: "No disponible",
    got_mail: "Tienes correo",
    no_mail: "Sin correo",
    mail_collected: "Correo recogido",
    arrived_at: "Llegó a las {t}",
    collected_at: "Recogido a las {t}",
    last_mail: "Último correo {d}",
    waiting: "Aún sin recoger · {d}",
    waiting_since: "Esperando desde {t}",
    collect: "Recogido",
    t_arrived: "Llegada",
    t_parcels: "Paquetes",
    t_week: "Esta semana",
    days_mail: "días con correo",
    today: "hoy",
    yesterday: "ayer",
    from_parcel: "desde Parcel",
    expected: "Previstos hoy",
    by_time: "antes de {t}",
    parcels_one: "1 paquete",
    parcels_many: "{n} paquetes",
    ago_min: "hace {n} min",
    ago_h: "hace {n} h",
    ago_d: "hace {n} d",
    week: "Últimos 7 días",
    no_sensor: "No se encontró ningún sensor de buzón",
    ps_out_for_delivery: "En reparto",
    ps_delivered: "Entregado",
    ps_in_transit: "En tránsito",
    ps_awaiting_pickup: "Listo para recoger",
    ps_failed_attempt: "Intento fallido",
    ps_exception: "Problema",
    ps_info_received: "Etiqueta creada",
    ps_frozen: "En pausa",
    ps_not_found: "No encontrado",
    ps_unknown: "Desconocido",
    ed_entity: "Sensor de correo",
    ed_entity_helper: "El sensor de apertura, vibración o movimiento de la trampilla: ha llegado correo cuando pasa a on",
    ed_door: "Puerta de recogida",
    ed_door_helper: "Opcional: el sensor de la puerta; abrirla recoge el correo",
    ed_collected: "Ayudante «recogido»",
    ed_collected_helper: "Opcional: un input_button o input_datetime que ajusta el botón Recogido",
    ed_parcels: "Envíos de Parcel",
    ed_parcels_helper: "Opcional: el sensor de envíos de la integración Parcel (se encuentra solo)",
    ed_show_week: "Últimos 7 días",
    ed_show_subtitle: "Mostrar subtítulo",
    ed_illustration: "Encabezado ilustrado",
    ed_illustration_theme: "Tema del encabezado",
    ed_theme_auto: "Automático (sigue el tema)",
    ed_theme_day: "Día",
    ed_theme_night: "Noche",
    ed_animations: "Animaciones",
    ed_title_helper: "Vacío: Buzón",
  },
  sr: {
    title: "Поштанско сандуче",
    st_mail: "Пошта",
    st_empty: "Празно",
    st_collected: "Испражњено",
    st_offline: "Недоступно",
    got_mail: "Стигла је пошта",
    no_mail: "Нема поште",
    mail_collected: "Пошта преузета",
    arrived_at: "Стигла у {t}",
    collected_at: "Испражњено у {t}",
    last_mail: "Последња пошта {d}",
    waiting: "Још није преузета · {d}",
    waiting_since: "Чека од {t}",
    collect: "Преузето",
    t_arrived: "Стигла",
    t_parcels: "Пакети",
    t_week: "Ове недеље",
    days_mail: "дана са поштом",
    today: "данас",
    yesterday: "јуче",
    from_parcel: "из Parcel-а",
    expected: "Очекује се данас",
    by_time: "до {t}",
    parcels_one: "1 пакет",
    parcels_many: "Пакети: {n}",
    ago_min: "пре {n} мин",
    ago_h: "пре {n} ч",
    ago_d: "пре {n} д",
    week: "Последњих 7 дана",
    no_sensor: "Није пронађен сензор поштанског сандучета",
    ps_out_for_delivery: "У испоруци",
    ps_delivered: "Испоручено",
    ps_in_transit: "У транзиту",
    ps_awaiting_pickup: "Чека преузимање",
    ps_failed_attempt: "Неуспешан покушај",
    ps_exception: "Проблем",
    ps_info_received: "Налепница направљена",
    ps_frozen: "Паузирано",
    ps_not_found: "Није пронађено",
    ps_unknown: "Непознато",
    ed_entity: "Сензор поште",
    ed_entity_helper: "Сензор отварања, вибрације или покрета поклопца: пошта је стигла када пређе у on",
    ed_door: "Врата за преузимање",
    ed_door_helper: "Опционо: сензор врата; њихово отварање преузима пошту",
    ed_collected: "Помоћник „преузето”",
    ed_collected_helper: "Опционо: input_button или input_datetime који подешава дугме Преузето",
    ed_parcels: "Пошиљке Parcel",
    ed_parcels_helper: "Опционо: сензор пошиљки интеграције Parcel (сам се проналази)",
    ed_show_week: "Последњих 7 дана",
    ed_show_subtitle: "Прикажи поднаслов",
    ed_illustration: "Илустровано заглавље",
    ed_illustration_theme: "Тема заглавља",
    ed_theme_auto: "Аутоматски (прати тему)",
    ed_theme_day: "Дан",
    ed_theme_night: "Ноћ",
    ed_animations: "Анимације",
    ed_title_helper: "Празно: Поштанско сандуче",
  },
  "sr-Latn": {
    title: "Poštansko sanduče",
    st_mail: "Pošta",
    st_empty: "Prazno",
    st_collected: "Ispražnjeno",
    st_offline: "Nedostupno",
    got_mail: "Stigla je pošta",
    no_mail: "Nema pošte",
    mail_collected: "Pošta preuzeta",
    arrived_at: "Stigla u {t}",
    collected_at: "Ispražnjeno u {t}",
    last_mail: "Poslednja pošta {d}",
    waiting: "Još nije preuzeta · {d}",
    waiting_since: "Čeka od {t}",
    collect: "Preuzeto",
    t_arrived: "Stigla",
    t_parcels: "Paketi",
    t_week: "Ove nedelje",
    days_mail: "dana sa poštom",
    today: "danas",
    yesterday: "juče",
    from_parcel: "iz Parcel-a",
    expected: "Očekuje se danas",
    by_time: "do {t}",
    parcels_one: "1 paket",
    parcels_many: "Paketi: {n}",
    ago_min: "pre {n} min",
    ago_h: "pre {n} č",
    ago_d: "pre {n} d",
    week: "Poslednjih 7 dana",
    no_sensor: "Nije pronađen senzor poštanskog sandučeta",
    ps_out_for_delivery: "U isporuci",
    ps_delivered: "Isporučeno",
    ps_in_transit: "U tranzitu",
    ps_awaiting_pickup: "Čeka preuzimanje",
    ps_failed_attempt: "Neuspešan pokušaj",
    ps_exception: "Problem",
    ps_info_received: "Nalepnica napravljena",
    ps_frozen: "Pauzirano",
    ps_not_found: "Nije pronađeno",
    ps_unknown: "Nepoznato",
    ed_entity: "Senzor pošte",
    ed_entity_helper: "Senzor otvaranja, vibracije ili pokreta poklopca: pošta je stigla kada pređe u on",
    ed_door: "Vrata za preuzimanje",
    ed_door_helper: "Opciono: senzor vrata; njihovo otvaranje preuzima poštu",
    ed_collected: "Pomoćnik „preuzeto”",
    ed_collected_helper: "Opciono: input_button ili input_datetime koji podešava dugme Preuzeto",
    ed_parcels: "Pošiljke Parcel",
    ed_parcels_helper: "Opciono: senzor pošiljki integracije Parcel (sam se pronalazi)",
    ed_show_week: "Poslednjih 7 dana",
    ed_show_subtitle: "Prikaži podnaslov",
    ed_illustration: "Ilustrovano zaglavlje",
    ed_illustration_theme: "Tema zaglavlja",
    ed_theme_auto: "Automatski (prati temu)",
    ed_theme_day: "Dan",
    ed_theme_night: "Noć",
    ed_animations: "Animacije",
    ed_title_helper: "Prazno: Poštansko sanduče",
  },
  it: {
    title: "Cassetta postale",
    st_mail: "Posta",
    st_empty: "Vuota",
    st_collected: "Ritirata",
    st_offline: "Non disponibile",
    got_mail: "È arrivata la posta",
    no_mail: "Nessuna posta",
    mail_collected: "Posta ritirata",
    arrived_at: "Arrivata alle {t}",
    collected_at: "Ritirata alle {t}",
    last_mail: "Ultima posta {d}",
    waiting: "Non ancora ritirata · {d}",
    waiting_since: "In attesa dalle {t}",
    collect: "Ritirata",
    t_arrived: "Arrivo",
    t_parcels: "Pacchi",
    t_week: "Questa settimana",
    days_mail: "giorni con posta",
    today: "oggi",
    yesterday: "ieri",
    from_parcel: "da Parcel",
    expected: "Attesi oggi",
    by_time: "entro le {t}",
    parcels_one: "1 pacco",
    parcels_many: "{n} pacchi",
    ago_min: "{n} min fa",
    ago_h: "{n} h fa",
    ago_d: "{n} g fa",
    week: "Ultimi 7 giorni",
    no_sensor: "Nessun sensore della cassetta postale trovato",
    ps_out_for_delivery: "In consegna",
    ps_delivered: "Consegnato",
    ps_in_transit: "In transito",
    ps_awaiting_pickup: "Da ritirare",
    ps_failed_attempt: "Tentativo fallito",
    ps_exception: "Problema",
    ps_info_received: "Etichetta creata",
    ps_frozen: "In pausa",
    ps_not_found: "Non trovato",
    ps_unknown: "Sconosciuto",
    ed_entity: "Sensore della posta",
    ed_entity_helper: "Il sensore di apertura, vibrazione o movimento dello sportello: la posta è arrivata quando passa a on",
    ed_door: "Sportello di ritiro",
    ed_door_helper: "Facoltativo: il sensore dello sportello; aprirlo ritira la posta",
    ed_collected: "Aiutante «ritirata»",
    ed_collected_helper: "Facoltativo: un input_button o input_datetime impostato dal pulsante Ritirata",
    ed_parcels: "Spedizioni Parcel",
    ed_parcels_helper: "Facoltativo: il sensore delle spedizioni dell'integrazione Parcel (trovato da solo)",
    ed_show_week: "Ultimi 7 giorni",
    ed_show_subtitle: "Mostra sottotitolo",
    ed_illustration: "Intestazione illustrata",
    ed_illustration_theme: "Tema dell'intestazione",
    ed_theme_auto: "Automatico (segue il tema)",
    ed_theme_day: "Giorno",
    ed_theme_night: "Notte",
    ed_animations: "Animazioni",
    ed_title_helper: "Vuoto: Cassetta postale",
  },
  nl: {
    title: "Brievenbus",
    st_mail: "Post",
    st_empty: "Leeg",
    st_collected: "Geleegd",
    st_offline: "Niet beschikbaar",
    got_mail: "Je hebt post",
    no_mail: "Geen post",
    mail_collected: "Post opgehaald",
    arrived_at: "Aangekomen om {t}",
    collected_at: "Geleegd om {t}",
    last_mail: "Laatste post {d}",
    waiting: "Nog niet opgehaald · {d}",
    waiting_since: "Wacht sinds {t}",
    collect: "Opgehaald",
    t_arrived: "Aangekomen",
    t_parcels: "Pakketten",
    t_week: "Deze week",
    days_mail: "dagen met post",
    today: "vandaag",
    yesterday: "gisteren",
    from_parcel: "van Parcel",
    expected: "Vandaag verwacht",
    by_time: "voor {t}",
    parcels_one: "1 pakket",
    parcels_many: "{n} pakketten",
    ago_min: "{n} min geleden",
    ago_h: "{n} u geleden",
    ago_d: "{n} d geleden",
    week: "Laatste 7 dagen",
    no_sensor: "Geen brievenbussensor gevonden",
    ps_out_for_delivery: "Onderweg naar jou",
    ps_delivered: "Bezorgd",
    ps_in_transit: "Onderweg",
    ps_awaiting_pickup: "Klaar om op te halen",
    ps_failed_attempt: "Bezorgpoging mislukt",
    ps_exception: "Probleem",
    ps_info_received: "Label aangemaakt",
    ps_frozen: "Gepauzeerd",
    ps_not_found: "Niet gevonden",
    ps_unknown: "Onbekend",
    ed_entity: "Postsensor",
    ed_entity_helper: "De openings-, trillings- of bewegingssensor van de klep: er is post als hij op aan springt",
    ed_door: "Uitnameklep",
    ed_door_helper: "Optioneel: de sensor van de klep; openen leegt de brievenbus",
    ed_collected: "Helper „opgehaald”",
    ed_collected_helper: "Optioneel: een input_button of input_datetime die de knop Opgehaald instelt",
    ed_parcels: "Parcel-zendingen",
    ed_parcels_helper: "Optioneel: de zendingensensor van de Parcel-integratie (wordt zelf gevonden)",
    ed_show_week: "Laatste 7 dagen",
    ed_show_subtitle: "Ondertitel tonen",
    ed_illustration: "Geïllustreerde koptekst",
    ed_illustration_theme: "Thema van de koptekst",
    ed_theme_auto: "Automatisch (volgt het thema)",
    ed_theme_day: "Dag",
    ed_theme_night: "Nacht",
    ed_animations: "Animaties",
    ed_title_helper: "Leeg: Brievenbus",
  },
  pt: {
    title: "Caixa do correio",
    st_mail: "Correio",
    st_empty: "Vazia",
    st_collected: "Recolhido",
    st_offline: "Indisponível",
    got_mail: "Chegou correio",
    no_mail: "Sem correio",
    mail_collected: "Correio recolhido",
    arrived_at: "Chegou às {t}",
    collected_at: "Recolhido às {t}",
    last_mail: "Último correio {d}",
    waiting: "Ainda não recolhido · {d}",
    waiting_since: "À espera desde {t}",
    collect: "Recolhido",
    t_arrived: "Chegada",
    t_parcels: "Encomendas",
    t_week: "Esta semana",
    days_mail: "dias com correio",
    today: "hoje",
    yesterday: "ontem",
    from_parcel: "do Parcel",
    expected: "Esperadas hoje",
    by_time: "até às {t}",
    parcels_one: "1 encomenda",
    parcels_many: "{n} encomendas",
    ago_min: "há {n} min",
    ago_h: "há {n} h",
    ago_d: "há {n} d",
    week: "Últimos 7 dias",
    no_sensor: "Nenhum sensor de caixa do correio encontrado",
    ps_out_for_delivery: "Em distribuição",
    ps_delivered: "Entregue",
    ps_in_transit: "Em trânsito",
    ps_awaiting_pickup: "Pronta a levantar",
    ps_failed_attempt: "Tentativa falhada",
    ps_exception: "Problema",
    ps_info_received: "Etiqueta criada",
    ps_frozen: "Em pausa",
    ps_not_found: "Não encontrada",
    ps_unknown: "Desconhecido",
    ed_entity: "Sensor do correio",
    ed_entity_helper: "O sensor de abertura, vibração ou movimento da portinhola: chegou correio quando passa a on",
    ed_door: "Porta de recolha",
    ed_door_helper: "Opcional: o sensor da porta; abri-la recolhe o correio",
    ed_collected: "Auxiliar «recolhido»",
    ed_collected_helper: "Opcional: um input_button ou input_datetime que o botão Recolhido define",
    ed_parcels: "Envios do Parcel",
    ed_parcels_helper: "Opcional: o sensor de envios da integração Parcel (encontrado sozinho)",
    ed_show_week: "Últimos 7 dias",
    ed_show_subtitle: "Mostrar subtítulo",
    ed_illustration: "Cabeçalho ilustrado",
    ed_illustration_theme: "Tema do cabeçalho",
    ed_theme_auto: "Automático (segue o tema)",
    ed_theme_day: "Dia",
    ed_theme_night: "Noite",
    ed_animations: "Animações",
    ed_title_helper: "Vazio: Caixa do correio",
  },
  pl: {
    title: "Skrzynka pocztowa",
    st_mail: "Poczta",
    st_empty: "Pusta",
    st_collected: "Opróżniona",
    st_offline: "Niedostępne",
    got_mail: "Masz pocztę",
    no_mail: "Brak poczty",
    mail_collected: "Poczta odebrana",
    arrived_at: "Przyszła o {t}",
    collected_at: "Opróżniona o {t}",
    last_mail: "Ostatnia poczta {d}",
    waiting: "Jeszcze nieodebrana · {d}",
    waiting_since: "Czeka od {t}",
    collect: "Odebrano",
    t_arrived: "Przyszła",
    t_parcels: "Paczki",
    t_week: "Ten tydzień",
    days_mail: "dni z pocztą",
    today: "dziś",
    yesterday: "wczoraj",
    from_parcel: "z Parcel",
    expected: "Oczekiwane dziś",
    by_time: "do {t}",
    parcels_one: "1 paczka",
    parcels_many: "Paczki: {n}",
    ago_min: "{n} min temu",
    ago_h: "{n} godz. temu",
    ago_d: "{n} dni temu",
    week: "Ostatnie 7 dni",
    no_sensor: "Nie znaleziono czujnika skrzynki pocztowej",
    ps_out_for_delivery: "W doręczeniu",
    ps_delivered: "Doręczona",
    ps_in_transit: "W drodze",
    ps_awaiting_pickup: "Do odbioru",
    ps_failed_attempt: "Nieudana próba doręczenia",
    ps_exception: "Problem",
    ps_info_received: "Etykieta utworzona",
    ps_frozen: "Wstrzymana",
    ps_not_found: "Nie znaleziono",
    ps_unknown: "Nieznany",
    ed_entity: "Czujnik poczty",
    ed_entity_helper: "Czujnik otwarcia, wibracji lub ruchu klapki: poczta przyszła, gdy przechodzi w stan on",
    ed_door: "Drzwiczki odbioru",
    ed_door_helper: "Opcjonalnie: czujnik drzwiczek; ich otwarcie odbiera pocztę",
    ed_collected: "Pomocnik „odebrano”",
    ed_collected_helper: "Opcjonalnie: input_button lub input_datetime ustawiany przyciskiem Odebrano",
    ed_parcels: "Przesyłki Parcel",
    ed_parcels_helper: "Opcjonalnie: czujnik przesyłek integracji Parcel (znajdowany sam)",
    ed_show_week: "Ostatnie 7 dni",
    ed_show_subtitle: "Pokaż podtytuł",
    ed_illustration: "Ilustrowany nagłówek",
    ed_illustration_theme: "Motyw nagłówka",
    ed_theme_auto: "Automatycznie (zgodnie z motywem)",
    ed_theme_day: "Dzień",
    ed_theme_night: "Noc",
    ed_animations: "Animacje",
    ed_title_helper: "Puste: Skrzynka pocztowa",
  },
  ro: {
    title: "Cutie poștală",
    st_mail: "Corespondență",
    st_empty: "Goală",
    st_collected: "Golită",
    st_offline: "Indisponibil",
    got_mail: "Ai corespondență",
    no_mail: "Fără corespondență",
    mail_collected: "Corespondență ridicată",
    arrived_at: "Sosită la {t}",
    collected_at: "Golită la {t}",
    last_mail: "Ultima corespondență {d}",
    waiting: "Încă neridicată · {d}",
    waiting_since: "Așteaptă din {t}",
    collect: "Ridicată",
    t_arrived: "Sosire",
    t_parcels: "Colete",
    t_week: "Săptămâna aceasta",
    days_mail: "zile cu corespondență",
    today: "azi",
    yesterday: "ieri",
    from_parcel: "din Parcel",
    expected: "Așteptate azi",
    by_time: "până la {t}",
    parcels_one: "1 colet",
    parcels_many: "{n} colete",
    ago_min: "acum {n} min",
    ago_h: "acum {n} h",
    ago_d: "acum {n} z",
    week: "Ultimele 7 zile",
    no_sensor: "Nu s-a găsit niciun senzor de cutie poștală",
    ps_out_for_delivery: "În livrare",
    ps_delivered: "Livrat",
    ps_in_transit: "În tranzit",
    ps_awaiting_pickup: "De ridicat",
    ps_failed_attempt: "Încercare eșuată",
    ps_exception: "Problemă",
    ps_info_received: "Etichetă creată",
    ps_frozen: "În pauză",
    ps_not_found: "Negăsit",
    ps_unknown: "Necunoscut",
    ed_entity: "Senzor de corespondență",
    ed_entity_helper: "Senzorul de deschidere, vibrație sau mișcare al clapetei: a sosit corespondență când trece pe on",
    ed_door: "Ușa de ridicare",
    ed_door_helper: "Opțional: senzorul ușii; deschiderea ei ridică corespondența",
    ed_collected: "Ajutor „ridicată”",
    ed_collected_helper: "Opțional: un input_button sau input_datetime setat de butonul Ridicată",
    ed_parcels: "Livrări Parcel",
    ed_parcels_helper: "Opțional: senzorul de livrări al integrării Parcel (găsit singur)",
    ed_show_week: "Ultimele 7 zile",
    ed_show_subtitle: "Afișează subtitlul",
    ed_illustration: "Antet ilustrat",
    ed_illustration_theme: "Tema antetului",
    ed_theme_auto: "Automat (urmează tema)",
    ed_theme_day: "Zi",
    ed_theme_night: "Noapte",
    ed_animations: "Animații",
    ed_title_helper: "Gol: Cutie poștală",
  },
  da: {
    title: "Postkasse",
    st_mail: "Post",
    st_empty: "Tom",
    st_collected: "Tømt",
    st_offline: "Utilgængelig",
    got_mail: "Du har post",
    no_mail: "Ingen post",
    mail_collected: "Post hentet",
    arrived_at: "Ankom kl. {t}",
    collected_at: "Tømt kl. {t}",
    last_mail: "Seneste post {d}",
    waiting: "Ikke hentet endnu · {d}",
    waiting_since: "Venter siden {t}",
    collect: "Hentet",
    t_arrived: "Ankom",
    t_parcels: "Pakker",
    t_week: "Denne uge",
    days_mail: "dage med post",
    today: "i dag",
    yesterday: "i går",
    from_parcel: "fra Parcel",
    expected: "Forventet i dag",
    by_time: "inden {t}",
    parcels_one: "1 pakke",
    parcels_many: "{n} pakker",
    ago_min: "for {n} min siden",
    ago_h: "for {n} t siden",
    ago_d: "for {n} d siden",
    week: "Seneste 7 dage",
    no_sensor: "Ingen postkassesensor fundet",
    ps_out_for_delivery: "Under levering",
    ps_delivered: "Leveret",
    ps_in_transit: "Undervejs",
    ps_awaiting_pickup: "Klar til afhentning",
    ps_failed_attempt: "Leveringsforsøg mislykkedes",
    ps_exception: "Problem",
    ps_info_received: "Label oprettet",
    ps_frozen: "Sat på pause",
    ps_not_found: "Ikke fundet",
    ps_unknown: "Ukendt",
    ed_entity: "Postsensor",
    ed_entity_helper: "Klappens åbnings-, vibrations- eller bevægelsessensor: der er kommet post, når den skifter til on",
    ed_door: "Udtagningslåge",
    ed_door_helper: "Valgfri: lågens sensor; at åbne den henter posten",
    ed_collected: "Hjælper “hentet”",
    ed_collected_helper: "Valgfri: en input_button eller input_datetime, som knappen Hentet sætter",
    ed_parcels: "Parcel-forsendelser",
    ed_parcels_helper: "Valgfri: Parcel-integrationens forsendelsessensor (findes af sig selv)",
    ed_show_week: "Seneste 7 dage",
    ed_show_subtitle: "Vis undertitel",
    ed_illustration: "Illustreret overskrift",
    ed_illustration_theme: "Overskriftens tema",
    ed_theme_auto: "Automatisk (følger temaet)",
    ed_theme_day: "Dag",
    ed_theme_night: "Nat",
    ed_animations: "Animationer",
    ed_title_helper: "Tom: Postkasse",
  },
  sv: {
    title: "Brevlåda",
    st_mail: "Post",
    st_empty: "Tom",
    st_collected: "Tömd",
    st_offline: "Otillgänglig",
    got_mail: "Du har post",
    no_mail: "Ingen post",
    mail_collected: "Post hämtad",
    arrived_at: "Kom kl. {t}",
    collected_at: "Tömd kl. {t}",
    last_mail: "Senaste post {d}",
    waiting: "Inte hämtad än · {d}",
    waiting_since: "Väntar sedan {t}",
    collect: "Hämtad",
    t_arrived: "Kom",
    t_parcels: "Paket",
    t_week: "Den här veckan",
    days_mail: "dagar med post",
    today: "i dag",
    yesterday: "i går",
    from_parcel: "från Parcel",
    expected: "Väntas i dag",
    by_time: "före {t}",
    parcels_one: "1 paket",
    parcels_many: "{n} paket",
    ago_min: "för {n} min sedan",
    ago_h: "för {n} h sedan",
    ago_d: "för {n} d sedan",
    week: "Senaste 7 dagarna",
    no_sensor: "Ingen brevlådesensor hittades",
    ps_out_for_delivery: "Ute för leverans",
    ps_delivered: "Levererat",
    ps_in_transit: "På väg",
    ps_awaiting_pickup: "Redo att hämtas",
    ps_failed_attempt: "Leveransförsök misslyckades",
    ps_exception: "Problem",
    ps_info_received: "Etikett skapad",
    ps_frozen: "Pausad",
    ps_not_found: "Hittades inte",
    ps_unknown: "Okänd",
    ed_entity: "Postsensor",
    ed_entity_helper: "Luckans öppnings-, vibrations- eller rörelsesensor: post har kommit när den slår om till on",
    ed_door: "Uttagslucka",
    ed_door_helper: "Valfritt: luckans sensor; att öppna den hämtar posten",
    ed_collected: "Hjälpare ”hämtad”",
    ed_collected_helper: "Valfritt: en input_button eller input_datetime som knappen Hämtad ställer in",
    ed_parcels: "Parcel-försändelser",
    ed_parcels_helper: "Valfritt: Parcel-integrationens försändelsesensor (hittas av sig själv)",
    ed_show_week: "Senaste 7 dagarna",
    ed_show_subtitle: "Visa underrubrik",
    ed_illustration: "Illustrerad rubrik",
    ed_illustration_theme: "Rubrikens tema",
    ed_theme_auto: "Automatiskt (följer temat)",
    ed_theme_day: "Dag",
    ed_theme_night: "Natt",
    ed_animations: "Animationer",
    ed_title_helper: "Tom: Brevlåda",
  },
  bg: {
    title: "Пощенска кутия",
    st_mail: "Поща",
    st_empty: "Празна",
    st_collected: "Изпразнена",
    st_offline: "Недостъпно",
    got_mail: "Имате поща",
    no_mail: "Няма поща",
    mail_collected: "Пощата е взета",
    arrived_at: "Пристигна в {t}",
    collected_at: "Изпразнена в {t}",
    last_mail: "Последна поща {d}",
    waiting: "Още не е взета · {d}",
    waiting_since: "Чака от {t}",
    collect: "Взета",
    t_arrived: "Пристигане",
    t_parcels: "Пратки",
    t_week: "Тази седмица",
    days_mail: "дни с поща",
    today: "днес",
    yesterday: "вчера",
    from_parcel: "от Parcel",
    expected: "Очаквани днес",
    by_time: "до {t}",
    parcels_one: "1 пратка",
    parcels_many: "Пратки: {n}",
    ago_min: "преди {n} мин",
    ago_h: "преди {n} ч",
    ago_d: "преди {n} д",
    week: "Последните 7 дни",
    no_sensor: "Не е намерен сензор на пощенската кутия",
    ps_out_for_delivery: "За доставка",
    ps_delivered: "Доставена",
    ps_in_transit: "В движение",
    ps_awaiting_pickup: "Готова за вземане",
    ps_failed_attempt: "Неуспешен опит",
    ps_exception: "Проблем",
    ps_info_received: "Създаден етикет",
    ps_frozen: "На пауза",
    ps_not_found: "Не е намерена",
    ps_unknown: "Неизвестно",
    ed_entity: "Сензор за поща",
    ed_entity_helper: "Сензорът за отваряне, вибрация или движение на капака: има поща, когато премине в on",
    ed_door: "Вратичка за вземане",
    ed_door_helper: "По избор: сензорът на вратичката; отварянето ѝ взема пощата",
    ed_collected: "Помощник „взета“",
    ed_collected_helper: "По избор: input_button или input_datetime, задаван от бутона Взета",
    ed_parcels: "Пратки от Parcel",
    ed_parcels_helper: "По избор: сензорът за пратки на интеграцията Parcel (намира се сам)",
    ed_show_week: "Последните 7 дни",
    ed_show_subtitle: "Показване на подзаглавие",
    ed_illustration: "Илюстрирано заглавие",
    ed_illustration_theme: "Тема на заглавието",
    ed_theme_auto: "Автоматично (следва темата)",
    ed_theme_day: "Ден",
    ed_theme_night: "Нощ",
    ed_animations: "Анимации",
    ed_title_helper: "Празно: Пощенска кутия",
  },
  ru: {
    title: "Почтовый ящик",
    st_mail: "Почта",
    st_empty: "Пусто",
    st_collected: "Опустошён",
    st_offline: "Недоступно",
    got_mail: "Пришла почта",
    no_mail: "Почты нет",
    mail_collected: "Почта забрана",
    arrived_at: "Пришла в {t}",
    collected_at: "Опустошён в {t}",
    last_mail: "Последняя почта {d}",
    waiting: "Ещё не забрана · {d}",
    waiting_since: "Ждёт с {t}",
    collect: "Забрано",
    t_arrived: "Пришла",
    t_parcels: "Посылки",
    t_week: "На этой неделе",
    days_mail: "дней с почтой",
    today: "сегодня",
    yesterday: "вчера",
    from_parcel: "из Parcel",
    expected: "Ожидаются сегодня",
    by_time: "до {t}",
    parcels_one: "1 посылка",
    parcels_many: "Посылки: {n}",
    ago_min: "{n} мин назад",
    ago_h: "{n} ч назад",
    ago_d: "{n} д назад",
    week: "Последние 7 дней",
    no_sensor: "Датчик почтового ящика не найден",
    ps_out_for_delivery: "Передана курьеру",
    ps_delivered: "Доставлена",
    ps_in_transit: "В пути",
    ps_awaiting_pickup: "Ожидает получения",
    ps_failed_attempt: "Неудачная попытка",
    ps_exception: "Проблема",
    ps_info_received: "Создана этикетка",
    ps_frozen: "Приостановлена",
    ps_not_found: "Не найдена",
    ps_unknown: "Неизвестно",
    ed_entity: "Датчик почты",
    ed_entity_helper: "Датчик открытия, вибрации или движения крышки: почта пришла, когда он переходит в on",
    ed_door: "Дверца выемки",
    ed_door_helper: "Необязательно: датчик дверцы; её открытие забирает почту",
    ed_collected: "Помощник «забрано»",
    ed_collected_helper: "Необязательно: input_button или input_datetime, который задаёт кнопка «Забрано»",
    ed_parcels: "Посылки Parcel",
    ed_parcels_helper: "Необязательно: датчик посылок интеграции Parcel (находится сам)",
    ed_show_week: "Последние 7 дней",
    ed_show_subtitle: "Показывать подзаголовок",
    ed_illustration: "Иллюстрированный заголовок",
    ed_illustration_theme: "Тема заголовка",
    ed_theme_auto: "Автоматически (по теме)",
    ed_theme_day: "День",
    ed_theme_night: "Ночь",
    ed_animations: "Анимации",
    ed_title_helper: "Пусто: Почтовый ящик",
  },
  uk: {
    title: "Поштова скринька",
    st_mail: "Пошта",
    st_empty: "Порожньо",
    st_collected: "Спорожнено",
    st_offline: "Недоступно",
    got_mail: "Надійшла пошта",
    no_mail: "Пошти немає",
    mail_collected: "Пошту забрано",
    arrived_at: "Надійшла о {t}",
    collected_at: "Спорожнено о {t}",
    last_mail: "Остання пошта {d}",
    waiting: "Ще не забрано · {d}",
    waiting_since: "Чекає з {t}",
    collect: "Забрано",
    t_arrived: "Надійшла",
    t_parcels: "Посилки",
    t_week: "Цього тижня",
    days_mail: "днів з поштою",
    today: "сьогодні",
    yesterday: "учора",
    from_parcel: "з Parcel",
    expected: "Очікуються сьогодні",
    by_time: "до {t}",
    parcels_one: "1 посилка",
    parcels_many: "Посилки: {n}",
    ago_min: "{n} хв тому",
    ago_h: "{n} год тому",
    ago_d: "{n} д тому",
    week: "Останні 7 днів",
    no_sensor: "Датчик поштової скриньки не знайдено",
    ps_out_for_delivery: "Передано кур'єру",
    ps_delivered: "Доставлено",
    ps_in_transit: "У дорозі",
    ps_awaiting_pickup: "Очікує отримання",
    ps_failed_attempt: "Невдала спроба",
    ps_exception: "Проблема",
    ps_info_received: "Створено етикетку",
    ps_frozen: "Призупинено",
    ps_not_found: "Не знайдено",
    ps_unknown: "Невідомо",
    ed_entity: "Датчик пошти",
    ed_entity_helper: "Датчик відкриття, вібрації або руху кришки: пошта надійшла, коли він переходить у on",
    ed_door: "Дверцята виїмки",
    ed_door_helper: "Необов'язково: датчик дверцят; їх відкриття забирає пошту",
    ed_collected: "Помічник «забрано»",
    ed_collected_helper: "Необов'язково: input_button або input_datetime, який задає кнопка «Забрано»",
    ed_parcels: "Посилки Parcel",
    ed_parcels_helper: "Необов'язково: датчик посилок інтеграції Parcel (знаходиться сам)",
    ed_show_week: "Останні 7 днів",
    ed_show_subtitle: "Показувати підзаголовок",
    ed_illustration: "Ілюстрований заголовок",
    ed_illustration_theme: "Тема заголовка",
    ed_theme_auto: "Автоматично (за темою)",
    ed_theme_day: "День",
    ed_theme_night: "Ніч",
    ed_animations: "Анімації",
    ed_title_helper: "Порожньо: Поштова скринька",
  },
  hu: {
    title: "Postaláda",
    st_mail: "Posta",
    st_empty: "Üres",
    st_collected: "Kiürítve",
    st_offline: "Nem elérhető",
    got_mail: "Posta érkezett",
    no_mail: "Nincs posta",
    mail_collected: "Posta kivéve",
    arrived_at: "Érkezett: {t}",
    collected_at: "Kiürítve: {t}",
    last_mail: "Utolsó posta: {d}",
    waiting: "Még nincs kivéve · {d}",
    waiting_since: "Vár {t} óta",
    collect: "Kivéve",
    t_arrived: "Érkezett",
    t_parcels: "Csomagok",
    t_week: "Ezen a héten",
    days_mail: "napon jött posta",
    today: "ma",
    yesterday: "tegnap",
    from_parcel: "a Parcelből",
    expected: "Ma várható",
    by_time: "{t}-ig",
    parcels_one: "1 csomag",
    parcels_many: "{n} csomag",
    ago_min: "{n} perce",
    ago_h: "{n} órája",
    ago_d: "{n} napja",
    week: "Utolsó 7 nap",
    no_sensor: "Nem található postaláda-érzékelő",
    ps_out_for_delivery: "Kézbesítés alatt",
    ps_delivered: "Kézbesítve",
    ps_in_transit: "Úton",
    ps_awaiting_pickup: "Átvehető",
    ps_failed_attempt: "Sikertelen kézbesítés",
    ps_exception: "Probléma",
    ps_info_received: "Címke létrehozva",
    ps_frozen: "Szüneteltetve",
    ps_not_found: "Nem található",
    ps_unknown: "Ismeretlen",
    ed_entity: "Posta-érzékelő",
    ed_entity_helper: "A fedél nyitás-, rezgés- vagy mozgásérzékelője: posta érkezett, amikor on állapotba vált",
    ed_door: "Kivevőajtó",
    ed_door_helper: "Nem kötelező: az ajtó érzékelője; kinyitása kiveszi a postát",
    ed_collected: "„Kivéve” segéd",
    ed_collected_helper: "Nem kötelező: egy input_button vagy input_datetime, amit a Kivéve gomb beállít",
    ed_parcels: "Parcel-küldemények",
    ed_parcels_helper: "Nem kötelező: a Parcel integráció küldeményérzékelője (magától megtalálja)",
    ed_show_week: "Utolsó 7 nap",
    ed_show_subtitle: "Alcím megjelenítése",
    ed_illustration: "Illusztrált fejléc",
    ed_illustration_theme: "Fejléc témája",
    ed_theme_auto: "Automatikus (követi a témát)",
    ed_theme_day: "Nappal",
    ed_theme_night: "Éjszaka",
    ed_animations: "Animációk",
    ed_title_helper: "Üres: Postaláda",
  },
  sk: {
    title: "Poštová schránka",
    st_mail: "Pošta",
    st_empty: "Prázdna",
    st_collected: "Vybraná",
    st_offline: "Nedostupné",
    got_mail: "Prišla pošta",
    no_mail: "Žiadna pošta",
    mail_collected: "Pošta vybraná",
    arrived_at: "Prišla o {t}",
    collected_at: "Vybraná o {t}",
    last_mail: "Posledná pošta {d}",
    waiting: "Zatiaľ nevybraná · {d}",
    waiting_since: "Čaká od {t}",
    collect: "Vybrané",
    t_arrived: "Prišla",
    t_parcels: "Balíky",
    t_week: "Tento týždeň",
    days_mail: "dní s poštou",
    today: "dnes",
    yesterday: "včera",
    from_parcel: "z Parcel",
    expected: "Očakávané dnes",
    by_time: "do {t}",
    parcels_one: "1 balík",
    parcels_many: "Balíky: {n}",
    ago_min: "pred {n} min",
    ago_h: "pred {n} h",
    ago_d: "pred {n} d",
    week: "Posledných 7 dní",
    no_sensor: "Nenašiel sa senzor poštovej schránky",
    ps_out_for_delivery: "Na ceste k vám",
    ps_delivered: "Doručené",
    ps_in_transit: "V preprave",
    ps_awaiting_pickup: "Pripravené na vyzdvihnutie",
    ps_failed_attempt: "Neúspešný pokus",
    ps_exception: "Problém",
    ps_info_received: "Štítok vytvorený",
    ps_frozen: "Pozastavené",
    ps_not_found: "Nenájdené",
    ps_unknown: "Neznáme",
    ed_entity: "Senzor pošty",
    ed_entity_helper: "Senzor otvorenia, vibrácií alebo pohybu klapky: pošta prišla, keď prejde do on",
    ed_door: "Dvierka na vyberanie",
    ed_door_helper: "Voliteľné: senzor dvierok; ich otvorenie vyberie poštu",
    ed_collected: "Pomocník „vybrané“",
    ed_collected_helper: "Voliteľné: input_button alebo input_datetime, ktorý nastaví tlačidlo Vybrané",
    ed_parcels: "Zásielky Parcel",
    ed_parcels_helper: "Voliteľné: senzor zásielok integrácie Parcel (nájde sa sám)",
    ed_show_week: "Posledných 7 dní",
    ed_show_subtitle: "Zobraziť podnadpis",
    ed_illustration: "Ilustrovaná hlavička",
    ed_illustration_theme: "Téma hlavičky",
    ed_theme_auto: "Automaticky (podľa témy)",
    ed_theme_day: "Deň",
    ed_theme_night: "Noc",
    ed_animations: "Animácie",
    ed_title_helper: "Prázdne: Poštová schránka",
  },
  cs: {
    title: "Poštovní schránka",
    st_mail: "Pošta",
    st_empty: "Prázdná",
    st_collected: "Vybraná",
    st_offline: "Nedostupné",
    got_mail: "Přišla pošta",
    no_mail: "Žádná pošta",
    mail_collected: "Pošta vybrána",
    arrived_at: "Přišla v {t}",
    collected_at: "Vybraná v {t}",
    last_mail: "Poslední pošta {d}",
    waiting: "Zatím nevybraná · {d}",
    waiting_since: "Čeká od {t}",
    collect: "Vybráno",
    t_arrived: "Přišla",
    t_parcels: "Balíky",
    t_week: "Tento týden",
    days_mail: "dní s poštou",
    today: "dnes",
    yesterday: "včera",
    from_parcel: "z Parcel",
    expected: "Očekávané dnes",
    by_time: "do {t}",
    parcels_one: "1 balík",
    parcels_many: "Balíky: {n}",
    ago_min: "před {n} min",
    ago_h: "před {n} h",
    ago_d: "před {n} d",
    week: "Posledních 7 dní",
    no_sensor: "Nebyl nalezen senzor poštovní schránky",
    ps_out_for_delivery: "Na cestě k vám",
    ps_delivered: "Doručeno",
    ps_in_transit: "V přepravě",
    ps_awaiting_pickup: "Připraveno k vyzvednutí",
    ps_failed_attempt: "Neúspěšný pokus",
    ps_exception: "Problém",
    ps_info_received: "Štítek vytvořen",
    ps_frozen: "Pozastaveno",
    ps_not_found: "Nenalezeno",
    ps_unknown: "Neznámé",
    ed_entity: "Senzor pošty",
    ed_entity_helper: "Senzor otevření, vibrací nebo pohybu klapky: pošta přišla, když přejde do on",
    ed_door: "Dvířka pro výběr",
    ed_door_helper: "Volitelné: senzor dvířek; jejich otevření vybere poštu",
    ed_collected: "Pomocník „vybráno“",
    ed_collected_helper: "Volitelné: input_button nebo input_datetime, který nastaví tlačítko Vybráno",
    ed_parcels: "Zásilky Parcel",
    ed_parcels_helper: "Volitelné: senzor zásilek integrace Parcel (najde se sám)",
    ed_show_week: "Posledních 7 dní",
    ed_show_subtitle: "Zobrazit podtitul",
    ed_illustration: "Ilustrovaná hlavička",
    ed_illustration_theme: "Motiv hlavičky",
    ed_theme_auto: "Automaticky (podle motivu)",
    ed_theme_day: "Den",
    ed_theme_night: "Noc",
    ed_animations: "Animace",
    ed_title_helper: "Prázdné: Poštovní schránka",
  },
  sl: {
    title: "Poštni nabiralnik",
    st_mail: "Pošta",
    st_empty: "Prazen",
    st_collected: "Izpraznjen",
    st_offline: "Ni na voljo",
    got_mail: "Prišla je pošta",
    no_mail: "Ni pošte",
    mail_collected: "Pošta pobrana",
    arrived_at: "Prišla ob {t}",
    collected_at: "Izpraznjen ob {t}",
    last_mail: "Zadnja pošta {d}",
    waiting: "Še ni pobrana · {d}",
    waiting_since: "Čaka od {t}",
    collect: "Pobrano",
    t_arrived: "Prišla",
    t_parcels: "Paketi",
    t_week: "Ta teden",
    days_mail: "dni s pošto",
    today: "danes",
    yesterday: "včeraj",
    from_parcel: "iz Parcel",
    expected: "Pričakovani danes",
    by_time: "do {t}",
    parcels_one: "1 paket",
    parcels_many: "Paketi: {n}",
    ago_min: "pred {n} min",
    ago_h: "pred {n} h",
    ago_d: "pred {n} d",
    week: "Zadnjih 7 dni",
    no_sensor: "Senzor poštnega nabiralnika ni bil najden",
    ps_out_for_delivery: "V dostavi",
    ps_delivered: "Dostavljeno",
    ps_in_transit: "Na poti",
    ps_awaiting_pickup: "Pripravljeno za prevzem",
    ps_failed_attempt: "Neuspešen poskus",
    ps_exception: "Težava",
    ps_info_received: "Nalepka ustvarjena",
    ps_frozen: "Zaustavljeno",
    ps_not_found: "Ni najdeno",
    ps_unknown: "Neznano",
    ed_entity: "Senzor pošte",
    ed_entity_helper: "Senzor odpiranja, vibracij ali gibanja lopute: pošta je prišla, ko preide v on",
    ed_door: "Vratca za praznjenje",
    ed_door_helper: "Neobvezno: senzor vratc; njihovo odpiranje pobere pošto",
    ed_collected: "Pomočnik »pobrano«",
    ed_collected_helper: "Neobvezno: input_button ali input_datetime, ki ga nastavi gumb Pobrano",
    ed_parcels: "Pošiljke Parcel",
    ed_parcels_helper: "Neobvezno: senzor pošiljk integracije Parcel (najde se sam)",
    ed_show_week: "Zadnjih 7 dni",
    ed_show_subtitle: "Prikaži podnaslov",
    ed_illustration: "Ilustrirana glava",
    ed_illustration_theme: "Tema glave",
    ed_theme_auto: "Samodejno (sledi temi)",
    ed_theme_day: "Dan",
    ed_theme_night: "Noč",
    ed_animations: "Animacije",
    ed_title_helper: "Prazno: Poštni nabiralnik",
  },
  lv: {
    title: "Pastkastīte",
    st_mail: "Pasts",
    st_empty: "Tukša",
    st_collected: "Iztukšota",
    st_offline: "Nav pieejams",
    got_mail: "Ir pienācis pasts",
    no_mail: "Nav pasta",
    mail_collected: "Pasts izņemts",
    arrived_at: "Pienāca {t}",
    collected_at: "Iztukšota {t}",
    last_mail: "Pēdējais pasts {d}",
    waiting: "Vēl nav izņemts · {d}",
    waiting_since: "Gaida kopš {t}",
    collect: "Izņemts",
    t_arrived: "Pienāca",
    t_parcels: "Sūtījumi",
    t_week: "Šonedēļ",
    days_mail: "dienas ar pastu",
    today: "šodien",
    yesterday: "vakar",
    from_parcel: "no Parcel",
    expected: "Gaidāmi šodien",
    by_time: "līdz {t}",
    parcels_one: "1 sūtījums",
    parcels_many: "Sūtījumi: {n}",
    ago_min: "pirms {n} min",
    ago_h: "pirms {n} h",
    ago_d: "pirms {n} d",
    week: "Pēdējās 7 dienas",
    no_sensor: "Pastkastītes sensors nav atrasts",
    ps_out_for_delivery: "Tiek piegādāts",
    ps_delivered: "Piegādāts",
    ps_in_transit: "Ceļā",
    ps_awaiting_pickup: "Gaida saņemšanu",
    ps_failed_attempt: "Neveiksmīgs mēģinājums",
    ps_exception: "Problēma",
    ps_info_received: "Izveidota etiķete",
    ps_frozen: "Apturēts",
    ps_not_found: "Nav atrasts",
    ps_unknown: "Nezināms",
    ed_entity: "Pasta sensors",
    ed_entity_helper: "Vāka atvēršanas, vibrācijas vai kustības sensors: pasts ir pienācis, kad tas pārslēdzas uz on",
    ed_door: "Izņemšanas durtiņas",
    ed_door_helper: "Neobligāti: durtiņu sensors; to atvēršana izņem pastu",
    ed_collected: "Palīgs “izņemts”",
    ed_collected_helper: "Neobligāti: input_button vai input_datetime, ko iestata poga Izņemts",
    ed_parcels: "Parcel sūtījumi",
    ed_parcels_helper: "Neobligāti: Parcel integrācijas sūtījumu sensors (tiek atrasts pats)",
    ed_show_week: "Pēdējās 7 dienas",
    ed_show_subtitle: "Rādīt apakšvirsrakstu",
    ed_illustration: "Ilustrēta galvene",
    ed_illustration_theme: "Galvenes motīvs",
    ed_theme_auto: "Automātiski (pēc motīva)",
    ed_theme_day: "Diena",
    ed_theme_night: "Nakts",
    ed_animations: "Animācijas",
    ed_title_helper: "Tukšs: Pastkastīte",
  },
  el: {
    title: "Γραμματοκιβώτιο",
    st_mail: "Αλληλογραφία",
    st_empty: "Άδειο",
    st_collected: "Άδειασε",
    st_offline: "Μη διαθέσιμο",
    got_mail: "Ήρθε αλληλογραφία",
    no_mail: "Χωρίς αλληλογραφία",
    mail_collected: "Η αλληλογραφία πάρθηκε",
    arrived_at: "Ήρθε στις {t}",
    collected_at: "Άδειασε στις {t}",
    last_mail: "Τελευταία αλληλογραφία {d}",
    waiting: "Δεν έχει παρθεί ακόμα · {d}",
    waiting_since: "Περιμένει από τις {t}",
    collect: "Πάρθηκε",
    t_arrived: "Άφιξη",
    t_parcels: "Δέματα",
    t_week: "Αυτή την εβδομάδα",
    days_mail: "ημέρες με αλληλογραφία",
    today: "σήμερα",
    yesterday: "χθες",
    from_parcel: "από το Parcel",
    expected: "Αναμένονται σήμερα",
    by_time: "έως τις {t}",
    parcels_one: "1 δέμα",
    parcels_many: "{n} δέματα",
    ago_min: "πριν από {n} λεπτά",
    ago_h: "πριν από {n} ώρες",
    ago_d: "πριν από {n} ημέρες",
    week: "Τελευταίες 7 ημέρες",
    no_sensor: "Δεν βρέθηκε αισθητήρας γραμματοκιβωτίου",
    ps_out_for_delivery: "Σε διανομή",
    ps_delivered: "Παραδόθηκε",
    ps_in_transit: "Σε μεταφορά",
    ps_awaiting_pickup: "Προς παραλαβή",
    ps_failed_attempt: "Αποτυχημένη απόπειρα",
    ps_exception: "Πρόβλημα",
    ps_info_received: "Δημιουργήθηκε ετικέτα",
    ps_frozen: "Σε παύση",
    ps_not_found: "Δεν βρέθηκε",
    ps_unknown: "Άγνωστο",
    ed_entity: "Αισθητήρας αλληλογραφίας",
    ed_entity_helper: "Ο αισθητήρας ανοίγματος, δόνησης ή κίνησης του καπακιού: ήρθε αλληλογραφία όταν γυρίζει σε on",
    ed_door: "Πορτάκι εξαγωγής",
    ed_door_helper: "Προαιρετικό: ο αισθητήρας του πορτακιού· το άνοιγμά του παίρνει την αλληλογραφία",
    ed_collected: "Βοηθός «πάρθηκε»",
    ed_collected_helper: "Προαιρετικό: ένα input_button ή input_datetime που ορίζει το κουμπί Πάρθηκε",
    ed_parcels: "Αποστολές Parcel",
    ed_parcels_helper: "Προαιρετικό: ο αισθητήρας αποστολών της ενσωμάτωσης Parcel (βρίσκεται μόνος του)",
    ed_show_week: "Τελευταίες 7 ημέρες",
    ed_show_subtitle: "Εμφάνιση υπότιτλου",
    ed_illustration: "Εικονογραφημένη κεφαλίδα",
    ed_illustration_theme: "Θέμα κεφαλίδας",
    ed_theme_auto: "Αυτόματο (ακολουθεί το θέμα)",
    ed_theme_day: "Ημέρα",
    ed_theme_night: "Νύχτα",
    ed_animations: "Κινούμενα σχέδια",
    ed_title_helper: "Κενό: Γραμματοκιβώτιο",
  },
};

// ── Helpers ──────────────────────────────────────────────────────────────────
const rcLang = (i18n, hass, config) => {
  // The full tag when the card has it (sr-Latn), else its base language (fr-FR → fr, pt-BR → pt), else English.
  const l = config?.language || hass?.locale?.language || hass?.language || "en";
  const base = l.split("-")[0];
  return i18n[l] ? l : i18n[base] ? base : "en";
};

const rcT = (i18n, lang, key, vars = {}) => {
  const s = i18n[lang]?.[key] ?? RC_I18N[lang]?.[key] ?? i18n.en[key] ?? RC_I18N.en[key] ?? key;
  return s.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? "");
};

const rcEsc = (s) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
  );

const rcMoreInfo = (node, entityId) => {
  const ev = new Event("hass-more-info", { bubbles: true, composed: true });
  ev.detail = { entityId };
  node.dispatchEvent(ev);
};

const rcNavigate = (path) => {
  history.pushState(null, "", path);
  window.dispatchEvent(new CustomEvent("location-changed", { detail: { replace: false } }));
};

// Wires a card header to its `navigation_path`: click, and Enter on the header itself.
const rcBindNav = (head, path) => {
  head.addEventListener("click", () => rcNavigate(path));
  head.addEventListener("keydown", (ev) => {
    if (ev.key === "Enter" && ev.target === head) rcNavigate(path);
  });
};

// HA's callService already shows a toast when the call fails, then rejects: the rejection is only swallowed here
// so that it does not end up as "Uncaught (in promise)".
const rcCall = (hass, domain, service, data) => Promise.resolve(hass.callService(domain, service, data)).catch(() => {});

// A click inside a dialog (more-info opened from the card, say) is not a click outside the card.
const rcInDialog = (ev) => ev.composedPath().some((n) => ["ha-more-info-dialog", "ha-dialog", "dialog"].includes(n.localName));

// `fn()`, computed again only when one of `deps` is no longer the same object (or value) as last time.
const rcMemo = (store, key, deps, fn) => {
  const hit = store[key];
  if (hit && hit.deps.length === deps.length && hit.deps.every((d, i) => d === deps[i])) return hit.value;
  const value = fn();
  store[key] = { deps, value };
  return value;
};

// ── Base card ────────────────────────────────────────────────────────────────
class RcCard extends HTMLElement {
  static getStubConfig(hass) {
    const areas = Object.keys(hass?.areas ?? {});
    return { area: areas[0] ?? "" };
  }

  // Subclasses set: static i18n, static defaults, static tag, static styles.
  static getConfigElement() {
    // biome-ignore lint/complexity/noThisInStatic: each subclass opens its own editor.
    return document.createElement(`${this.tag}-editor`);
  }

  setConfig(config) {
    if (this.constructor.needsArea && !config.area && !config.entities?.length && !config.include?.length) {
      throw new Error(rcT(this.constructor.i18n, rcLang(this.constructor.i18n, this._hass, config), "err_config"));
    }
    this._config = { ...this.constructor.defaults, ...config };
    // show_title: the header's title, hidden by the stylesheet
    this.toggleAttribute?.("hide-title", config.show_title === false);
    if (!this.shadowRoot) this._attach();
    this._sig = null;
    this._render();
  }

  // The shadow root, and no rewrite of the card between a press anywhere in it and the end of the click: Home
  // Assistant updates the card several times a second, and a rewrite under the pointer replaces the element pressed,
  // so that the click lands on the card itself and does nothing (the tiles already hold it, see _bindPress; this
  // covers the rest: header button, detail button, rows, popup). The pending update is rendered once released.
  _attach() {
    const root = this.attachShadow({ mode: "open" });
    this._onPressEnd = () => {
      window.removeEventListener("pointerup", this._onPressEnd, true);
      window.removeEventListener("pointercancel", this._onPressEnd, true);
      // After the click, which comes in the same task as the release.
      setTimeout(() => {
        if (this._pressing) this._released();
      }, 0);
    };
    root.addEventListener("pointerdown", (ev) => {
      this._byPointer = true;
      if (ev.button !== 0) return;
      this._pressing = true;
      window.addEventListener("pointerup", this._onPressEnd, true);
      window.addEventListener("pointercancel", this._onPressEnd, true);
    });
    // The focus is kept across rewrites for the keyboard only (no focus ring after a mouse click or a tap).
    root.addEventListener("keydown", () => {
      this._byPointer = false;
    });
  }

  disconnectedCallback() {
    super.disconnectedCallback?.();
    window.removeEventListener("pointerup", this._onPressEnd, true);
    window.removeEventListener("pointercancel", this._onPressEnd, true);
    // A press cut short by the detach never gets its release: rendered now, and the next updates too.
    if (this._pressing) this._released();
  }

  set hass(hass) {
    this._hass = hass;
    // No re-render during a drag or a press: it would replace the tile under the finger.
    if (this._dragging || this._pressing) this._deferred = true;
    else this._render();
  }

  // The tiles actually shown (`only_on` / `only_alerts` applied), nothing when the card is hidden.
  getCardSize() {
    if (this.style.display === "none") return 0;
    const n = this._shown ?? this._items?.length ?? 0;
    if (!n || !this._config) return 1;
    // A row of large tiles (`layout: tiles`) is about one and a half rows of compact ones.
    const rows = Math.ceil(n / this._cols());
    return 1 + (this._tiles() ? Math.ceil(rows * 1.5) : rows);
  }

  getGridOptions() {
    return { columns: 12, min_columns: 6, rows: "auto" };
  }

  _lang() {
    return rcLang(this.constructor.i18n, this._hass, this._config);
  }

  _t(key, vars) {
    return rcT(this.constructor.i18n, this._lang(), key, vars);
  }

  _areaName() {
    const c = this._config;
    return c.area ? (this._hass.areas?.[c.area]?.name ?? c.area) : "";
  }

  // Re-render only when something visible changed.
  _changed(parts) {
    const sig = JSON.stringify([this._config, this._lang(), parts]);
    if (sig === this._sig) return false;
    this._sig = sig;
    return true;
  }

  // Subclasses implement `_collect()` (the tiles) and `_draw(items)`.
  _render() {
    if (!this._config || !this._hass || !this.shadowRoot) return;
    this._items = this._collect();
    this._draw(this._items);
  }

  _cols() {
    return Math.min(4, Math.max(1, Number(this._config.columns) || 2));
  }

  // `layout: tiles`: one large tile per entity, the size of Home Assistant's Tile card (easier to tap on a phone).
  _tiles() {
    return this._config?.layout === "tiles";
  }

  _paint(level, head, tiles, extraClass = "") {
    // The tile or control with the keyboard focus keeps it through the redraw (a toggle, a step or a two-tap
    // confirmation from the keyboard): tiles by their data-id, controls by their data-k.
    const active = this._byPointer ? null : this.shadowRoot.activeElement;
    const focused = active?.dataset?.id;
    const focusKey = active?.dataset?.k;
    this.shadowRoot.innerHTML = `
      <style>${RC_BASE_STYLES}${this.constructor.styles}</style>
      <ha-card class="lvl-${level}${extraClass}${this._tiles() ? " layout-tiles" : ""}">
        ${head}
        ${tiles ? `<div class="grid" style="--cols:${this._cols()}">${tiles}</div>` : ""}
        ${this._afterGrid()}
      </ha-card>`;
    const root = this.shadowRoot;
    root.querySelector(".pill.action")?.addEventListener("click", (ev) => this._allOff(ev));
    if (this._config.navigation_path) rcBindNav(root.querySelector(".head"), this._config.navigation_path);
    for (const el of root.querySelectorAll(".tile")) {
      this._bindTile(el, (this._items || []).find((i) => i.id === el.dataset.id));
      if (focused && el.dataset.id === focused) el.focus({ preventScroll: true });
    }
    this._bindAfter(root);
    if (focusKey) root.querySelector(`[data-k="${focusKey}"]`)?.focus({ preventScroll: true });
  }

  // What a card adds under its tiles (the Lights card's scenes), and its event wiring.
  _afterGrid() {
    return "";
  }

  _bindAfter() {}

  // The "turn everything off" button of the header (full card) or of the status (mini card).
  _allOff(ev) {
    ev.stopPropagation();
    const ids = (this._items || []).filter((i) => i.on).map((i) => i.id);
    if (!ids.length) return;
    // A host card may ask first (the Overview confirms before turning plugs off); otherwise off at once.
    if (this._confirmOff) this._confirmOff(ids);
    else rcCall(this._hass, "homeassistant", "turn_off", { entity_id: ids });
  }

  // Tap, hold for more-info, and an optional horizontal drag ({ move(x), end(x), step(delta), flush() }). From the
  // keyboard: Enter / Space tap, Shift+Enter or the context-menu key open the details, ←/→ step the drag by ∓/±10
  // (a held key at most every RC_REPEAT_MS), and releasing the arrow calls `flush`.
  _bindPress(el, { onTap, onHold, drag }) {
    let start = null;
    let mode = null; // null | "hold" | "drag"
    let timer = null;
    let lastStep = 0;
    el.addEventListener("pointerdown", (ev) => {
      if (ev.button !== 0) return;
      start = { x: ev.clientX, y: ev.clientY };
      mode = null;
      this._pressing = true;
      clearTimeout(timer);
      timer = setTimeout(() => {
        // The card may have been detached mid-press (nothing else clears this timer): no hold on a dead node.
        if (mode || !this.isConnected) return;
        mode = "hold";
        // The press is settled (no tap): the details may open over the tile, so its pointerup may never come.
        this._released();
        onHold();
      }, RC_HOLD_MS);
    });
    el.addEventListener("pointermove", (ev) => {
      if (!start || mode === "hold") return;
      const dx = ev.clientX - start.x;
      const dy = ev.clientY - start.y;
      if (!mode && drag && Math.abs(dx) > RC_MOVE_PX && Math.abs(dx) > Math.abs(dy)) {
        mode = "drag";
        clearTimeout(timer);
        this._dragging = true;
        el.setPointerCapture(ev.pointerId);
        el.classList.add("dragging");
      } else if (!mode && (Math.abs(dx) > RC_MOVE_PX || Math.abs(dy) > RC_MOVE_PX)) {
        clearTimeout(timer); // scrolling, or dragging what cannot be dragged: not a tap
        start = null;
        this._released();
      }
      if (mode === "drag") drag.move(ev.clientX);
    });
    const end = (ev, cancelled) => {
      clearTimeout(timer);
      if (!start) return;
      const wasDrag = mode === "drag";
      if (wasDrag) {
        this._dragging = false;
        el.classList.remove("dragging");
        if (!cancelled) drag.end(ev.clientX);
        this._sig = null;
      } else if (!mode && !cancelled) {
        onTap();
      }
      start = null;
      mode = null;
      // After a drag, the next update redraws (the bar keeps the new level until the light reports it).
      this._released(!wasDrag);
    };
    // The mouse leaving the tile mid-press (no capture outside a drag) cancels it: neither a tap nor a hold.
    el.addEventListener("pointerleave", () => {
      if (!start || mode) return;
      clearTimeout(timer);
      start = null;
      this._released();
    });
    el.addEventListener("pointerup", (ev) => end(ev, false));
    el.addEventListener("pointercancel", (ev) => end(ev, true));
    el.addEventListener("contextmenu", (ev) => ev.preventDefault());
    el.addEventListener("keydown", (ev) => {
      if ((ev.key === "Enter" && ev.shiftKey) || ev.key === "ContextMenu") {
        ev.preventDefault();
        if (!ev.repeat) onHold();
      } else if (ev.key === "Enter" || ev.key === " ") {
        ev.preventDefault();
        if (!ev.repeat) onTap();
      } else if (drag?.step && (ev.key === "ArrowLeft" || ev.key === "ArrowRight")) {
        ev.preventDefault();
        if (ev.repeat && ev.timeStamp - lastStep < RC_REPEAT_MS) return;
        lastStep = ev.timeStamp;
        drag.step(ev.key === "ArrowRight" ? 10 : -10);
      }
    });
    // The arrow released: the stepped level goes out now rather than after the pause.
    el.addEventListener("keyup", (ev) => {
      if (ev.key === "ArrowLeft" || ev.key === "ArrowRight") drag?.flush?.();
    });
  }

  // End of a press: renders now what an update brought during it.
  _released(flush = true) {
    this._pressing = false;
    if (!this._deferred || this._dragging) return;
    this._deferred = false;
    if (flush) this._render();
  }

  // Default tile: tap toggles, hold opens the details.
  _bindTile(el, item) {
    this._bindPress(el, {
      onTap: () => !item?.unavailable && rcCall(this._hass, "homeassistant", "toggle", { entity_id: el.dataset.id }),
      onHold: () => rcMoreInfo(this, el.dataset.id),
    });
  }
}

// ── Mini cards ───────────────────────────────────────────────────────────────
// A mini card shows what its full card (`Base`) shows on two lines: the room badge, title and status, then one chip
// per entity. Its zoom button (top right, `zoom: false` removes it) switches it to the full card and back; a click
// anywhere else brings it back too.
// The subclass implements `_drawMini(items)`, which builds the chips and calls `_paintMini`.
// Zoomed in, everything is shown (`only_alerts` and `hide_when_clear` only apply to the compact view). With
// `alertsOnly`, the compact view always shows only what needs a look (no `only_alerts` option then): quiet entities
// show once zoomed in.
const rcMini = (Base, tag, styles, { alertsOnly = false } = {}) =>
  class extends Base {
    static tag = tag;
    static defaults = (({ only_alerts, ...rest }) => ({ ...rest, ...(alertsOnly ? {} : { only_alerts }), zoom: true }))(
      Base.defaults,
    );
    static styles = `${Base.styles}${RC_MINI_STYLES}${styles}`;

    constructor() {
      super();
      // A click anywhere else brings the card back to its compact view.
      this._onUnzoom = (ev) => {
        if (rcOutside(this, ev)) rcUnzoom(this);
      };
    }

    connectedCallback() {
      super.connectedCallback?.();
      this._unzoom ??= watchOutside(this, this._onUnzoom);
      this._unzoom.on();
    }

    disconnectedCallback() {
      super.disconnectedCallback?.();
      this._unzoom?.off();
      // Left (another dashboard view, a conditional card hidden): back to the compact view.
      rcUnzoom(this);
    }

    getCardSize() {
      if (this._zoomed) return super.getCardSize();
      return this.style.display === "none" ? 0 : 1;
    }

    getGridOptions() {
      return { columns: 12, min_columns: 6, rows: "auto" };
    }

    _draw(items) {
      const config = this._config;
      // The base card's own filter does the work: off zoomed in, always on in an `alertsOnly` compact view.
      if (this._zoomed) this._config = { ...config, only_alerts: false, hide_when_clear: false };
      else if (alertsOnly) this._config = { ...config, only_alerts: true };
      try {
        if (this._zoomed) super._draw(items);
        else this._drawMini(items);
      } finally {
        this._config = config;
      }
      this._addZoom();
    }

    _paintMini({ level, icon, status, chips, cls = "", allOff = false }) {
      const c = this._config;
      const nav = c.navigation_path;
      // With `allOff` the status is the "turn everything off" button, like the full card's pill.
      const st = allOff
        ? `<button class="st action" title="${rcEsc(this._t("turn_all_off"))}"><ha-icon icon="mdi:power"></ha-icon><span class="pt">${rcEsc(status)}</span></button>`
        : `<span class="st" title="${rcEsc(status)}"><span class="pt">${rcEsc(status)}</span></span>`;
      this.shadowRoot.innerHTML = `
        <style>${RC_BASE_STYLES}${this.constructor.styles}</style>
        <ha-card class="lvl-${level}${cls}">
          <div class="mini">
            <div class="badge" title="${rcEsc(status)}"><ha-icon icon="${rcEsc(icon)}"></ha-icon></div>
            <div class="body">
              <div class="head${nav ? " nav" : ""}"${nav ? ' role="link" tabindex="0"' : ""}>
                <div class="title">${rcEsc(c.title || this._areaName() || this._t("title"))}</div>
                ${st}
              </div>
              <div class="rs">${chips}</div>
            </div>
          </div>
        </ha-card>`;
      const root = this.shadowRoot;
      if (nav) rcBindNav(root.querySelector(".head"), nav);
      root.querySelector(".st.action")?.addEventListener("click", (ev) => this._allOff(ev));
      for (const el of root.querySelectorAll(".r")) el.addEventListener("click", () => rcMoreInfo(this, el.dataset.id));
    }

    // Zoom button at the end of the header, top right in both views, added once per render.
    // Its click is the overviews' (rcZoomClick): stop the tap on the title (navigation_path), toggle, keep the
    // keyboard focus (Enter / Space: no click count) on the button that replaced this one.
    _addZoom() {
      const head = this._config.zoom && this.shadowRoot.querySelector(".head");
      if (!head || head.querySelector(".zoom")) return;
      const button = document.createElement("button");
      button.className = "zoom";
      button.title = this._t(this._zoomed ? "zoom_out" : "zoom_in");
      button.innerHTML = `<ha-icon icon="${rcZoomIcon(this)}"></ha-icon>`;
      button.addEventListener("click", (ev) => rcZoomClick(this, ev));
      head.appendChild(button);
    }
  };

const rcBooleans = (...names) => names.map((name) => ({ name, selector: { boolean: {} } }));

const rcAdvanced = (i18n, lang, ...names) => [
  {
    name: "advanced",
    type: "expandable",
    flatten: true,
    schema: names.map((name) =>
      name === "language"
        ? {
            name,
            selector: {
              select: {
                mode: "dropdown",
                options: [
                  { value: "", label: rcT(i18n, lang, "ed_language_auto") },
                  { value: "en", label: "English" },
                  { value: "fr", label: "Français" },
                  { value: "de", label: "Deutsch" },
                  { value: "es", label: "Español" },
                  { value: "sr", label: "Српски" },
                  { value: "sr-Latn", label: "Srpski (latinica)" },
                  { value: "it", label: "Italiano" },
                  { value: "nl", label: "Nederlands" },
                  { value: "pt", label: "Português (Portugal)" },
                  { value: "pl", label: "Polski" },
                  { value: "ro", label: "Română" },
                  { value: "da", label: "Dansk" },
                  { value: "sv", label: "Svenska" },
                  { value: "bg", label: "Български" },
                  { value: "ru", label: "Русский" },
                  { value: "uk", label: "Українська" },
                  { value: "hu", label: "Magyar" },
                  { value: "sk", label: "Slovenčina" },
                  { value: "cs", label: "Čeština" },
                  { value: "sl", label: "Slovenščina" },
                  { value: "lv", label: "Latviešu" },
                  { value: "el", label: "Ελληνικά" },
                ],
              },
            },
          }
        : { name, selector: { object: {} } },
    ),
  },
];
// `schema(lang, hass, config)` lists the fields; options left at the card's default are not written to the YAML
// (list defaults such as `exclude: []` are not shown in the form: an empty list is never written anyway).
// `autos` maps an option to its default worked out from the config (`(hass, config) => value`): shown in the form
// while unset, and kept out of the YAML when left at it.
// Entity lists the form edits with an entity picker (ids only): an item written `{ entity, name, icon }` in YAML shows as its entity,
// and gets its name and icon back when the form changes the list (ha-room-card#77).
const RC_ENTITY_LISTS = ["include"];
const rcListIds = (list) => (Array.isArray(list) ? list.map((e) => (typeof e === "string" ? e : e?.entity)).filter(Boolean) : list);
const rcListKeep = (ids, before) =>
  Array.isArray(ids) ? ids.map((id) => (Array.isArray(before) ? before.find((e) => typeof e === "object" && e?.entity === id) : undefined) ?? id) : ids;

const rcEditor = ({ card, helpers, schema, autos = {} }) => {
  const i18n = card.i18n;
  const defaults = { show_title: true, ...Object.fromEntries(Object.entries(card.defaults).filter(([, v]) => !Array.isArray(v))) };
  return class extends HTMLElement {
    setConfig(config) {
      this._config = config;
      this._update();
    }

    set hass(hass) {
      this._hass = hass;
      this._update();
    }

    _update() {
      if (!this._hass || !this._config) return;
      const lang = rcLang(i18n, this._hass, this._config);
      // Read by the label and helper callbacks, set once on the form: a language change must reach them too.
      this._lang = lang;
      if (!this._form) {
        this._form = document.createElement("ha-form");
        this._form.computeLabel = (s) => rcT(i18n, this._lang, `ed_${s.name}`);
        this._form.computeHelper = (s) =>
          helpers.includes(s.name) ? rcT(i18n, this._lang, `ed_${s.name}_helper`) : undefined;
        this._form.addEventListener("value-changed", (ev) => {
          const config = { ...ev.detail.value };
          for (const k of RC_ENTITY_LISTS) if (k in config) config[k] = rcListKeep(config[k], this._config[k]);
          for (const k of Object.keys(config)) {
            const v = config[k];
            if (v === "" || v == null || (Array.isArray(v) && !v.length) || defaults[k] === v) delete config[k];
          }
          for (const [k, auto] of Object.entries(autos)) {
            const untouched = this._config[k] === undefined && config[k] === auto(this._hass, this._config);
            if (untouched || config[k] === auto(this._hass, config)) delete config[k];
          }
          this.dispatchEvent(new CustomEvent("config-changed", { detail: { config }, bubbles: true, composed: true }));
        });
        this.appendChild(this._form);
      }
      this._form.hass = this._hass;
      // A new data or schema object re-renders the whole form, and the schema runs the card's discovery:
      // both only change with the config, the language or the registries.
      const memo = (this._memo ||= {});
      const h = this._hass;
      this._form.data = rcMemo(memo, "data", [this._config, h.areas], () => {
        const data = { ...defaults, ...this._config };
        for (const k of RC_ENTITY_LISTS) if (k in data) data[k] = rcListIds(data[k]);
        for (const [k, auto] of Object.entries(autos)) data[k] ??= auto(h, this._config);
        return data;
      });
      this._form.schema = rcMemo(memo, "schema", [lang, this._config, h.entities, h.devices, h.areas], () =>
        schema(lang, h, this._config),
      );
    }
  };
};

const rcRegister = (card, editor, name, description) => {
  if (customElements.get(card.tag)) return;
  customElements.define(card.tag, card);
  customElements.define(`${card.tag}-editor`, editor);
  window.customCards = window.customCards || [];
  window.customCards.push({
    type: card.tag,
    name,
    description,
    preview: true,
    documentationURL: "https://github.com/juju35/ha-mailbox-card",
  });
};

if (!customElements.get("mailbox-card")) {
  console.info(`%c HA-MAILBOX-CARD %c v${RC_VERSION} `, "background:#e03131;color:#fff;font-weight:700", "");
}

// ── Common styles ────────────────────────────────────────────────────────────
const RC_BASE_STYLES = `
  :host {
    --rc-ok: var(--success-color, #43a047);
    --rc-warn: var(--warning-color, #ffa600);
    --rc-alert: var(--error-color, #db4437);
    --rc-info: var(--info-color, #039be5);
    --rc-light: var(--state-light-active-color, #ffb300);
    --rc-plug: var(--state-switch-on-color, var(--primary-color, #03a9f4));
    --rc-idle: var(--secondary-text-color, #9e9e9e);
    --rc-na: var(--disabled-color, #9e9e9e);
    display: block;
    min-width: 0;
  }
  /* The card answers its own width (container queries). That containment drops its content from its natural width: in
     a wrapper sized by its content (inline-block, a grid's auto column, a flex row: layout-card, button-card…) it would
     shrink to its padding. The empty grid below (no height) gives the host a natural width of 344 px there, as a
     preferred width only: its column is minmax(0, …), so the card still shrinks to its column in a grid card, a
     horizontal stack or a 1fr column, even wrapped in a <div> (hui-card in layout-card). contain-intrinsic-inline-size
     or a min-width in px would be a minimum there, and the card would overflow. */
  :host::before { content: ""; display: grid; grid-template-columns: minmax(0, 344px); height: 0; }
  ha-card { padding: 12px; overflow: hidden; container-type: inline-size; }
  ha-card.lvl-alert { box-shadow: 0 0 0 1px color-mix(in srgb, var(--rc-alert) 45%, transparent), var(--ha-card-box-shadow, none); }

  .head { display: flex; align-items: center; gap: 10px; }
  .head.nav { cursor: pointer; }
  .head.nav:focus-visible { outline: 2px solid var(--primary-color); outline-offset: 2px; border-radius: 4px; }
  .badge { flex: none; width: 40px; height: 40px; border-radius: 50%; display: grid; place-items: center;
           background: color-mix(in srgb, var(--c) 16%, transparent); color: var(--c); }
  .badge ha-icon { --mdc-icon-size: 24px; }
  .lvl-alert .badge { animation: rc-pulse 1.6s ease-in-out infinite; }
  /* Narrow header: the title keeps a few letters (never 0 px), the status pill shrinks and ellipsises, the icon buttons
     (zoom, power) never shrink; under 200 px the pill is only its coloured dot, its text kept for screen readers. */
  .title { flex: 1 1 0; min-width: 5ch; font-size: 16px; font-weight: 500; color: var(--primary-text-color);
           white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
           /* show_title: false keeps the title's room (the pill and buttons stay in place) */
  :host([hide-title]) .head > .title { visibility: hidden; }
  .pill { all: unset; flex: 0 1 auto; min-width: 0; box-sizing: border-box; position: relative;
          display: inline-flex; align-items: center; gap: 3px; font-size: 11px; font-weight: 500;
          padding: 1px 8px; border-radius: 999px; background: color-mix(in srgb, var(--c) 14%, transparent);
          /* Coloured text is half the accent, half the text colour: 4.5:1 on its tint in light and dark themes, where
             the bare accent (amber above all) is not. */
          color: color-mix(in srgb, var(--c) 50%, var(--primary-text-color, #212121)); }
  .pt { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .pill ha-icon { flex: none; }
  /* A card this narrow (6 columns of the Sections view on a phone): the title is at its few letters already, so the
     status pill goes to a line of its own under it, where its whole label fits, rather than end with "…". */
  @container (max-width: 260px) {
    .head { flex-wrap: wrap; row-gap: 4px; }
    .head::after { content: ""; order: 1; flex: 1 0 100%; }
    .head > .pill { order: 2; margin-left: 50px; max-width: calc(100% - 50px); }
  }
  @container (max-width: 200px) {
    /* Under 200 px the pill is only its dot again: back on the title's line. */
    .head { flex-wrap: nowrap; }
    .head::after { content: none; }
    .head > .pill { order: 0; margin-left: 0; max-width: none; }
    .head > .pill .pt, .st .pt { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); }
    .head > .pill:not(.action), .st { flex: none; padding: 0; width: 18px; height: 18px; justify-content: center; background: none; }
    .head > .pill:not(.action)::before, .st::before { content: ""; width: 8px; height: 8px; border-radius: 50%; background: var(--c); }
    .head > .pill.action { padding: 1px 4px; }
    /* A full card this narrow (6 columns of the Sections view on a phone): a smaller badge, no side chip in the header. */
    .head { gap: 6px; }
    .head > .badge { width: 32px; height: 32px; }
    .head > .badge ha-icon { --mdc-icon-size: 20px; }
    .head > .chip { display: none; }
  }
  .pill.action { cursor: pointer; }
  .pill.action:hover { background: color-mix(in srgb, var(--c) 24%, transparent); }
  .pill.action:focus-visible { outline: 2px solid var(--primary-color); outline-offset: 2px; }
  .pill ha-icon { --mdc-icon-size: 12px; margin-left: -2px; }

  .grid { display: grid; grid-template-columns: repeat(var(--cols), minmax(0, 1fr)); gap: 6px; margin-top: 8px; }
  .tile { all: unset; position: relative; overflow: hidden; box-sizing: border-box; cursor: pointer; min-width: 0;
          display: flex; align-items: center; gap: 8px; padding: 5px 8px 5px 5px; border-radius: 10px;
          touch-action: pan-y; user-select: none; -webkit-user-select: none; -webkit-touch-callout: none;
          background: color-mix(in srgb, var(--t) 9%, var(--secondary-background-color, transparent));
          border: 1px solid color-mix(in srgb, var(--t) 22%, transparent); transition: background .2s, border-color .2s; }
  .tile.off, .tile.na { background: var(--secondary-background-color, transparent); border-color: transparent; }
  .tile.na { --t: var(--rc-na); opacity: .7; }
  .tile:hover { background: color-mix(in srgb, var(--t) 15%, var(--secondary-background-color, transparent)); }
  .tile:focus-visible { outline: 2px solid var(--primary-color); outline-offset: 2px; }
  .ic, .txt { position: relative; }
  .ic { flex: none; width: 28px; height: 28px; border-radius: 50%; display: grid; place-items: center;
        color: var(--t); background: color-mix(in srgb, var(--t) 20%, transparent); }
  .ic ha-icon { --mdc-icon-size: 16px; }
  .txt { display: flex; flex-direction: column; min-width: 0; }
  .name { font-size: 13px; font-weight: 500; line-height: 1.2; color: var(--primary-text-color);
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  /* A reading is never cut: on a narrow tile it goes on to a second line (the name, a label, keeps its ellipsis). */
  .state { font-size: 11px; line-height: 1.2; color: var(--secondary-text-color); overflow-wrap: break-word; }
  /* A card this narrow (a phone, 6 columns of the Sections view): one tile per row, whatever the columns option. */
  @container (max-width: 260px) { .grid { grid-template-columns: minmax(0, 1fr); } }
  /* layout: tiles — the size of Home Assistant's Tile card — 56 px high, a 40 px icon, the name over the state. */
  .layout-tiles .grid { gap: 8px; }
  .layout-tiles .tile { min-height: 56px; gap: 10px; padding: 8px 10px 8px 8px; border-radius: 12px; }
  .layout-tiles .ic { width: 40px; height: 40px; }
  .layout-tiles .ic ha-icon { --mdc-icon-size: 24px; }
  .layout-tiles .txt { gap: 2px; }
  .layout-tiles .name { font-size: 14px; line-height: 1.25; }
  .layout-tiles .state { font-size: 12px; line-height: 1.25; }

  @keyframes rc-blink { 0%, 100% { opacity: 1 } 50% { opacity: .35 } }
  @keyframes rc-pulse { 0%, 100% { box-shadow: 0 0 0 0 color-mix(in srgb, var(--c) 45%, transparent) }
                        50% { box-shadow: 0 0 0 7px transparent } }
  @media (prefers-reduced-motion: reduce) { .tile, .lvl-alert .badge { animation: none; transition: none; } }
`;

// Mini cards: layout, chips and zoom button. A chip is plain (icon and text) until it needs a look: then a tinted pill.
// The zoom / detail button of the mini cards and the overviews.
const RC_ZOOM_STYLES = `
  /* 40 px to tap, laid out as the 24 px it looks (the negative margins). */
  .zoom { all: unset; flex: none; cursor: pointer; width: 40px; height: 40px; margin: -12px -12px -12px -8px; border-radius: 50%;
          display: grid; place-items: center; color: var(--secondary-text-color); }
  .zoom ha-icon { --mdc-icon-size: 16px; }
  .zoom:hover { background: color-mix(in srgb, var(--rc-idle) 16%, transparent); color: var(--primary-text-color); }
  .zoom:focus-visible { outline: 2px solid var(--primary-color); outline-offset: 1px; }
`;

const RC_MINI_STYLES = `${RC_ZOOM_STYLES}
  /* The badge sits 12px from the card's top-left corner, like the other ha-* cards, beside the title and the readings. */
  ha-card:has(.mini) { padding: 12px; }
  .mini { display: flex; align-items: flex-start; gap: 10px; }
  /* The badge keeps the full card's size (40 px, icon 24 px): the body is at least as tall, a lone title line centred
     beside it. */
  .body { flex: 1; min-width: 0; min-height: 40px; display: flex; flex-direction: column; justify-content: center; gap: 4px; }
  .mini .head { gap: 8px; }
  .mini .title { line-height: 1.25; }
  .st { flex: 0 1 auto; min-width: 0; position: relative; display: inline-flex; align-items: center;
        margin-left: auto; font-size: 11px; font-weight: 500; color: var(--c); }
  .rs { display: flex; flex-wrap: wrap; gap: 2px 4px; margin-left: -4px; }
  .rs:empty { display: none; }
  /* A chip never runs past the card: a long name ends with an ellipsis. */
  .r { all: unset; cursor: pointer; display: inline-flex; align-items: baseline; gap: 1px; padding: 0 5px 0 4px;
       box-sizing: border-box; min-width: 0; max-width: 100%; overflow: hidden;
       border-radius: 999px; font-size: 12px; font-weight: 500; line-height: 24px; white-space: nowrap; --t: var(--rc-ok);
       color: var(--primary-text-color); }
  .r ha-icon { --mdc-icon-size: 13px; flex: none; color: var(--t); align-self: center; margin-right: 2px; }
  .r > span { min-width: 0; overflow: hidden; text-overflow: ellipsis; }
  .r.pill { color: color-mix(in srgb, var(--t) 50%, var(--primary-text-color, #212121)); background: color-mix(in srgb, var(--t) 14%, transparent); }
  .r:hover { background: color-mix(in srgb, var(--t) 20%, var(--secondary-background-color, transparent)); }
  .r:focus-visible { outline: 2px solid var(--primary-color); outline-offset: 2px; }
`;
