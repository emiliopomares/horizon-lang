import HorizonLangVisitor from './HorizonLangVisitor.js';
import { SymbolTable } from './LangUtils.js';

export default class FirstPass extends HorizonLangVisitor {

    constructor(st, md) {
        super();
        this.symbolTable = st;
        this.modules = md;
    }

    // Visit a parse tree produced by HorizonLangParser#prog.
    visitProg(ctx) {
        console.log("A prog");
        return this.visitChildren(ctx);
    }


    // Visit a parse tree produced by HorizonLangParser#stat.
    visitStat(ctx) {
        console.log("A statement");
        return this.visitChildren(ctx);
    }


    // Visit a parse tree produced by HorizonLangParser#varDecl.
    visitVarDecl(ctx) {
        console.log("A var declr");
        // Extract the variable name
        const varName = ctx.ID().getText();
        
        // Extract the type
        const varType = ctx.type().getText();
        
        // Evaluate the initial expression value
        const initialValue = this.visit(ctx.expr());
    
        // Register the variable in the symbol table
        this.symbolTable.define(varName, { type: varType, value: initialValue });
    
        console.log(`Variable declaration - Name: ${varName}, Type: ${varType}, Initial Value: ${JSON.stringify(initialValue)}`);
    
        return null; 
    }

    // Visit a parse tree produced by HorizonLangParser#importStat.
	visitImportStat(ctx) {
        console.log('Import');
        // Create an array to store each part of the module path
        const modulePath = [];

        // Add the first 'ID' to the module path
        modulePath.push(ctx.ID(0).getText());

        // Iterate over the remaining '.ID' pairs
        for (let i = 1; i < ctx.ID().length; i++) {
            modulePath.push(ctx.ID(i).getText());
        }

        // Now modulePath contains all segments of the path
        console.log('Importing module path:', modulePath.join('.'));
        return null;
    }


    // Visit a parse tree produced by HorizonLangParser#assignStat.
    visitAssignStat(ctx) {
        console.log("An assignation");
        return this.visitChildren(ctx);
    }


    // Visit a parse tree produced by HorizonLangParser#exprStat.
    visitExprStat(ctx) {
        console.log("An expression statemtnt");
        return this.visit(ctx.expr());
    }


    // Visit a parse tree produced by HorizonLangParser#type.
    visitType(ctx) {
        console.log("A type");
        return this.visitChildren(ctx);
    }


    // Visit a parse tree produced by HorizonLangParser#functionCall.
	visitFunctionCall(ctx) {
        console.log("[FirstPass] A function call");
        return this.visitChildren(ctx);
    }

    // Visit a parse tree produced by HorizonLangParser#namedParam.
	visitNamedParam(ctx) {
        console.log("[FirstPass] A named param");
        return this.visitChildren(ctx);
    }

    // Visit a parse tree produced by HorizonLangParser#expr.
    visitExpr(ctx) {
        console.log("An expression of length: " + ctx.expr().length);
        if (ctx.expr().length === 2) {
            const left = this.visit(ctx.expr(0));
            const right = this.visit(ctx.expr(1));
            const operator = ctx.getChild(1).getText();
            console.log(`   ${JSON.stringify(left)} ${JSON.stringify(right)} ${JSON.stringify(operator)}`);
    
            // Ensure both operands are of the same type (or can be coerced)
            if (left.type !== right.type) {
                throw new Error(`Type mismatch: ${left.ctype} and ${right.ctype}`);
            }
    
            // Perform operation based on type
            let result;
            if (left.ctype === 'int' || left.ctype === 'float') {
                switch (operator) {
                    case '+':
                        result = left.value + right.value;
                        break;
                    case '-':
                        result = left.value - right.value;
                        break;
                    case '*':
                        result = left.value * right.value;
                        break;
                    case '/':
                        if (right.value === 0) throw new Error('Division by zero');
                        result = left.value / right.value;
                        break;
                    default:
                        throw new Error(`Unexpected operator: ${operator}`);
                }
            } else {
                throw new Error(`Unsupported type for arithmetic: ${left.ctype}`);
            }
    
            return { ctype: left.type, value: result };
        }
        // Case: Integer Literal
        if (ctx.INT()) {
            return {"ctype": "int", "value": parseInt(ctx.INT().getText(), 10)};
        }

        // Case: Integer Literal
        if (ctx.STRING()) {
            return {"ctype": "string", "value": ctx.STRING().getText().slice(1,-1)};
        }

        // Case: Float Literal
        if (ctx.FLOAT()) {
            return {"ctype": "int", "value": parseFloat(ctx.FLOAT().getText())};
        }

        return this.visitChildren(ctx);
    }

}