import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  BatchWriteCommand,
  DynamoDBDocumentClient,
} from "@aws-sdk/lib-dynamodb";
import { faker } from "@faker-js/faker";
import { writeFile } from "node:fs/promises";

const client = new DynamoDBClient({
  endpoint: `http://localhost:4566`,
  credentials: {
    accessKeyId: "test",
    secretAccessKey: "test",
  },
  region: "us-east-1",
});
const ddbDocClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = "ddbm";

const NUM_ITEMS = 1000;

/**
 * Seed users with random data.
 */
async function seedData(tableName: string) {
  let items = [];

  for (let i = 0; i < NUM_ITEMS; i++) {
    const iso = new Date().toISOString();

    items.push({
      PutRequest: {
        Item: {
          pk: `SEED#${faker.string.uuid()}`,
          sk: iso,
          description: faker.string.alphanumeric(10),
          name: faker.string.alphanumeric(10),
        },
      },
    });

    if (items.length === 10) {
      await ddbDocClient.send(
        new BatchWriteCommand({
          RequestItems: {
            [tableName]: items,
          },
        })
      );
      items.length = 0; // Clear the array
    }
  }
}

async function main() {
  console.log(`Seeding data for table: ${TABLE_NAME}`);

  console.log("Seeding roles with parties...");
  await seedData(TABLE_NAME);

  console.log("Seeding completed.");
}

main().catch(console.error);
