// @ts-nocheck
// app.config.js — auto-bump build numbers on every EAS Build

const fs = require('fs');
const path = require('path');

/**
 * Always increment build numbers before each build.
 * This runs every time Expo reads app.config.js (including during EAS Build).
 */
function bumpBuildNumbers() {
  const versionFile = path.join(__dirname, 'build-info.json');
  let info = { buildNumber: 1, versionCode: 1 };

  try {
    if (fs.existsSync(versionFile)) {
      info = JSON.parse(fs.readFileSync(versionFile, 'utf-8'));
    }
    info.buildNumber += 1;
    info.versionCode += 1;
  } catch {
    console.warn('⚠️ Could not read build-info.json, resetting counters.');
  }

  fs.writeFileSync(versionFile, JSON.stringify(info, null, 2));
  console.log(
    `✅ Auto-bumped → iOS buildNumber ${info.buildNumber}, Android versionCode ${info.versionCode}`
  );

  return info;
}

const { buildNumber, versionCode } = bumpBuildNumbers();

module.exports = {
  expo: {
    name: 'mtb-telemetry',
    slug: 'mtb-telemetry',
    version: '1.0.7',
    orientation: 'portrait',
    icon: './assets/icons/psynk/icon_square_1024.png',
    userInterfaceStyle: 'dark',

    splash: {
      image: './assets/images/psynk/splash_dark_2048.png',
      resizeMode: 'contain',
      backgroundColor: '#0B0C10'
    },

    assetBundlePatterns: ['**/*'],

    ios: {
      supportsTablet: true,
      buildNumber: String(buildNumber),
      bundleIdentifier: 'com.grthwrx.psynk',
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false
      }
    },

    android: {
      package: 'com.grthwrx.psynk',
      adaptiveIcon: {
        foregroundImage: './assets/icons/psynk/icon_square_512.png',
        backgroundColor: '#0B0C10'
      },
      versionCode
    },

    web: {
      favicon: './assets/icons/psynk/icon_square_512.png'
    },

    plugins: [
      [
        'expo-font',
        {
          fonts: [
            './assets/fonts/Orbitron-Regular.ttf',
            './assets/fonts/Orbitron-Bold.ttf'
          ]
        }
      ]
    ],

    extra: {
      eas: {
        projectId: '23c8c4dd-8c23-4489-aa30-4ea549424045'
      }
    },

    updates: {
      enabled: true,
      checkAutomatically: 'ON_ERROR_RECOVERY'
    },

    runtimeVersion: {
      policy: 'appVersion'
    },

    jsEngine: 'jsc'
  }
};
