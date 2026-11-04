/* Render the editable leaf.svg; no renderer is shipped in the app.
 * npm exec --yes --package=@resvg/resvg-js@2.6.2 -- node --version
 * node scripts/generate-brand-assets.cjs <path-to-cached-@resvg/resvg-js>
 */
const fs = require("node:fs");
const path = require("node:path");
const { Resvg } = require(process.argv[2] || "@resvg/resvg-js");
const root = path.resolve(__dirname, "..");
const assets = path.join(root, "assets");
const purple = "#6B56BB";
const leaf = fs.readFileSync(path.join(assets, "leaf.svg"), "utf8");
const body = leaf.replace(/^[\s\S]*?<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "");
function svg(content, background) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">${background ? `<rect width="1024" height="1024" fill="${background}"/>` : ""}${content}</svg>`;
}
function png(name, source, size = 1024) {
  fs.writeFileSync(
    path.join(assets, name),
    new Resvg(source, { fitTo: { mode: "width", value: size } })
      .render()
      .asPng(),
  );
}
const scaled = (scale) =>
  `<g transform="translate(512 512) scale(${scale}) translate(-512 -512)">${body}</g>`;
const icon = svg(scaled(1.4), purple);
fs.writeFileSync(path.join(assets, "icon.svg"), icon + "\n");
png("icon.png", icon);
png("favicon.png", icon, 64);
// Same safe-zone mark in launcher and monochrome mode, without baked-in corners.
png("android-icon-foreground.png", svg(scaled(1.1)));
png("android-icon-monochrome.png", svg(scaled(1.1)));
png("android-icon-background.png", svg("", purple));
// Crop only the viewBox around the mark so the configured width is useful at launch.
const splash = (color) =>
  leaf
    .replace('viewBox="0 0 1024 1024"', 'viewBox="272 272 480 480"')
    .replaceAll("#FFFFFF", color);
png("splash-icon.png", splash(purple));
png("splash-icon-dark.png", splash("#CFC2FF"));
// Review sheet uses the same vector: small masked icons + light/dark launch surfaces.
const sheet = `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="570" viewBox="0 0 1000 570">
<defs><clipPath id="circle"><circle cx="152" cy="150" r="80"/></clipPath><clipPath id="rounded"><rect x="274" y="70" width="160" height="160" rx="38"/></clipPath></defs>
<rect width="1000" height="570" fill="#F7F7FC"/><text x="48" y="38" font-family="Segoe UI" font-size="16" fill="#57536A">STILL · refreshed leaf</text>
<g clip-path="url(#circle)"><g transform="translate(72 70) scale(.15625)">${icon.replace(/^[\s\S]*?<svg[^>]*>/, "").replace(/<\/svg>$/, "")}</g></g>
<g clip-path="url(#rounded)"><g transform="translate(274 70) scale(.15625)">${icon.replace(/^[\s\S]*?<svg[^>]*>/, "").replace(/<\/svg>$/, "")}</g></g>
<g transform="translate(476 106) scale(.0625)">${icon.replace(/^[\s\S]*?<svg[^>]*>/, "").replace(/<\/svg>$/, "")}</g>
<text x="48" y="278" font-family="Segoe UI" font-size="16" fill="#57536A">Home-screen shapes · 64 px detail</text>
<rect x="602" y="0" width="398" height="570" fill="#171522"/>
<g transform="translate(170 320) scale(.24)">${body.replaceAll("#FFFFFF", purple)}</g>
<g transform="translate(680 185) scale(.24)">${body.replaceAll("#FFFFFF", "#CFC2FF")}</g>
<text x="48" y="542" font-family="Segoe UI" font-size="16" fill="#57536A">Light splash</text><text x="630" y="542" font-family="Segoe UI" font-size="16" fill="#CFC2FF">Dark splash</text>
</svg>`;
fs.mkdirSync(path.join(root, "verification"), { recursive: true });
fs.writeFileSync(
  path.join(root, "verification", "icon-refresh.png"),
  new Resvg(sheet).render().asPng(),
);
console.log(
  "Rendered app, adaptive, monochrome, favicon and light/dark splash assets.",
);
