import type { Plugin } from "esbuild";

export const nodeExternalsPlugin: Plugin = {
  name: "node-externals",
  setup(build) {
    // List of Node.js built-in modules
    const builtins = new Set([
      "assert",
      "buffer",
      "child_process",
      "cluster",
      "crypto",
      "dgram",
      "dns",
      "domain",
      "events",
      "fs",
      "http",
      "https",
      "net",
      "os",
      "path",
      "punycode",
      "querystring",
      "readline",
      "stream",
      "string_decoder",
      "tls",
      "tty",
      "url",
      "util",
      "v8",
      "vm",
      "zlib",
    ]);

    build.onResolve({ filter: /^[^.]/ }, (args) => {
      if (builtins.has(args.path) || args.path.startsWith("node:")) {
        return { external: true };
      }
      // For all other modules, allow esbuild to resolve and bundle
      return null;
    });
  },
};
