# Data Migration/Codemods Service

DMCS is a way to help you manage running data migrations and code mods in a manner similar to how we run database migrations.

It was primarily born out of a desire for more controlled DynamoDB data migrations, but it applicable to any form of migrations (whether it be SQL database, codemods, etc).

## How it works

There are a few important concepts.

1. **Projects**: DMCS is multi-project, so if you want to use it for multiple things such as codemod migrations as well as DynamoDB data migrations, you can. They are separated into their own sub-folder configurations.
2. **Environments**: DMCS supports multiple environments for tracking how migrations have been done. Alpha is file-based only, which comes with its own trade-offs. Effectively, once a migration is applied, it will be updated in the configuration file (defaulted to `.dmcs.config.json` while in beta).
3. **Migrations**: Migrations are managed within `.mjs` files. There is a `up` and `down` function required for each file to help with managing migrations up and rollbacks to revert those changes. Migrations and rollbacks are applied in chronological or reverse-chronological order based on the timestamp applied to the file name when the migration file was created.

Given scope for a migration you want to run within a project and environment, you can run commands to do things such as creating new migration files.

## Out-of-scope for initial alpha release

- `apply` and `revert` for individual migrations. This can be added later.
- Multiple file format support. YAML and TOML can be added later.
