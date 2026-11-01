const {
  withAndroidManifest,
  withDangerousMod,
} = require("expo/config-plugins");
const fs = require("node:fs");
const path = require("node:path");

const domains = [
  "root",
  "file",
  "database",
  "sharedpref",
  "external",
  "device_root",
  "device_file",
  "device_database",
  "device_sharedpref",
];
const exclusions = domains
  .map((domain) => `    <exclude domain="${domain}" path="." />`)
  .join("\n");
const backupRules = `<?xml version="1.0" encoding="utf-8"?>\n<full-backup-content>\n${exclusions}\n</full-backup-content>\n`;
const extractionRules = `<?xml version="1.0" encoding="utf-8"?>\n<data-extraction-rules>\n  <cloud-backup>\n${exclusions}\n  </cloud-backup>\n  <device-transfer>\n${exclusions}\n  </device-transfer>\n</data-extraction-rules>\n`;
const releaseManifest = `<?xml version="1.0" encoding="utf-8"?>\n<manifest xmlns:android="http://schemas.android.com/apk/res/android" xmlns:tools="http://schemas.android.com/tools">\n  <uses-permission android:name="android.permission.INTERNET" tools:node="remove" />\n  <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" tools:node="remove" />\n</manifest>\n`;
function configureManifest(value) {
  const app = value.manifest.application[0];
  app.$["android:allowBackup"] = "false";
  app.$["android:fullBackupContent"] = "@xml/still_backup_rules";
  app.$["android:dataExtractionRules"] = "@xml/still_data_extraction_rules";
  app.$["android:backupAgent"] = ".StillNoBackupAgent";
  app.$["android:fullBackupOnly"] = "true";
  return value;
}
function withOfflineAndroid(config) {
  config = withAndroidManifest(config, (current) => {
    configureManifest(current.modResults);
    return current;
  });
  return withDangerousMod(config, [
    "android",
    async (current) => {
      const root = current.modRequest.platformProjectRoot;
      const write = (relative, content) => {
        const target = path.join(root, relative);
        fs.mkdirSync(path.dirname(target), { recursive: true });
        fs.writeFileSync(target, content);
      };
      write("app/src/main/res/xml/still_backup_rules.xml", backupRules);
      write(
        "app/src/main/res/xml/still_data_extraction_rules.xml",
        extractionRules,
      );
      write("app/src/release/AndroidManifest.xml", releaseManifest);
      // Expo's Android widget control sends a broadcast. Extend its generated provider
      // to open the host app for our read-only widget button, including a cold start.
      const pkg = current.android.package;
      write(
        `app/src/main/java/${pkg.replaceAll(".", "/")}/StillNoBackupAgent.kt`,
        `package ${pkg}

import android.app.backup.BackupAgent
import android.app.backup.BackupDataInput
import android.app.backup.BackupDataOutput
import android.app.backup.FullBackupDataOutput
import android.os.ParcelFileDescriptor

// A device-only app never contributes user data to an OS backup or transfer.
class StillNoBackupAgent : BackupAgent() {
  override fun onBackup(oldState: ParcelFileDescriptor?, data: BackupDataOutput?, newState: ParcelFileDescriptor?) {}
  override fun onRestore(data: BackupDataInput?, appVersionCode: Int, newState: ParcelFileDescriptor?) {}
  override fun onFullBackup(data: FullBackupDataOutput?) {}
}
`,
      );
      write(
        `app/src/main/java/${pkg.replaceAll(".", "/")}/StillTodayProvider.kt`,
        `package ${pkg}

import android.content.Context
import android.content.Intent
import android.net.Uri
import expo.modules.widgets.ExpoWidgetsAppWidgetProvider

class StillTodayProvider : ExpoWidgetsAppWidgetProvider("StillToday") {
  override fun onReceive(context: Context, intent: Intent) {
    if (intent.action == "expo.modules.widgets.ACTION_WIDGET_INTERACTION" &&
        intent.getStringExtra("expo.modules.widgets.extra.SOURCE") == "StillToday" &&
        intent.getStringExtra("expo.modules.widgets.extra.TARGET") == "open-still") {
      val launch = context.packageManager.getLaunchIntentForPackage(context.packageName)
      if (launch != null) {
        launch.action = Intent.ACTION_VIEW
        launch.data = Uri.parse("still:///")
        launch.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP)
        context.startActivity(launch)
      }
      return
    }
    super.onReceive(context, intent)
  }
}
`,
      );
      return current;
    },
  ]);
}
module.exports = withOfflineAndroid;
module.exports.backupRules = backupRules;
module.exports.extractionRules = extractionRules;
module.exports.releaseManifest = releaseManifest;
module.exports.configureManifest = configureManifest;
