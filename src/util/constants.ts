export const getInitConfig = (projectName: string, initEnv: string) => `{
	"${projectName}": {
		"migrationsFolder": ".dmcs/migrations",
		"migrations": {
			"${initEnv}": []
		}
	}
}
`;

export const getInitMigration = (
  fileName: string
) => `import { DynamoDBClient, ScanCommand } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, UpdateCommand } from "@aws-sdk/lib-dynamodb";

// Initialize DynamoDB client
const client = new DynamoDBClient();
const docClient = DynamoDBDocumentClient.from(client);

export const up = () => {
	// Your migration code here
	console.log('TODO: ${fileName} up migration');
}

export const down = () => {
	// Your migration code here
	console.log('TODO: ${fileName} down migration');
}
`;
