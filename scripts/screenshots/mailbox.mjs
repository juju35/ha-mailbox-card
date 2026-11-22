// Renders the mailbox cards with a mock mailbox and saves the README screenshots.
// Usage: npm install && npm run build && node scripts/screenshots/mailbox.mjs
import { pair, shoot } from "./harness.mjs";
import { pageScript, setup } from "./mock.mjs";

// Stills: animations: false keeps the flag still, so a capture only changes when the card does.
const still = (file, s) => pair(file, { ...s, config: { animations: false, ...s.config } });
const ws = pageScript();
await shoot({ prefix: "mb", tag: "mailbox-card", shots: [...["mail", "collected", "empty", "offline"].flatMap((scene) => still(scene, { scene })), ...still("narrow", { scene: "mail", width: 300 })], setup, ws });
await shoot({ prefix: "mb-mini", tag: "mailbox-mini-card", shots: [...still("mail", { scene: "mail" }), ...still("empty", { scene: "empty" }), ...still("zoom", { scene: "mail", open: ".zoom" })], setup, ws });
