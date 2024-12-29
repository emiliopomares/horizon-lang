export class SymbolTable {
    constructor() {
        // Initialize the context stack with a global scope
        this.contextStack = [{}];
    }

    // Start a new scope by pushing a new context onto the stack
    enterScope() {
        this.contextStack.push({});
    }

    // Exit the current scope by popping a context from the stack
    exitScope() {
        if (this.contextStack.length === 1) {
            throw new Error("Cannot exit global scope");
        }
        this.contextStack.pop();
    }

    // Define a new variable in the current scope/context
    define(name, value) {
        // Define in the topmost context (current scope)
        const currentContext = this.contextStack[this.contextStack.length - 1];
        currentContext[name] = value;
    }

    // Lookup a variable value, searching outward through the scopes
    lookup(name) {
        // Search from the topmost context to global
        for (let i = this.contextStack.length - 1; i >= 0; i--) {
            if (name in this.contextStack[i]) {
                return this.contextStack[i][name];
            }
        }
        throw new Error(`Undefined variable '${name}'`);
    }

    // Assign a value to a variable, searching outward through the scopes
    assign(name, value) {
        // Search from the topmost context to global
        for (let i = this.contextStack.length - 1; i >= 0; i--) {
            if (name in this.contextStack[i]) {
                this.contextStack[i][name] = value;
                return;
            }
        }
        throw new Error(`Undefined variable '${name}'`);
    }

    // Print all symbols in all scopes
    printAllSymbols() {
        console.log("Symbol Table Contents:");
        for (let i = this.contextStack.length - 1; i >= 0; i--) {
            console.log(`Scope ${i}`);
            const scope = this.contextStack[i];
            for (const [key, value] of Object.entries(scope)) {
                console.log(`  ${key}: ${JSON.stringify(value)}`); // Use JSON.stringify to print complex values
            }
        }
    }
}