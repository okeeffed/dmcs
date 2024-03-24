import { readdir, writeFile, readFile } from "node:fs/promises";
import path from "node:path";

// Read all files from a directory and return an array of file names in order of Date.now descending
export const readFilesFromDirDesc = async (dirPath: string) => {
  const files = await readdir(dirPath);
  return files.sort((a, b) => {
    return Date.now() - a.localeCompare(b);
  });
};

export const readMigrationFiles = async (project: string) => {
  const migrationsDir = pathFromCwd(`.dmcs/${project}/migrations`);
  const files = await readFilesFromDirDesc(migrationsDir);
  return files.filter((file) => file.endsWith(".mjs"));
};

// Read DMCS configration file and parse JSON
export const dmcsReadConfig = async () => {
  const configPath = pathFromCwd(".dmcs.config.json");
  const config = await readFile(configPath, "utf-8");
  return JSON.parse(config);
};

// Update the DMCS configuration file
export const dmcsUpdateConfig = async (config: any) => {
  const configPath = pathFromCwd(".dmcs.config.json");
  await writeFile(configPath, JSON.stringify(config, null, 2));
};

// Get the absolute path from the current working directory
export const pathFromCwd = (filePath: string) =>
  path.join(process.cwd(), filePath);
