export type Sandbox = {
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
