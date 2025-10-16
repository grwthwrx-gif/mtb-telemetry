const fs = require('fs');
const path = require('path');

// --- Update package.json version ---
const pkgPath = path.join(__dirname, 'package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

const versionParts = pkg.version.split('.').map(Number);
versionParts[2]++; // bump patch version
pkg.version = versionParts.join('.');
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
console.log(`✅ package.json version bumped to ${pkg.version}`);

// --- Update app.json (iOS + Android build numbers) ---
const appPath = path.join(__dirname, 'app.json');
const app = JSON.parse(fs.readFileSync(appPath, 'utf8'));

// iOS buildNumber
if (!app.expo.ios) app.expo.ios = {};
const currentIOS = Number(app.expo.ios.buildNumber || 0);
app.expo.ios.buildNumber = String(currentIOS + 1);

// Android versionCode
if (!app.expo.android) app.expo.android = {};
const currentAndroid = Number(app.expo.android.versionCode || 0);
app.expo.android.versionCode = currentAndroid + 1;

fs.writeFileSync(appPath, JSON.stringify(app, null, 2));
console.log(`✅ iOS buildNumber bumped to ${app.expo.ios.buildNumber}`);
console.log(`✅ Android versionCode bumped to ${app.expo.android.versionCode}`);
