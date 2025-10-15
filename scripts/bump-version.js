const fs = require("fs");
const path = require("path");

const appJsonPath = path.resolve(__dirname, "../app.json");

// 🔹 Read current version
const appJson = JSON.parse(fs.readFileSync(appJsonPath, "utf-8"));
const currentVersion = appJson.expo.version;

// 🔹 Increment patch version (1.0.5 → 1.0.6)
const [major, minor, patch] = currentVersion.split(".").map(Number);
const newVersion = `${major}.${minor}.${patch + 1}`;

// 🔹 Update and write
appJson.expo.version = newVersion;
fs.writeFileSync(appJsonPath, JSON.stringify(appJson, null, 2));

console.log(`✅ Version bumped: ${currentVersion} → ${newVersion}`);
