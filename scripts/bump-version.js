const fs = require("fs");
const path = require("path");

const appJsonPath = path.resolve(__dirname, "../app.json");

// --- Read and parse app.json
const appJson = JSON.parse(fs.readFileSync(appJsonPath, "utf-8"));
const currentVersion = appJson.expo.version || "1.0.0";
const [major, minor, patch] = currentVersion.split(".").map(Number);

// --- Bump patch version (1.0.5 → 1.0.6)
const newVersion = `${major}.${minor}.${patch + 1}`;

// --- Bump iOS buildNumber (as string)
let iosBuildNumber = parseInt(appJson.expo.ios?.buildNumber || patch || 0, 10);
iosBuildNumber += 1;

// --- Bump Android versionCode (as integer)
let androidVersionCode = parseInt(appJson.expo.android?.versionCode || patch || 0, 10);
androidVersionCode += 1;

// --- Apply updates
appJson.expo.version = newVersion;
appJson.expo.ios = { ...(appJson.expo.ios || {}), buildNumber: String(iosBuildNumber) };
appJson.expo.android = { ...(appJson.expo.android || {}), versionCode: androidVersionCode };

// --- Write changes
fs.writeFileSync(appJsonPath, JSON.stringify(appJson, null, 2));

console.log(`✅ Version bumped: ${currentVersion} → ${newVersion}`);
console.log(`📱 iOS buildNumber: ${iosBuildNumber}`);
console.log(`🤖 Android versionCode: ${androidVersionCode}`);
