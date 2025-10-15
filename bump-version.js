#!/usr/bin/env node

const fs = require("fs");
const { execSync } = require("child_process");

console.log("🔢 Auto-bumping app version and build numbers...");

try {
  // --- Load and increment package.json version ---
  const pkgPath = "./package.json";
  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
  const versionParts = pkg.version.split(".");
  versionParts[2] = (parseInt(versionParts[2]) + 1).toString();
  pkg.version = versionParts.join(".");

  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
  console.log(`📦 New package.json version: ${pkg.version}`);

  // --- Update app.json ---
  const appJsonPath = "./app.json";
  const appJson = JSON.parse(fs.readFileSync(appJsonPath, "utf8"));

  if (!appJson.expo.ios) appJson.expo.ios = {};
  if (!appJson.expo.android) appJson.expo.android = {};

  appJson.expo.version = pkg.version;
  appJson.expo.ios.buildNumber = (parseInt(appJson.expo.ios.buildNumber || "1") + 1).toString();
  appJson.expo.android.versionCode = (parseInt(appJson.expo.android.versionCode || "1") + 1);

  fs.writeFileSync(appJsonPath, JSON.stringify(appJson, null, 2));
  console.log(`🧩 Updated app.json: version=${pkg.version}, ios.buildNumber=${appJson.expo.ios.buildNumber}, android.versionCode=${appJson.expo.android.versionCode}`);

  // --- Auto-commit and push ---
  execSync("git add package.json app.json", { stdio: "inherit" });
  execSync(`git commit -m "🔼 Bump version to ${pkg.version}"`, { stdio: "inherit" });
  execSync("git push origin main", { stdio: "inherit" });

  console.log("✅ Version bump complete and pushed to GitHub.");
} catch (err) {
  console.error("❌ Failed to bump version:", err);
  process.exit(1);
}
