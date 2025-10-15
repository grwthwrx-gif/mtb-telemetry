#!/usr/bin/env node

console.log("🔧 Running pre-build version bump...");

const { execSync } = require("child_process");

try {
  execSync("npm run bump", { stdio: "inherit" });
  console.log("✅ Version and build numbers updated successfully before build.");
} catch (err) {
  console.error("❌ Failed to run bump script before build.");
  process.exit(1);
}
