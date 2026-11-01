const { spawnSync } = require("node:child_process");
for (const zone of [
  "Europe/Helsinki",
  "America/New_York",
  "Asia/Kolkata",
  "Pacific/Honolulu",
]) {
  console.log(`\nCalendar verification in ${zone}`);
  const result = spawnSync(
    process.execPath,
    [
      "--import",
      "tsx",
      "--test",
      "tests/dates.test.ts",
      "tests/habits.test.ts",
      "tests/history.test.ts",
    ],
    { env: { ...process.env, TZ: zone }, stdio: "inherit" },
  );
  if (result.status !== 0) process.exit(result.status ?? 1);
}
