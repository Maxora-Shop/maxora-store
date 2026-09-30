const fs = require('fs');
const path = require('path');
const ts = require('typescript');

function walk(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (file === 'node_modules' || file === '.git' || file === 'dist' || file === 'build') continue;
    const full = path.join(dir, file);
    if (fs.statSync(full).isDirectory()) {
      walk(full, fileList);
    } else if (/\.(ts|tsx)$/.test(file)) {
      fileList.push(full);
    }
  }
  return fileList;
}

const allFiles = walk('.');
console.log(`Analyzing ${allFiles.length} files...`);

for (const file of allFiles) {
  const sourceCode = fs.readFileSync(file, 'utf8');
  const sourceFile = ts.createSourceFile(
    file,
    sourceCode,
    ts.ScriptTarget.Latest,
    true
  );

  function checkNode(node, scope = new Set()) {
    // Collect declarations in this scope
    let newScope = scope;

    if (
      ts.isFunctionDeclaration(node) ||
      ts.isFunctionExpression(node) ||
      ts.isArrowFunction(node) ||
      ts.isMethodDeclaration(node) ||
      ts.isBlock(node) ||
      ts.isSourceFile(node)
    ) {
      newScope = new Set(scope);
      // check parameters if function
      if (node.parameters) {
        node.parameters.forEach(p => {
          if (p.name && ts.isIdentifier(p.name)) {
            newScope.add(p.name.text);
          } else if (p.name && ts.isObjectBindingPattern(p.name)) {
            p.name.elements.forEach(elem => {
              if (elem.name && ts.isIdentifier(elem.name)) {
                newScope.add(elem.name.text);
              }
            });
          }
        });
      }
      // check declarations in statements
      if (node.statements) {
        node.statements.forEach(stmt => {
          if (ts.isVariableStatement(stmt)) {
            stmt.declarationList.declarations.forEach(decl => {
              if (ts.isIdentifier(decl.name)) {
                newScope.add(decl.name.text);
              } else if (ts.isObjectBindingPattern(decl.name)) {
                decl.name.elements.forEach(elem => {
                  if (elem.name && ts.isIdentifier(elem.name)) {
                    newScope.add(elem.name.text);
                  }
                });
              }
            });
          }
          if (ts.isFunctionDeclaration(stmt) && stmt.name) {
            newScope.add(stmt.name.text);
          }
          if (ts.isImportDeclaration(stmt)) {
            if (stmt.importClause?.name) newScope.add(stmt.importClause.name.text);
            if (stmt.importClause?.namedBindings) {
              if (ts.isNamedImports(stmt.importClause.namedBindings)) {
                stmt.importClause.namedBindings.elements.forEach(e => newScope.add(e.name.text));
              } else if (ts.isNamespaceImport(stmt.importClause.namedBindings)) {
                newScope.add(stmt.importClause.namedBindings.name.text);
              }
            }
          }
        });
      }
    }

    if (ts.isIdentifier(node) && node.text === 'settings') {
      const parent = node.parent;
      // Exclude property accesses like db.settings, obj.settings
      const isPropertyAccess = ts.isPropertyAccessExpression(parent) && parent.name === node;
      // Exclude type references, interface members, property assignments
      const isType = ts.isTypeReferenceNode(parent) || ts.isInterfaceDeclaration(parent) || ts.isTypeAliasDeclaration(parent);
      const isPropName = ts.isPropertyAssignment(parent) && parent.name === node;
      const isMethodName = ts.isMethodDeclaration(parent) && parent.name === node;
      const isImportSpecifier = ts.isImportSpecifier(parent);
      const isParameter = ts.isParameter(parent);
      const isBindingElement = ts.isBindingElement(parent);
      const isVarDecl = ts.isVariableDeclaration(parent) && parent.name === node;

      if (!isPropertyAccess && !isType && !isPropName && !isMethodName && !isImportSpecifier && !isParameter && !isBindingElement && !isVarDecl) {
        if (!newScope.has('settings')) {
          const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
          console.log(`POTENTIAL UNDEFINED 'settings' at ${file}:${line + 1}:${character + 1}`);
        }
      }
    }

    ts.forEachChild(node, child => checkNode(child, newScope));
  }

  checkNode(sourceFile);
}
console.log('Analysis finished.');
