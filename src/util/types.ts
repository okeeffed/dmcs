import { exec } from "node:child_process";

export type Sandbox = {
  exec: typeof exec;
  console: typeof console;
  process: typeof process;
  Buffer: typeof Buffer;
  setTimeout: typeof setTimeout;
  setInterval: typeof setInterval;
  clearTimeout: typeof clearTimeout;
  clearInterval: typeof clearInterval;
  __dirname: string;
  __filename: string;
  module: {
    exports: {
      up?: () => Promise<void>;
      down?: () => Promise<void>;
    };
  };
  require: (id: string) => any;
};
