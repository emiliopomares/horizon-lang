function compile() {
    const code = document.getElementById("code").value;
  
    // Tokenize and parse the input
    const chars = new antlr4.InputStream(code);
    const lexer = new SimpleLangLexer(chars);
    const tokens = new antlr4.CommonTokenStream(lexer);
    const parser = new SimpleLangParser(tokens);
    const tree = parser.program();
  
    // First Pass: Build Symbol Table
    const firstPass = new FirstPassListener();
    antlr4.tree.ParseTreeWalker.DEFAULT.walk(firstPass, tree);
  
    // Second Pass: Generate JavaScript Code
    const codeGen = new CodeGeneratorVisitor(firstPass.symbolTable);
    const jsCode = codeGen.visit(tree);
  
    // Display Generated Code
    document.getElementById("output").innerText = jsCode;
  
    // Optionally, execute the generated code
    eval(jsCode); // Be cautious with eval in production!
  }
  