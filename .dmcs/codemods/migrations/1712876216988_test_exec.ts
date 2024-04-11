import { exec } from "node:child_process";

export const up = async () => {
  // Run shell script bin/monorepo-migration/migrate-files.sh
  const stdout = await new Promise((resolve, reject) => {
    exec("echo hello", (error, stdout) => {
      if (error) {
        reject(error);
      }
      resolve(stdout);
    });
  });

  console.log(stdout);
};

export const down = async () => {
  throw new Error("Down migrations are not implemented for test_exec");
};
