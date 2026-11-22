# Changelog

## 1.0.2 - 2026-11-22

### Performance
- Card picker: the previews are back (`preview: true`), and light. Each card's preview is drawn only once it scrolls into view of Home Assistant's card picker, which otherwise builds the preview of every card at once: until then it holds Home Assistant's state (no render, no history request, no animation). On a dashboard or in the card editor the card is drawn as before.

## 1.0.1 - 2026-11-22

### Performance
- Card picker: the cards no longer ask Home Assistant for a live preview (`preview: false` in `window.customCards`). The picker drew every card at once (history requests, animations), which made the list slow to open; it now shows each card's description instead.

## 1.0.0 - 2026-11-22

### Features
- First release: `mailbox-card` and `mailbox-mini-card`. The mailbox illustrated with its flag up when mail has come, the time it came and how long it has been waiting, the Collected button (an `input_button` or `input_datetime`), collection by the door's sensor, the parcels expected today from Parcel, and the last 7 days; an illustrated header with the fence and the mailbox, its flag rising. Generic binary sensors (ZHA, Zigbee2MQTT, ESPHome, Z-Wave), the deliveries from the history.
