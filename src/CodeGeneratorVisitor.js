class CodeGeneratorVisitor extends SimpleLangBaseVisitor {
    constructor(symbolTable) {
      super();
      this.symbolTable = symbolTable;
      this.output = []; // Generated JavaScript code
    }
  
    visitDeclaration(ctx) {
      const varName = ctx.ID().getText();
      const jsType = "let"; // Use `let` for all variable declarations
      this.output.push(`${jsType} ${varName};`);
    }
  
    visitAssignment(ctx) {
      const varName = ctx.ID().getText();
      const value = ctx.value().getText();
      this.output.push(`${varName} = ${value};`);
    }
  
    visitProgram(ctx) {
      ctx.statement().forEach(stmt => this.visit(stmt));
      return this.output.join("\n");
    }
  }
  
  module.exports = CodeGeneratorVisitor;