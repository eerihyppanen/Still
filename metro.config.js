const { getDefaultConfig } = require("expo/metro-config");
const config = getDefaultConfig(__dirname);
// Workspace-local compiler temp files can contain Windows sockets Metro cannot stat.
const defaultBlockList = config.resolver.blockList;
config.resolver.blockList = [
  ...(Array.isArray(defaultBlockList) ? defaultBlockList : [defaultBlockList]),
  /[/\\]\.expo[/\\]tmp(?:[/\\].*)?$/,
];
config.resolver.assetExts.push("wasm");
// SQLite's web worker uses SharedArrayBuffer. Native builds do not need these headers.
const enhanceMiddleware = config.server.enhanceMiddleware;
config.server.enhanceMiddleware = (middleware, server) => {
  const enhanced = enhanceMiddleware
    ? enhanceMiddleware(middleware, server)
    : middleware;
  return (req, res, next) => {
    res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
    res.setHeader("Cross-Origin-Embedder-Policy", "credentialless");
    return enhanced(req, res, next);
  };
};
module.exports = config;
