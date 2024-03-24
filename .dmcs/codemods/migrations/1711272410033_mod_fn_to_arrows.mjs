import { Project } from "ts-morph";
import { pathFromCwd } from "@/util/fs";

export const up = async () => {
  const project = new Project();

  // Add the source file you want to transform
  const sourceFile = project.addSourceFileAtPath(
    pathFromCwd("examples/example.ts")
  );

  // Find all function declarations in the file
  sourceFile.getFunctions().forEach((func) => {
    // Get the name of the function
    const functionName = func.getName();

    if (!functionName) return;

    // We need to extract the return statement's content
    // Assuming the function body is simple and contains a single return statement
    const returnStatement = func
      .getBody()
      // @ts-ignore
      ?.getStatements()
      .find((s) => s.getKind() === "ReturnStatement");

    // Extracting the text to return directly
    let returnText = returnStatement?.getChildAtIndex(1)?.getText() || "{}"; // Default to '{}' in case of no return

    // Create the new arrow function expression
    const arrowFunction = `const ${functionName} = () => (${returnText});`;

    // Replace the old function declaration with the new arrow function
    func.replaceWithText(arrowFunction);
  });

  sourceFile.saveSync();
};

export const down = async () => {
  const project = new Project();

  // Load the transformed source file
  const sourceFile = project.addSourceFileAtPath(
    pathFromCwd("examples/example.ts")
  );

  // Find all variables declarations that are arrow functions
  sourceFile.getVariableStatements().forEach((variableStatement) => {
    variableStatement.getDeclarations().forEach((declaration) => {
      const initializer = declaration.getInitializer();
      if (initializer && initializer.getKind() === SyntaxKind.ArrowFunction) {
        const arrowFunction = initializer;
        const bodyText = arrowFunction.getBody().getText();
        const parameters = arrowFunction
          .getParameters()
          .map((param) => param.getText())
          .join(", ");
        const functionName = declaration.getName();

        // Reconstruct the original function declaration
        const functionDeclaration = `function ${functionName}(${parameters}) ${bodyText}`;

        // Replace the arrow function with the original function declaration
        declaration.replaceWithText(functionDeclaration);
      }
    });
  });

  sourceFile.saveSync();
};
