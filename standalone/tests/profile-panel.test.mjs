import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const html = fs.readFileSync(new URL("../public/index.html", import.meta.url), "utf8");
const css = `${fs.readFileSync(new URL("../public/styles.css", import.meta.url), "utf8")}\n${fs.readFileSync(new URL("../public/enhancements.css", import.meta.url), "utf8")}`;
const app = fs.readFileSync(new URL("../public/app.js", import.meta.url), "utf8");

test("el editor de perfil dispone de diálogo, fondo de cierre y desplazamiento en viewport bajo", () => {
  assert.match(html, /id="profile-backdrop"/);
  assert.match(html, /role="dialog"/);
  assert.match(css, /overflow-y:auto/);
  assert.match(css, /max-height:calc\(100dvh - 2rem\)/);
  assert.match(app, /function openProfilePanel/);
  assert.match(app, /function closeProfilePanel/);
});
