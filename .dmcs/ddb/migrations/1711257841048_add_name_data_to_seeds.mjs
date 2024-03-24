import { DynamoDBClient, ScanCommand } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { faker } from "@faker-js/faker";

// Initialize DynamoDB client
const client = new DynamoDBClient({
  endpoint: `http://localhost:4566`,
  credentials: {
    accessKeyId: "test",
    secretAccessKey: "test",
  },
  region: process.env.AWS_REGION || "ap-southeast-2",
});
const docClient = DynamoDBDocumentClient.from(client);

if (!process.env.TABLE_NAME) {
  throw new Error("TABLE_NAME environment variable is required");
}

const tableName = process.env.TABLE_NAME;

export const up = async () => {
  let ExclusiveStartKey;
  let index = 0;
  do {
    console.log(`Scanning the table for items (iteration ${++index})...`);

    // Scan the table for items
    const scanResult = await docClient.send(
      new ScanCommand({
        TableName: tableName,
        ExclusiveStartKey,
      })
    );

    console.log("Number of items to update", scanResult.Items.length);

    // Check each item and update if necessary
    for (const item of scanResult.Items || []) {
      let batch = [];

      for (let i = 0; i < 15; i++) {
        const name = faker.person.fullName();

        if (!item.name) {
          const command = new UpdateCommand({
            TableName: tableName,
            Key: {
              pk: item.pk.S,
              sk: item.sk.S,
            }, // Replace "PrimaryKey" with your actual primary key attribute name
            UpdateExpression: "SET #name = :name",
            ExpressionAttributeNames: {
              "#name": "name",
            },
            ExpressionAttributeValues: {
              ":name": name,
            },
          });

          // 'name' field does not exist, so update the item
          batch.push(docClient.send(command));
        }
      }

      await Promise.all(batch);
    }

    // Prepare for the next scan (if any)
    ExclusiveStartKey = scanResult.LastEvaluatedKey;
  } while (ExclusiveStartKey);
};

export const down = async () => {
  let ExclusiveStartKey;
  let index = 0;
  do {
    console.log(
      `Scanning the table for items to rollback (iteration ${++index})...`
    );

    // Scan the table for items
    const scanResult = await docClient.send(
      new ScanCommand({
        TableName: tableName,
        ExclusiveStartKey,
      })
    );

    console.log("Number of items to rollback", scanResult.Items.length);

    // Check each item and rollback modification if necessary
    for (const item of scanResult.Items || []) {
      let batch = [];

      for (let i = 0; i < 15; i++) {
        if (item.name) {
          const command = new UpdateCommand({
            TableName: tableName,
            Key: {
              pk: item.pk.S,
              sk: item.sk.S,
            },
            UpdateExpression: "REMOVE #name",
            ExpressionAttributeNames: {
              "#name": "name",
            },
          });

          // Remove name
          batch.push(docClient.send(command));
        }
      }

      await Promise.all(batch);
    }

    // Prepare for the next scan (if any)
    ExclusiveStartKey = scanResult.LastEvaluatedKey;
  } while (ExclusiveStartKey);

  console.log("Rollback migration completed.");
};
