import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const {
  backupRules,
  extractionRules,
  releaseManifest,
  configureManifest,
} = require("../plugins/with-offline-android.cjs");

test("offline policy excludes SQLite files, preferences and all app storage from backup and transfer", () => {
  for (const domain of ["root", "file", "database", "sharedpref", "external"]) {
    assert.match(
      backupRules,
      new RegExp(`<exclude domain="${domain}" path="\\."`),
    );
    for (const section of ["cloud-backup", "device-transfer"])
      assert.match(
        extractionRules.split(`<${section}>`)[1]?.split(`</${section}>`)[0] ??
          "",
        new RegExp(`<exclude domain="${domain}" path="\\."`),
      );
  }
});
test("release overlay removes network permissions without changing debug permissions", () => {
  assert.match(
    releaseManifest,
    /android.permission.INTERNET[^>]+tools:node="remove"/,
  );
  assert.match(
    releaseManifest,
    /android.permission.ACCESS_NETWORK_STATE[^>]+tools:node="remove"/,
  );
  const manifest = {
    manifest: {
      application: [{ $: { "android:name": ".MainApplication" } }],
      "uses-permission": [
        { $: { "android:name": "android.permission.INTERNET" } },
      ],
    },
  };
  configureManifest(manifest);
  assert.equal(
    (manifest.manifest.application[0]!.$ as Record<string, string>)[
      "android:allowBackup"
    ],
    "false",
  );
  assert.equal(
    (manifest.manifest.application[0]!.$ as Record<string, string>)[
      "android:backupAgent"
    ],
    ".StillNoBackupAgent",
  );
  assert.equal(
    manifest.manifest["uses-permission"][0]?.$["android:name"],
    "android.permission.INTERNET",
  );
});
