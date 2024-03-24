import { readdir, writeFile } from "node:fs/promises";
import path from "node:path";

// Read all files from a directory and return an array of file names in order of Date.now descending
export const readFilesFromDirDesc = async (dirPath: string) => {
  const files = await readdir(dirPath);
  return files.sort((a, b) => {
    return Date.now() - a.localeCompare(b);
  });
};

export const readMigrationFiles = async () => {
  const migrationsDir = pathFromCwd(".ddbm/migrations");
  const files = await readFilesFromDirDesc(migrationsDir);
  return files.filter((file) => file.endsWith(".mjs"));
};

// Read DDBM configration file and parse JSON
export const ddbmReadConfig = async () => {
  const configPath = pathFromCwd(".ddbm.config.mjs");
  const config = await import(pathFromCwd(configPath));
  return config;
};

// Update the DDBM configuration file
export const ddbmUpdateConfig = async (config: any) => {
  const configPath = pathFromCwd(".ddbm.config.mjs");
  await writeFile(configPath, JSON.stringify(config, null, 2));
};

// Get the absolute path from the current working directory
export const pathFromCwd = (filePath: string) =>
  path.join(process.cwd(), filePath);
