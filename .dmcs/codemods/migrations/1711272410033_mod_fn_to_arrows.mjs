import { Project, ts } from "ts-morph";

export const up = async () => {
  const project = new Project();

  // Add the source file you want to transform
  const sourceFile = project.addSourceFileAtPath("examples/example.ts");

  // Find all function declarations in the file
  sourceFile.getFunctions().forEach((func) => {
    // Get the name of the function
    const functionName = func.getName();
    if (!functionName) return; // Skip anonymous functions

    // Assuming the function body is simple and contains a single return statement,
    // this will need to be adjusted for more complex functions
    const returnStatements = func.getDescendantsOfKind(
      ts.SyntaxKind.ReturnStatement
    );
    const returnStatement =
      returnStatements.length > 0 ? returnStatements[0] : null;
    let returnText = "{}"; // Default in case of no return statement
    if (returnStatement) {
      // Assuming the return statement is simple and just returns an object or value
      returnText = returnStatement.getExpression()?.getText() || "{}";
    }

    // Create the new arrow function expression
    const arrowFunction = `const ${functionName} = () => ${returnText};`;

    // Replace the old function declaration with the new arrow function
    func.replaceWithText(arrowFunction);
  });

  sourceFile.saveSync();
};

export const down = async () => {
  const project = new Project();

  // Load the transformed source file
  const sourceFile = project.addSourceFileAtPath("examples/example.ts");

  // Use a more heuristic approach to find likely arrow function transformations
  sourceFile.forEachDescendant((node) => {
    if (
      node.getType &&
      node.getType().getText() === "ArrowFunction" &&
      node.getKindName() === "VariableDeclaration"
    ) {
      const arrowFunction = node.getInitializer();
      if (arrowFunction) {
        // Extract necessary parts of the arrow function
        const parameters = arrowFunction
          .getParameters()
          .map((param) => param.getText())
          .join(", ");
        const bodyText = arrowFunction.getBody().getText();
        const functionName = node.getName();

        // Construct the original function declaration
        const functionDeclaration = `function ${functionName}(${parameters}) ${bodyText}`;

        // Replace the arrow function with the function declaration
        node.replaceWithText(functionDeclaration);
      }
    }
  });

  sourceFile.saveSync();
};
