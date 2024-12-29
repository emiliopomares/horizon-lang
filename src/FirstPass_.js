class FirstPassListener extends SimpleLangBaseListener {
    constructor() {
      super();
      this.symbolTable = {}; // Store variable names and their types
    }
  
    exitDeclaration(ctx) {
      const type = ctx.type().getText();
      const varName = ctx.ID().getText();
  
      if (this.symbolTable[varName]) {
        throw new Error(`Variable '${varName}' already declared.`);
      }
  
      this.symbolTable[varName] = { type, value: null };
    }
  
    exitAssignment(ctx) {
      const varName = ctx.ID().getText();
      const value = ctx.value().getText();
  
      if (!this.symbolTable[varName]) {
        throw new Error(`Variable '${varName}' not declared.`);
      }
  
      // Store the assignment value as a string for now
      this.symbolTable[varName].value = value;
    }
}
  
module.exports = FirstPassListener;