# ha-mailbox-card

[![Marketplace](https://img.shields.io/badge/Marketplace-Custom-41BDF5.svg)](https://www.home-assistant.io/integrations/marketplace/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://github.com/juju35/ha-mailbox-card/blob/main/LICENSE)
[![Buy Me a Coffee](https://img.shields.io/badge/Buy%20Me%20a%20Coffee-FFDD00?logo=buymeacoffee&logoColor=black)](https://buymeacoffee.com/julienstep9)

<p align="center"><img src="https://raw.githubusercontent.com/juju35/ha-mailbox-card/main/images/icon.svg" alt="Mailbox Card" width="120"></p>

<p align="center">
  <img src="https://raw.githubusercontent.com/juju35/ha-mailbox-card/main/images/zha.png" alt="ZHA" height="24">&nbsp;&nbsp;
  <img src="https://raw.githubusercontent.com/juju35/ha-mailbox-card/main/images/mqtt.png" alt="MQTT" height="24">&nbsp;&nbsp;
  <img src="https://raw.githubusercontent.com/juju35/ha-mailbox-card/main/images/esphome.png" alt="ESPHome" height="24">&nbsp;&nbsp;
  <img src="https://raw.githubusercontent.com/juju35/ha-mailbox-card/main/images/zwave-js.png" alt="Z-Wave" height="24">
</p>

An illustrated Lovelace card for a **connected mailbox**: the flag goes up when mail comes, with the time it came, and goes down when the door is opened to collect it.

> [!NOTE]
> This card is being designed: there is no release yet. Watch the repository to know when the first version is out.

| Card | Type | What it shows |
|---|---|---|
| Mailbox | `custom:mailbox-card` | The mailbox drawn with its flag up when mail has come, the time it came, and today's expected parcels. |
| Mailbox mini | `custom:mailbox-mini-card` | Mail or no mail and the time it came on two lines, with a zoom to the full card. |

## Supported integrations

Any opening, vibration or motion `binary_sensor` on the mailbox works, from any integration. Parcels expected today can be shown from [Parcel](https://github.com/juju35/ha-parcel). Among the usual ones:

| | Integration | What the cards show |
|:---:|---|---|
| <img src="https://raw.githubusercontent.com/juju35/ha-mailbox-card/main/images/zha.png" alt="ZHA" height="16"> | [ZHA](https://www.home-assistant.io/integrations/zha/) (built in) | Zigbee door and vibration sensors (Aqara, Sonoff, IKEA…) |
| <img src="https://raw.githubusercontent.com/juju35/ha-mailbox-card/main/images/mqtt.png" alt="MQTT" height="16"> | [MQTT](https://www.home-assistant.io/integrations/mqtt/) (built in) | Zigbee2MQTT sensors |
| <img src="https://raw.githubusercontent.com/juju35/ha-mailbox-card/main/images/esphome.png" alt="ESPHome" height="16"> | [ESPHome](https://www.home-assistant.io/integrations/esphome/) (built in) | DIY mailbox sensors (reed switch, ToF, load cell) |
| <img src="https://raw.githubusercontent.com/juju35/ha-mailbox-card/main/images/zwave-js.png" alt="Z-Wave" height="16"> | [Z-Wave](https://www.home-assistant.io/integrations/zwave_js/) (built in) | Z-Wave door sensors |

## Installation

### Via the Marketplace (recommended)

Click the button below to add the repository directly:

[![Add to the Marketplace](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/marketplace_repository/?owner=juju35&repository=ha-mailbox-card&category=plugin)

Or manually:

1. Open **Settings → Marketplace → Add from link** (top right; this needs a GitHub account connected)
2. Add `https://github.com/juju35/ha-mailbox-card` — Type: **Dashboard**
3. Open **Mailbox Card** and click **Install**
4. Clear your browser cache and refresh

The Marketplace registers the dashboard resource for you.

### Manual

1. Download `ha-mailbox-card.js` and the `ha-mailbox-card.i18n.*.js` translation files from the [latest release](https://github.com/juju35/ha-mailbox-card/releases/latest)
2. Copy them all to `/config/www/` (without the translation files, the cards show in English)
3. Go to **Settings → Dashboards → Resources** → Add resource:
   - URL: `/local/ha-mailbox-card.js`
   - Type: **JavaScript Module**
4. Clear your browser cache and refresh

## License

[MIT](https://github.com/juju35/ha-mailbox-card/blob/main/LICENSE)

## Support

If you find this project useful, you can support its development:

<a href="https://buymeacoffee.com/julienstep9"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me a Coffee" height="50"></a>
