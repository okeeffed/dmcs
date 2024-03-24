export const getInitConfig = (projectName: string, initEnv: string) => `{
	"${projectName}": {
		"migrationsFolder": ".dmcs/${projectName}/migrations",
		"migrations": {
			"${initEnv}": []
		}
	}
}
`;

export const getInitMigration = (fileName: string) => `
export const up = async () => {
	throw new Error('Up migrations are not implemented for ${fileName}');
}

export const down = async () => {
	throw new Error('Down migrations are not implemented for ${fileName}');
}
`;
