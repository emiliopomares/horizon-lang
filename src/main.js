import antlr4 from 'antlr4';
import readline from 'readline';

import HorizonLexer from './HorizonLangLexer.js';
import HorizonLangParser from './HorizonLangParser.js';
import HorizonLangVisitor from './HorizonLangVisitor.js';
import FirstPass from './FirstPass.js';
import SecondPass from './SecondPass.js';

import HorizonModule from './Modules.js';

import { SymbolTable } from './LangUtils.js';

// Create a readline interface for console input
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

var symbolTable = new SymbolTable();

function prepareImplicitModules() {
    var modules = [];
    var io_module = new HorizonModule("IO", system_module);
    modules.push(io_module);
    
    var system_module = new HorizonModule("System", null);
    modules.push(system_module);

    io_module.addImplicitFunction("log", (data) => {
        console.log(data);
    })

    system_module.addSubmodule(io_module);
}

const modules = prepareImplicitModules();

// Function to process the input
function processInput(inputText) {
    try {
        // Create a character stream from the input text
        const chars = new antlr4.InputStream(inputText);

        // Create a lexer from the input stream
        const lexer = new HorizonLexer(chars);
        
        // Tokenize the input
        const tokens = new antlr4.CommonTokenStream(lexer);

        // Create a parser from the token stream
        const parser = new HorizonLangParser(tokens);

        // Parse the input (assume starting rule is 'program' or whatever the root rule is in your grammar)
        const tree = parser.prog(); // Replace `program()` with your actual starting rule

        // Now, apply the visitor to the parse tree
        const visitor = new FirstPass(symbolTable, modules);
        const result = visitor.visit(tree);

        // Now, apply the visitor to the parse tree
        const executor = new SecondPass(symbolTable, modules);
        const execresult = executor.visit(tree);

        // Output the result of the visitor's processing
        console.log('Visitor result:', result, execresult);
    } catch (error) {
        console.error('Error processing input:', error);
    }
}

// Function to prompt for input in a loop
function prompt() {
    rl.question('Enter code to process (type "exit" to quit): ', (inputText) => {
        if (inputText.trim().toLowerCase() === 'exit') {
            console.log('Exiting REPL...');
            symbolTable.printAllSymbols();
            rl.close();
        } else {
            console.log(` processing ->${inputText}<-`)
            processInput(inputText + "\n");
            prompt(); // Continue the loop
        }
    });
}

// Start the REPL
prompt();