import { Command } from "@commander-js/extra-typings";
import { writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import prompts from "prompts";
import ora from "ora";
import chalk from "chalk";
import path from "node:path";
import process from "node:process";

const getInitConfig = (initEnv: string) => `{
  "migrationsFolder": ".ddbm/migrations",
	"migrations": {
		"${initEnv}": []
	}
}
`;

const getInitMigration =
  () => `import { DynamoDBClient, ScanCommand } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, UpdateCommand } from "@aws-sdk/lib-dynamodb";

// Initialize DynamoDB client
const client = new DynamoDBClient();
const docClient = DynamoDBDocumentClient.from(client);

export const up = () => {
	// Your migration code here
	console.log('TODO: up migration');
}

export const down = () => {
	// Your migration code here
	console.log('TODO: up migration');
}
`;

const pathFromCwd = (filePath: string) => path.join(process.cwd(), filePath);

export const init = new Command("init")
  .description(
    "Initialise the AWS DDB migrations folder and configuration file"
  )
  .action(async () => {
    // Ask for initial environment
    const { initEnv } = await prompts(
      {
        type: "text",
        name: "initEnv",
        message: "Enter the initial environment name",
        initial: "development",
      },
      {
        onCancel: () => {
          console.log(chalk.yellow("User cancelled"));
          process.exit(0);
        },
      }
    );

    const spinner = ora("Initialising DDBM...").start();

    // Create initial migrations folder
    if (!existsSync(".ddbm")) {
      await mkdir(".ddbm");
    }

    const configFilePath = pathFromCwd(".ddbm.config.json");
    const migrationsFolderPath = pathFromCwd(".ddbm/migrations");

    // Create initial configuration file
    if (!existsSync(configFilePath)) {
      await writeFile(configFilePath, getInitConfig(initEnv));
    }

    // Create initial migration file
    if (!existsSync(migrationsFolderPath)) {
      await mkdir(migrationsFolderPath);
    }

    const initMigrationFile = `${Date.now()}_init`;
    const migrationFilePath = pathFromCwd(
      `.ddbm/migrations/${initMigrationFile}.mjs`
    );

    await writeFile(migrationFilePath, getInitMigration());

    spinner.succeed("Initialised DDBM");
    console.log(chalk.bgGreen(`CREATED`), chalk.green(`.ddbm.config.js`));
    console.log(
      chalk.bgGreen(`CREATED`),
      chalk.green(`.ddbm/migrations/${initMigrationFile}.mjs`)
    );
  });
