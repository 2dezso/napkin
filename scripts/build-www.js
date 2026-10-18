// Copies just the site (no prototypes, no tooling folders) into www/, which is
// what Capacitor bundles into the iOS app. The website itself is not built:
// it is still served straight from the repo root.
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const out = path.join(root, "www");

fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });
for (const item of ["index.html", "js", "assets"]) {
  fs.cpSync(path.join(root, item), path.join(out, item), { recursive: true });
}
console.log("www/ ready");
