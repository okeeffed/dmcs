import { exec } from "node:child_process";

export type Sandbox = {
  exec: typeof exec;
  console: Console;
  require: (moduleName: string) => any;
  process: NodeJS.Process;
  module: {
    exports: {
      up?: () => Promise<void>;
      down?: () => Promise<void>;
    };
  };
  __dirname: string;
  __filename: string;
};
