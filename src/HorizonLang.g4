grammar HorizonLang;

// Lexer rules
UINT8: 'uint8';
INT8: 'int8';
UINT16: 'uint16';
INT16: 'int16';
UINT32: 'uint32';
INT32: 'int32';
UINT64: 'uint64';
INT64: 'int64';
FLOAT32: 'float32';
FLOAT64: 'float64';
IMPORT: 'import';
INT: [0-9]+;
FLOAT: [0-9]+'.'[0-9]+;
STRING: '"' (~["\r\n] | '\\' .)* '"' | '\'' (~['\r\n] | '\\' .)* '\'';
ID: [a-zA-Z_][a-zA-Z_0-9]*;
NEWLINE: [\r\n]+;
WS: [\t]+ -> skip; // Only skipping spaces and tabs, not newlines
SL: [ ]+;

// Parser rules
prog: stat+ ;

stat: importStat
    | varDecl
    | assignStat
    | exprStat
    ;

importStat: IMPORT SL ID ('.' ID)* NEWLINE;

varDecl: ID ':' type '=' constExpr NEWLINE;

assignStat: ID '=' expr NEWLINE;

exprStat: expr NEWLINE;

type: UINT8 | INT8 | UINT16 | INT16 | UINT32 | INT32 | UINT64 | INT64 | FLOAT32 | FLOAT64;

// Expression, including function calls
expr: expr ('*' | '/') expr
    | expr ('+' | '-') expr
    | functionCall
    | INT
    | FLOAT
    | STRING
    | ID
    | '(' expr ')'
    ;

// Function call with named parameters
functionCall: ID ('.' ID)* '(' namedParam (',' namedParam)* ')' NEWLINE;

// Named parameter definition
namedParam: ID '=' expr ;

// Constant expression, only literals or constant computations
constExpr: INT
         | FLOAT
         | STRING
         | constExpr ('+' | '-') constExpr
         | constExpr ('*' | '/') constExpr
         | '(' constExpr ')'
         ;
