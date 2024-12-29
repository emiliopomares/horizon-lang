import HorizonLangVisitor from './HorizonLangVisitor.js';
import { SymbolTable } from './LangUtils.js';

export default class SecondPass extends HorizonLangVisitor {

    constructor(st, md, vm) {
        super();
        this.symbolTable = st;
        this.modules = md;
        this.vm = vm;
    }

    // Visit a parse tree produced by HorizonLangParser#prog.
    visitProg(ctx) {
        return this.visitChildren(ctx);
    }


    // Visit a parse tree produced by HorizonLangParser#stat.
    visitStat(ctx) {
        return this.visitChildren(ctx);
    }


    // Visit a parse tree produced by HorizonLangParser#varDecl.
    visitVarDecl(ctx) {
        this.vm.defineVariable()
        return null; //this.visitChildren(ctx);
    }


    // Visit a parse tree produced by HorizonLangParser#assignStat.
    visitAssignStat(ctx) {
        return this.visitChildren(ctx);
    }


    // Visit a parse tree produced by HorizonLangParser#exprStat.
    visitExprStat(ctx) {
        return this.visit(ctx.expr());
    }


    // Visit a parse tree produced by HorizonLangParser#type.
    visitType(ctx) {
        return this.visitChildren(ctx);
    }

    // Visit a parse tree produced by HorizonLangParser#functionCall.
	visitFunctionCall(ctx) {
        console.log("[SecondPass] A function call");
        return this.visitChildren(ctx);
    }


    // Visit a parse tree produced by HorizonLangParser#expr.
    visitExpr(ctx) {
        return this.visitChildren(ctx);
    }

}