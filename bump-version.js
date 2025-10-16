const fs = require('fs');
const path = require('path');

// --- Update package.json ---
const pkgPath = path.join(__dirname, 'package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

const versionParts = pkg.version.split('.').map(Number);
versionParts[2]++; // bump patch version
pkg.version = versionParts.join('.');
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
console.log(`✅ package.json version bumped to ${pkg.version}`);

// --- Update app.json iOS buildNumber ---
const appPath = path.join(__dirname, 'app.json');
const app = JSON.parse(fs.readFileSync(appPath, 'utf8'));

if (!app.expo.ios) app.expo.ios = {};
const currentBuild = Number(app.expo.ios.buildNumber || 0);
app.expo.ios.buildNumber = String(currentBuild + 1);

fs.writeFileSync(appPath, JSON.stringify(app, null, 2));
console.log(`✅ iOS buildNumber bumped to ${app.expo.ios.buildNumber}`);
