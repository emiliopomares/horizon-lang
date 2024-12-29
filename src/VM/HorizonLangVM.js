import { startServer, poolMembers } from '../Server.js';
import { WebSocket } from 'ws';

const HORIZON_SERVER_PORT = 2066;

var connectedPeers = []; // This should go in a MainController class or something

function connectToFoundServer(addr) {
    const peerConnection = new WebSocket(`ws://${addr.remoteIPAddress}:${HORIZON_SERVER_PORT}`);

    // Handle connection open
    peerConnection.on('open', () => {
        console.log(`Connected to peer at ws://${PEER_IP}:${PEER_PORT}`);
        //peerConnection.send('Hello to the peer!');
    });

    // Handle messages from the peer
    peerConnection.on('message', (message) => {
        console.log('Message from peer:', message);
    });

    // Handle connection errors
    peerConnection.on('error', (error) => {
        console.error('Error connecting to peer:', error);
    });

    // Handle connection close
    peerConnection.on('close', () => {
        console.log('Peer connection closed');
    });

    connectedPeers.push(peerConnection);
}

// Create a WebSocket server on port HORIZON_SERVER_PORT
const wss = new WebSocket.Server({ port: HORIZON_SERVER_PORT });

console.log('WebSocket server is running on ws://localhost:8080');

// Handle incoming connections
wss.on('connection', (ws) => {
    console.log('New client connected');

    // Send a welcome message to the client
    ws.send('Welcome to the WebSocket server!');

    // Listen for messages from the client
    ws.on('message', (message) => {
        console.log(`Received: ${message}`);

        // Echo the message back to the client
        ws.send(`Server received: ${message}`);
    });

    // Handle client disconnect
    ws.on('close', () => {
        console.log('Client disconnected');
    });

    // Handle errors
    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
    });
});

// Start the discovery server
startServer(connectToFoundServer);

import { exit } from "process";

const ADD = 0x01;
const SUB = 0x02;
const MUL = 0x03;
const DIV = 0x04;
const MATHEXP = 0x05;
const MATHSIN = 0x06;
const MATHCOS = 0x07;
const MATHTAN = 0x08;
const COPY = 0x12;
const STARTFUNC = 0x32;
const ENDFUNC = 0x33;
const CALLFUNC = 0x34;
const STARTTYPE = 0x35;
const ENDTYPE = 0x36;
const STARTCLASS = 0x36;
const ENDCLASS = 0x37;
const STARTUNIT = 0x38;
const ENDUNIT = 0x39;
const STARTLOOP = 0x40;
const ENDLOOP = 0x41;
const CONDBREAK = 0x42;
const DEFINEVAR = 0x60;
const DEFINEPARAM = 0x61;
const SYSLOG = 0xF0;

const UINT8 = 0;
const INT8 = 1;
const UINT16 = 2;
const INT16 = 3;
const UINT32 = 4;
const INT32 = 5;
const UINT64 = 6;
const INT64 = 7;
const FLOAT32 = 8;
const FLOAT64 = 9;
const STRING = 10;
const BOOLEAN = 11;
const ACCUMULATOR = 12;
const OBJECT = 13;

const CUSTOMTYPESTART = 14;

const typenames = {
    0: 'uint8',
    1: 'int8',
    2: 'uint16',
    3: 'int16',
    4: 'uint32',
    5: 'int32',
    6: 'uint64',
    7: 'int64',
    8: 'float32',
    9: 'float64',
    10: 'string',
    11: 'boolean',
    12: 'accumulator',
    13: 'object'
}

const VARIABLE = 255;

const INFO = 16;
const DEBUG = 32;

const ENABLED_CHANNELS = (1 | INFO | DEBUG);

function Log(level, data) {
    if (ENABLED_CHANNELS & level) {
        console.log(data);
    }
}

class HorizonVMLoop {
    constructor(in_point, out_point) {
        this.in_point = in_point;
        this.out_point = out_point;
    }
}

class HorizonVMFunction {
    constructor(name, returntype, entry_point) {
        this.name = name;
        this.entry_point = entry_point;
        this.parameters = {};
    }
    setExitPoint(exit_point) {
        this.exit_point = exit_point;
    }

    addParameterIfNotExists(id, name, type, default_value) {
        if (name in this.parameters) {
            Log(DEBUG, `Function ${this.name} already had parameter ${name}`);
            return;
        }
        this.parameters[name] = {
            id: id,
            type: type,
            default_value: default_value,
            name: name
        }
        Log(DEBUG, `Function ${this.name} has now parameters: ${JSON.stringify(this.parameters)}`);
    }
}

class HorizonVMFunctionCall {
    constructor(return_point, bind_values) {
        this.return_point = return_point;
        this.bind_values = bind_values;
    }
}

class HorizonVMType {
    constructor(parentType=undefined) {
        this.parentType = parentType;
        this.fields = {}
    }

    addField(name, type, default_value=null) {
        this.fields[name] = {
            type: type,
            default_value: default_value
        }
    }
}

class HorizonVMClass extends HorizonVMType {

}

class HorizonVMUnit extends HorizonVMClass {
    
}

class HorizonVMScope {

    constructor(parentScope) {
        this.parentScope = parentScope;
        this.symbols = {}; // Dictionary for typed variables
        this.symbolsByName = {};
        this.types = {};
        this.typesByName = {};
        this.currentType = null;
    }

    getTypeByName(name) {
        return this.typesByName[name];
    }

    getType(vtype) {
        for(var k of Object.keys(this.types)) {
            console.log(`                       checking k: ${k}`);
            if (this.types[k].type == vtype) {
                console.log(`                       matched type: ${JSON.stringify(this.types[k])}`);
                return this.types[k];
            }
        }
        return null;
    }

    instantiateType(type) {
        const typedata = this.types[type];
        console.log(`    *************************** instantiateType ${type}, typedata: ${JSON.stringify(typedata)}`)
        var newobj = {};
        for (var f of typedata.fields) {
            newobj[f.name] = {
                type: f.type,
                value: f.value,
                name: f.name
            }
        }
        return newobj;
    }

    defineType(id, type, name) {
        const typeData = {
            type: type,
            fields: []
        }
        const newType = {
            id,
            name,
            type: 'type',
            data: typeData
        }
        this.symbols[id] = newType;
        this.symbolsByName[name] = newType;
        this.types[type] = typeData;
        this.typesByName[name] = typeData;
        this.currentType = newType;
        return newType;
    }

    addTypeField(type, default_value=null, name) {
        if(this.currentType==null) {
            // EXCEPTION!!
            return;
        }
        this.currentType.data.fields.push({
            type: type,
            value: default_value,
            name: name,
        });
    }

    // Define a typed variable
    defineVariable(id, type, default_value=null, name=null) {
        console.log(`           *************************************** PESAMOS POR AQUI ******************************************* `);
        var definitionValue = VMUtils.castValue(type, default_value ?? 0);
        if(!definitionValue) {
            definitionValue = this.instantiateType(type);
        }
        const newVar = {
            id,
            name,
            type: 'variable',
            data: { 
                type, 
                value: definitionValue, 
            }
        };
        this.symbols[id] = newVar;
        if(name != null) {
            this.symbolsByName[name] = newVar;
        }
        return newVar;
    }

    defineFunction(id, f, rettype, name=null) {
        const newVar = {
            id,
            name,
            type: 'function',
            data: { 
                f,
                rettype
            }
        };
        this.symbols[id] = newVar;
        return newVar;
    };

    // // Assign a value to a variable
    // assignVariable(idx, value) {
    //     if (idx >= this.variables.length) {
    //         throw new Error(`Variable ${idx} is not defined.`);
    //     }
    //     const { type } = this.variables[idx];
    //     this.variables[idx].value = this.castValue(type, value);
    // }

    // Retrieve the value of a variable
    getSymbol(idx) {
        //Log(DEBUG, `   Looking for symbol ${idx} and the symbols I know are ${JSON.stringify(this.symbols, null, 4)}`)
        if (!(idx in this.symbols)) {
            return undefined;
        }
        return this.symbols[idx];
    }

    getSymbols() {
         return this.symbols;
    }

}

class HorizonVMProcess {
    constructor() {
        this.bytecode = [];
        this.PC = 0;
    }
}

class HorizonLangVM {
    constructor() {
        this.symbolCounter = 0;
        this.variables = {}; // Dictionary for typed variables
        this.scopes = [];
        this.stack = []; // Stack for intermediate calculations
        this.bytecodeHandlers = {}; // Bytecode to operation handlers
        this.arithmetic_handlers = {};
        this.bytecode = []
        this.setupBytecodeHandlers();
        this.scopes = []; // root scope
        this.functionsStack = [];
        this.currentScope = new HorizonVMScope(null);
        this.rootScope = this.currentScope;
        this.currentFunction = null;
        this.accumulator = null;
        this.PC = 0;
        this.scopeCounter = 0;
        this.currentFunction = null;
        this.returnAddress = [];
        this.bindings = [];
        this.usedNames = {};
        this.idCounter = 0;
        this.typeCounter = 0;
        this.operationState = "instruction"
        this.processes = {}
    }

    formatEventForWebsocket(eventId, eventType, eventData) {
        if(this.isSimpleType(eventType)) {
            const jsondata = {
                eventId: eventId,
                eventData: [
                    {
                        type: eventType,
                        value: eventData
                    }
                ]
            }
            return JSON.stringify(jsondata);
        }
        else { 
            // com.axioma.test1.class_or_unit_name.event_name -> source (tiene que tener como mínimo 3 campos, pero sin límite)
            // destination: applocal.class_or_unit_name
            // accept: com.axima.test1.*
            // yo llamo emit("class_or_unit_name.event_name") el com.axioma.test1 se pega solo
            // ^app:enemy_management.enemy_spotted(enemyId)
        }
        // Esto no es tan trivial
        // para tipos simples (ej: float32)
        // eventdata: {
        //    values: [
        //          {
        //              type: 8
        //              value: 0.241
        //          }
        //    ]
        // }
        // para tipos no simples, hay que mirar la lista de tipos para
        // ver los fields que tienen
    }

    createAndAttachProcess(pidstr, bytecode) {
        var p = new HorizonVMProcess();
        p.bytecode = bytecode;
        this.processes[pidstr] = p;
    }

    sendEvent(eventId, eventType, eventData) {
        // eventId first field: applocal, app, pool
        // if it is applocal, deliver this event only to local processes (this.processes)
        // if it is app, send it over the network to other running servers
        const [ prefix, appid ] = VMUtils.splitId(eventId);
        for (var pid of Object.keys(this.processes)) {
            const p = this.processes[pid];
            p.receiveEvent(eventId, eventType, eventData, appid);
        }
        if (prefix == "app" || prefix == "pool") {
            sendEventToRemoteServers(eventId, eventType, eventData);
        }
    }

    receiveEvent(eventId, eventType, eventData, source) {

    }

    getAccumulator() {
        return this.accumulator;
    }

    getSymbolId(name) {
        if (!(name in this.usedNames)) {
            Log(DEBUG, `                    ====>  Asking for id of name ${name}, returning new ${this.idCounter}`);
            this.usedNames[name] = this.idCounter;
            this.idCounter++;
            return this.idCounter-1;
        }
        else {
            Log(DEBUG, `                    ====>  Asking for id of name ${name}, returning stored ${this.usedNames[name]}`);
            return this.usedNames[name];
        }
    }

    pushFunction(name, entry_point) {
        this.currentFunction = new HorizonVMFunction(name, entry_point);
        this.functions.push(this.currentFunction);
        this.functionsStack.push(this.currentFunction);
    }

    getTypeByName(name) {
        return this.currentScope.getTypeByName(name);
    }

    getType(vtype) {
        return this.currentScope.getType(vtype);
    }

    popFunction(exit_point) {
        var f = this.currentFunction = this.functionsStack.pop();
        f.setExitPoint(exit_point);
    }

    pushScope() {
        this.scopes.push(this.currentScope);
        this.currentScope = new HorizonVMScope(this.currentScope);
    }

    popScope() {
        this.currentScope = this.scopes.pop();
    }

    addBytecode(bytes) {
        this.bytecode = this.bytecode.concat(bytes);
    }

    // Define a typed variable
    defineVariable(type, default_value=null, name=null) {
        Log(DEBUG, `   . . . .  defining variable ${name}`);
        return this.currentScope.defineVariable(
            this.getSymbolId(name), 
            type, 
            default_value, 
            name);
    }

    defineType(name) {
        const typeCounter = CUSTOMTYPESTART + (this.typeCounter++);
        Log(DEBUG, `   . . . .  defining type ${name} with typeid: ${typeCounter}`);
        return this.currentScope.defineType(
            this.getSymbolId(name), 
            typeCounter,
            name);
    }

    addTypeField(type, default_value=null, name) {
        Log(DEBUG, `   . . . .  adding field ${name}`);
        this.currentScope.addTypeField(type, default_value, name);
    }

    // Define a typed variable
    defineFunction(f, rettype, name=null) {
        return this.currentScope.defineFunction(
            this.getSymbolId(name), 
            f, 
            rettype, 
            name);
    }

    // Assign a value to a variable
    assignVariable(name, value) {
        this.currentScope.assignVariable(name, value);
    }

    // Retrieve the value of a variable
    getSymbol(idx) {
        var scope = this.currentScope;
        var symbol = scope.getSymbol(idx);
        while(symbol == null && this.currentScope.parentScope != null) {
            scope = scope.parentScope;
            symbol = scope.getSymbol(idx);
        }
        return symbol != null ? symbol.data : null;
    }

    getVariable(idx) {
        return this.getSymbol(idx);
    }

    getFunction(idx) {
        return this.getSymbol(idx);
    }

    setAccumulator(value) {
        this.accumulator = value;
    }

    getAccumulator() {
        return this.accumulator;
    }

    // Setup bytecode handlers
    setupBytecodeHandlers() {

        const arithmetic_handlers = {
            0x01: (a, b) => a + b,        // Addition
            0x02: (a, b) => a - b,        // Subtraction
            0x03: (a, b) => a * b,        // Multiplication
            0x04: (a, b) => a / b,        // Division
            0x05: (a, b) => a ** b,       // Exponentiation
            0x06: Math.sin,               // Sine
            0x07: Math.cos,               // Cosine
            0x08: Math.tan,               // Tangent
        }

        const handlers = {
            0x01: (a, b) => a + b,        // Addition
            0x02: (a, b) => a - b,        // Subtraction
            0x03: (a, b) => a * b,        // Multiplication
            0x04: (a, b) => a / b,        // Division
            0x05: (a, b) => a ** b,       // Exponentiation
            0x06: Math.sin,               // Sine
            0x07: Math.cos,               // Cosine
            0x08: Math.tan,               // Tangent
            //0x60: () => 
            0xF0: () => console.log(...this.stack.splice(-1)), // Implicit: Log to console
        };

        Object.entries(handlers).forEach(([key, fn]) => {
            this.bytecodeHandlers[key] = fn;
        });

        Object.entries(arithmetic_handlers).forEach(([key, fn]) => {
            this.arithmetic_handlers[key] = fn;
        });
    }

    getValue(mode, bytecodes) {
        if(mode&16) { // constant

        }
        else { // variable

        }
    }

    getValue(op, bytecodes) {
        if(op&0xf0 == 16) { // constant

        }
        else {

        }
    }

    getVariableType(dst) {
        Log(DEBUG, ` getVariableType: ${JSON.stringify(this.getVariable(dst))}`);
        return this.getVariable(dst).type;
    }

    getPC() {
        return this.PC;
    }

    createSourceByte(type, size) {
        // size is the low-nibble
        // 32: is array
        // 64: is dict
        // 128: is var
        var byte = 0;
        if (type=="variable") { // let's make it
            return VARIABLE;
        }

        if(type=="accumulator") {
            return ACCUMULATOR;
        }

        switch (size) {
            case 'uint8': byte+=UINT8; break;
            case 'int8': byte+=INT8; break;
            case 'uint16': byte+=UINT16; break;
            case 'int16': byte+=INT16; break;
            case 'uint32': byte+=UINT32; break;
            case 'int32': byte+=INT32; break;
            case 'uint64': byte+=UINT64; break;
            case 'int64': byte+=INT64; break;
            case 'float32': byte+=FLOAT32; break;
            case 'float64': byte+=FLOAT64; break;
            case 'string': byte+=STRING; break;
            case 'boolean': byte+=BOOLEAN; break;
            case 'accumulator': byte+=ACCUMULATOR; break;
            case 'object': byte+=OBJECT; break;
            default: 
                console.log(`  ASKING FOR SIZE: ${size}`);
                const typ_ = this.getTypeByName(size);
                console.log(`  FOUND TYP_: ${JSON.stringify(typ_)}`);
                if(typ_!=null) {
                    byte+=typ_.type;
                } else {
                    byte+=size;
                }
        }

        return byte;
    }

    createDestinationByte(type, size) {
        return this.createSourceByte(type, size);
    }

    // Execute bytecodes
    execute() {
        
        var operation = this.bytecode[this.PC++];
        Log(DEBUG, `Operation: 0x${operation.toString(16)}`);

        if (operation == STARTTYPE) {
            Log(DEBUG, `==STARTTYPE==`);
            this.operationState = "deftype";
            var typenameBytes = VMUtils.extractStringSlice(this.bytecode, this.PC);
            const name = Buffer.from(typenameBytes.slice(0,-1)).toString('utf8');
            this.PC += typenameBytes.length;
            Log(DEBUG, `    DEFINING TYPE '${name}'`);
            var newType = this.defineType(name);
            return;
        }

        if (operation == ENDTYPE) {
            Log(DEBUG, `==ENDTYPE==`);
            this.operationState = "instruction";
            return;
        }

        if (operation == ENDFUNC) {
            Log(DEBUG, `==ENDFUNC==`);
            this.popScope();
            Log(DEBUG, `Now, we have ${this.scopes.length} stored scopes`);
            Log(DEBUG, ` and current scope is ${JSON.stringify(this.currentScope)}`);
            if(this.returnAddress.length>0) {
                const retAddr = this.returnAddress.pop();
                Log(DEBUG, `Returning to PC: ${retAddr}`);
                this.PC = retAddr;
            }
            return;
        }

        if (operation == STARTFUNC) {
            Log(DEBUG, `==STARTFUNC==`);
            var nameBytes = VMUtils.extractStringSlice(this.bytecode, this.PC);
            const nameByteLength = nameBytes.length; //Buffer.byteLength(name, 'utf8');
            const name = Buffer.from(nameBytes.slice(0,-1)).toString('utf8');
            Log(DEBUG, `    DEFINING FUNCTION '${name}'`);
            this.PC += nameByteLength;
            var returntype = this.bytecode[this.PC++];

            var f = new HorizonVMFunction(name, returntype, this.PC);
            this.currentFunction = f;
            this.defineFunction(f, returntype, name); 

            this.pushScope();
            Log(DEBUG, `Now, we have ${this.scopes.length} stored scopes`);

            return;
        }

        if (operation == CALLFUNC) {
            Log(DEBUG, `CALLING FUNCTION`);
            // Extract id of function to call
            const fid_data = VMUtils.extractNumberByteSlice(this.bytecode, this.PC);
            const fid = VMUtils.bytesToInteger(fid_data);
            Log(DEBUG, `CALLING FUNCTION id: ${fid}`);
            // locate symbol in scopes
            const fdata = this.getFunction(fid);
            Log(DEBUG, `fdata: ${JSON.stringify(fdata, null, 4)}`);
            const f = fdata.f;
            const rettype = fdata.rettype;
            this.PC += fid_data.length;
            // locate parameters
            // create new scope

            var nparams_data = VMUtils.extractNumberByteSlice(this.bytecode, this.PC);
            Log(DEBUG, `nparams_data: ${nparams_data}`);
            this.PC += nparams_data.length;
            var nparams = VMUtils.bytesToInteger(nparams_data);

            Log(DEBUG, `This function call takes ${nparams} parameter(s)`);

            var opValues = [];
            for(var N=0; N<nparams; ++N) {

                var optype = this.bytecode[this.PC++];
                Log(DEBUG, `optype = ${optype}`);
            
                var opvalue;
                var op_data = VMUtils.extractNumberByteSlice(this.bytecode, this.PC);
                this.PC += op_data.length;
                if(optype == VARIABLE) { 
                    Log(DEBUG, "enter here");
                    var opvarindex = VMUtils.bytesToInteger(op_data);
                    Log(DEBUG, "opvarindex: " + opvarindex);
                    optype = this.getVariable(opvarindex).type;
                    opvalue = this.getVariable(opvarindex).value;
                } else if(optype == ACCUMULATOR) {
                    optype = 8;
                    opvalue = this.accumulator;
                }
                else {
                    opvalue = VMUtils.getParseFunctionByType(optype)(op_data);
                }
                Log(DEBUG, `op${N}value = ${opvalue}`);
                opValues.push(opvalue);
            }

            this.pushScope();
            // get function parameters

            const params = f.parameters;
            Log(DEBUG, `The function parameters: ${JSON.stringify(params)}`);
            var N=0;
            var bindings = []
            Log(DEBUG, JSON.stringify(Object.keys(f.parameters)));
            for(var param of Object.keys(f.parameters)) {
                Log(DEBUG, `${param} - Setting value ${opValues[N]} to ${JSON.stringify(f.parameters[param])}`);
                // Define a typed variable
                const parameterDef = f.parameters[param];
                const value = opValues[N++];
                Log(DEBUG, `parameterDef: ${JSON.stringify(parameterDef)} must have value: ${value}`);
                bindings.push(value);
                //this.currentScope.defineVariable(parameterDef.id, parameterDef.type, value, parameterDef.name);
            }

            this.bindings.push(bindings);

            this.returnAddress.push(this.PC);
            // remember return address

            // set pc to entry point
            this.PC = f.entry_point;

        }


        if (operation >= 0x01 && operation <= 0x05) { // Binary operations
            Log(DEBUG, ` === BINARY OPERATION === `)
            var dsttype = this.bytecode[this.PC++];
            Log(DEBUG, `dsttype = ${dsttype}`);
            var dsttype_ = dsttype;
            var op1type = this.bytecode[this.PC++];
            Log(DEBUG, `op1type = ${op1type}`);
            var op2type = this.bytecode[this.PC++];
            Log(DEBUG, `op2type = ${op2type}`);

            var dstval_data = VMUtils.extractNumberByteSlice(this.bytecode, this.PC);
            Log(DEBUG, `dstval_data = ${dstval_data} with length ${dstval_data.length}`)
            this.PC += dstval_data.length;
            //var dsttype;
            if(dsttype == VARIABLE) { // for now, it only can be a VARIABLE OR ACCUMULATOR
                Log(DEBUG, `dsttype is VARIABLE.... resolving actual type`);
                var dstvarindex = VMUtils.bytesToInteger(dstval_data);
                Log(DEBUG, `  its index is: ${dstvarindex}`);
                Log(DEBUG, `  getting variable: ${JSON.stringify(this.getVariable(dstvarindex), null, 4)}`);
                dsttype = this.getVariable(dstvarindex).type;
            }

            var op1value;
            var op1_data = VMUtils.extractNumberByteSlice(this.bytecode, this.PC);
            this.PC += op1_data.length;
            if(op1type == VARIABLE) { 
                Log(DEBUG, "enter here");
                var op1varindex = VMUtils.bytesToInteger(op1_data);
                Log(DEBUG, "op1varindex: " + op1varindex);
                op1type = this.getVariable(op1varindex).type;
                op1value = this.getVariable(op1varindex).value;
            } else if(op1type == ACCUMULATOR) {
                op1type = 8;
                op1value = this.accumulator;
            } else {
                op1value = VMUtils.getParseFunctionByType(op1type)(op1_data);
            }

            var op2value;
            var op2_data = VMUtils.extractNumberByteSlice(this.bytecode, this.PC);
            this.PC += op2_data.length;
            if(op2type == VARIABLE) { // for now, it only can be a VARIABLE
                var op2varindex = VMUtils.bytesToInteger(op2_data);
                op2type = this.getVariable(op2varindex).type;
                op2value = this.getVariable(op2varindex).value;
            } else if(op2type == ACCUMULATOR) {
                op2type = 8;
                op2value = this.accumulator;
            } else {
                op2value = VMUtils.getParseFunctionByType(op1type)(op2_data);
            }

            console.log(`before: ${operation} dsttype: ${dsttype} op1value: ${op1value} op2value: ${op2value}`);
            if(dsttype == ACCUMULATOR) {
                var dstvarindex = 0;
                dsttype = Math.max(op1type, op2type);
            }
            console.log(`about to call arithmetic op: ${operation} dsttype: ${dsttype} op1value: ${op1value} op2value: ${op2value}`);
            var result = this.arithmetic_handlers[operation](
                    VMUtils.castValue(dsttype, op1value),
                    VMUtils.castValue(dsttype, op2value)
            );
            console.log(` result is: ${result}`);

            if(dsttype_ == VARIABLE) {
                this.getVariable(dstvarindex).value = result;
            } 
            else if(dsttype_ == ACCUMULATOR) {
                this.setAccumulator(result);
                Log(DEBUG, `Now accumulator is: ${this.accumulator}`);
            }
        }

        if (operation >= 0x06 && operation <= 0x08) { // Unary operations
            // copy/paste/adjust
        }

        if (operation==DEFINEVAR || operation==DEFINEPARAM) { // Declare variable
            Log(DEBUG, `==DEFINEVAR==`);
            var vtype = this.bytecode[this.PC++];
            Log(DEBUG, `  vtype: ${vtype} `);

            var nFields = 1;
            var vtypes = [vtype];

            const isSimpleType = VMUtils.isSimpleType(vtype);
            if (!isSimpleType) {
                Log(DEBUG, `                    ))))))))))))))) the vtype ${vtype}`);
                const type = this.getType(vtype);
                Log(DEBUG, `                    ))))))))))))))) ${JSON.stringify(type)}`);
            }

            var initvalue;
            if(vtype!=10) { // not string
                initvalue = VMUtils.extractNumberByteSlice(this.bytecode, this.PC);
            } else {
                initvalue = VMUtils.extractStringSlice(this.bytecode, this.PC);
            }
            this.PC += initvalue.length;
            Log(DEBUG, `definevar initvalue length: ${initvalue.length}`);
            var parsedValue = VMUtils.getParseFunctionByType(vtype)(initvalue);
            
            var nameBytes = VMUtils.extractStringSlice(this.bytecode, this.PC);
            const nameByteLength = nameBytes.length;
            const name = Buffer.from(nameBytes.slice(0,-1)).toString('utf8');
            Log(DEBUG, `    DEFINING '${name}' WITH INITIAL VALUE: ${parsedValue}`);
            this.PC += nameByteLength;
            var defValue = null;
            Log(DEBUG, `    Checking bindings... ${this.bindings.length}`);
            if (this.bindings.length > 0) {
                Log(DEBUG, `       there are bindings...`);
                if(this.bindings[this.bindings.length-1].length>0) {
                    Log(DEBUG, `           still some parameters...`);
                    defValue = this.bindings[this.bindings.length-1].pop();
                    if (this.bindings[this.bindings.length-1].length == 0) {
                        this.bindings.pop();
                    }
                }
            }
            if(this.operationState=="instruction") {
                var newVar = this.defineVariable(vtype, defValue || parsedValue, name);
            }
            else if(this.operationState=="deftype") {
                var newVar = this.addTypeField(vtype, defValue || parsedValue, name);
            }
            Log(DEBUG, `Defined this new variable: ${JSON.stringify(newVar, null, 4)} with bindings: ${defValue}`);
            // additionally
            if (operation==DEFINEPARAM) {
                this.currentFunction.addParameterIfNotExists(newVar.id, name, vtype, defValue || parsedValue);        
            }
            
        }

        if (operation == SYSLOG) {
            Log(DEBUG, ` === SYSLOGGING === `);
            var op1type = this.bytecode[this.PC++];
            var op1type_ = op1type;
            Log(DEBUG, ` vtype: ${op1type_} `);
            var op1value;
            var op1_data = VMUtils.extractNumberByteSlice(this.bytecode, this.PC);
            this.PC += op1_data.length;
            if(op1type == VARIABLE) { // for now, it only can be a VARIABLE
                Log(DEBUG, ` LOGGING A VARIABLE `);
                var op1varindex = VMUtils.bytesToInteger(op1_data);
                op1type = this.getVariable(op1varindex).type;
                op1value = this.getVariable(op1varindex).value;
            } else {
                op1value = VMUtils.getParseFunctionByType(op1type)(op1_data);
            }
            console.log(op1value);
        }
    }

    step(N=1) {
        if(this.PC>=this.bytecode.length) {
            Log(DEBUG, `   --- NO MORE CODE! `);
            return false;
        }
        for(var i=0; i<N; ++i) {
            Log(DEBUG, `   --- STEPPING `);
            this.execute();
            return true;
        }
    }

    // Push a value onto the stack
    push(value) {
        this.stack.push(value);
    }

    print() {
        Log(INFO, `Number of scopes apart from root: ${this.scopes.length}`);
        //Log(INFO, `Current scope: ${JSON.stringify(this.currentScope)}`);
        //Log(INFO, `Current scope number of symbols: ${this.currentScope.getSymbols().length}`);
        for(var j of Object.keys(this.currentScope.getSymbols())) {
            Log(INFO, `      ${j} = ${JSON.stringify(this.currentScope.getSymbols()[j])}`);
        }
        for(var i=0; i<this.scopes.length; ++i) {
            Log(INFO, `[scope ${i}]`);
            for(var j of Object.keys(this.currentScope.getSymbols())) {
                Log(INFO, `      ${j} = ${JSON.stringify(this.scopes[i].getSymbols()[j])}`);
            }
        }
    }

    printBytecode() {
        const hexString = this.bytecode.map(byte => byte.toString(16).padStart(2, '0')).join(' ');
        Log(INFO, hexString);
    }

}

class VMUtils {

    static splitId(appId) {
        const splitIndex = appId.indexOf('.'); // Find the first occurrence of '.'
        if (splitIndex === -1) {
            return [appId, ""]; // If no '.' is found, return the whole string as the first part
        }
        return [
            appId.substring(0, splitIndex),  // Part before the first '.'
            appId.substring(splitIndex + 1) // Part after the first '.'
        ];
    }

    static bytesToInteger(byteArray) {
        const length = byteArray[0];  // The first byte is the length of the byte sequence
        if (byteArray.length !== length + 1) {
            throw new Error('Invalid byte array length.');
        }
        
        let number = BigInt(0);  // Start with BigInt zero
        
        // Process each byte (starting from the second byte, since the first is the length)
        for (let i = 1; i < byteArray.length; i++) {
            number = number | BigInt(byteArray[i])<<(BigInt(8*(i-1)));  // Shift left by 8 bits and add the current byte
        }
        
        return Number(number);
    }

    static isSimpleType(type) {
        return type < CUSTOMTYPESTART;
    }

    static integerToBytes(number) {
        if (number < 0) {
            throw new Error('Only positive integers are supported.');
        }

        number = BigInt(number);
        
        const bytes = [];
        
        // Convert the number to a byte array (little-endian format)
        while (number > 0n) {  // Use BigInt comparison
            bytes.push(Number(number & 0xFFn));  // Extract the least significant byte
            number >>= 8n;  // Shift the number right by 8 bits to process the next byte
        }
        
        // Add the length of the byte sequence as the first byte
        const lengthByte = bytes.length;
        const result = [lengthByte, ...bytes];  // First byte is the length, then the bytes
        
        return result;
    }

    static bytesToZeroTerminatedString(byteArray) {
        // Find the index of the first zero byte (null terminator)
        const nullTerminatorIndex = byteArray.indexOf(0);
        
        // If there's no zero byte, return an empty string
        if (nullTerminatorIndex === -1) {
          return '';
        }
      
        // Extract the subarray up to the null terminator and decode it as a UTF-8 string
        const stringBytes = byteArray.slice(0, nullTerminatorIndex);
        
        // Convert the byte array to a UTF-8 string
        return Buffer.from(stringBytes).toString('utf-8');
    }

    static stringToZeroTerminatedBytes(str) {
        // Convert the string to a UTF-8 encoded byte array using Buffer
        const bytes = [...Buffer.from(str, 'utf-8')];
        
        // Append the null terminator byte (0x00)
        bytes.push(0);
        
        return Array.from(bytes);  // Convert Buffer to an array of bytes
    }

    static extractNumberByteSlice(byteArray, offset) {
        const length = byteArray[offset];  // The first byte at the offset specifies the length of the integer
        // Return a slice of the array containing the integer bytes
        return byteArray.slice(offset, offset + 1 + length);
    }

    static extractStringSlice(bytes, offset) {
        // Validate the input
        if (!Array.isArray(bytes)) {
          throw new Error("The first argument must be an array of bytes.");
        }
        if (typeof offset !== 'number' || offset < 0 || offset >= bytes.length) {
          throw new Error("Invalid offset.");
        }
      
        // Initialize an empty array to hold the result slice
        let result = [];
      
        // Start at the given offset and extract until a zero byte is encountered
        for (let i = offset; i < bytes.length; i++) {
          result.push(bytes[i]);
          if (bytes[i] === 0) {
            break; // Stop when a zero byte is encountered
          }
        }
      
        return result;
    }

    static getOperandType(op) {

    }
      
    static getOperandSize(op) {
        var size = op&15;
        var type = op-size;
        if (type) {
            switch (size) {
                case 0: return 1;
                case 1: return 1;
                case 2: return 2;
                case 3: return 2;
                case 4: return 4;
                case 5: return 4;
                case 6: return 8;
                case 7: return 8;
                case 8: return 4;
                case 9: return 8;
                default: throw new Error(`Unsupported type: ${type}`);
            }
        }   
        else {
            return 4;
        }
    }

    // Helper: Type enforcement
    static castValue(type, value) {
        switch (type) {
            case UINT8: return Math.max(0, Math.min(255, value & 0xFF));
            case INT8: return Math.max(-128, Math.min(127, value << 24 >> 24));
            case UINT16: return Math.max(0, Math.min(65535, value & 0xFFFF));
            case INT16: return Math.max(-32768, Math.min(32767, value << 16 >> 16));
            case UINT32: return value >>> 0;
            case INT32: return value | 0;
            case UINT64: return BigInt.asUintN(64, BigInt(value));
            case INT64: return BigInt.asIntN(64, BigInt(value));
            case FLOAT32: return Math.fround(value);
            case FLOAT64: return Number(value);
            case STRING: return String(value);
            case BOOLEAN: return Boolean(value);
            default: return null;
        }
    }

    static createOpcodeByte(op) {
        switch(op) {
            case 'add': return 0x01;
            case 'sub': return 0x02;
            case 'mul': return 0x03;
            case 'div': return 0x04;
            case 'exp': return 0x05;
            case 'sin': return 0x06;
            case 'cos': return 0x07;
            case 'tan': return 0x08;
            case 'log': return 0xF0;
        }
    }

    static createDestinationByte(type) {
        if(type=="variable") {
            return 255;
        }
        if(type=="offset") {
            return 1;
        }
    }

    static getParseFunctionByType(vtype) {
        switch(vtype) {
            case 0:
                return VMUtils.bytesToInteger;
            case 1:
                return VMUtils.bytesToInteger;
            case 2:
                return VMUtils.bytesToInteger;
            case 3:
                return VMUtils.bytesToInteger;
            case 4:
                return VMUtils.bytesToInteger;
            case 5:
                return VMUtils.bytesToInteger;
            case 6:
                return VMUtils.bytesToInteger;
            case 7:
                return VMUtils.bytesToInteger;
            case 8:
                return VMUtils.bytesToFloat32;
            case 9:
                return VMUtils.bytesToFloat32;
            case 10:
                return VMUtils.bytesToZeroTerminatedString;
            default:
                return VMUtils.bytesToInteger;
        }
    }

    static bytesToFloat64(byteArray) {
        const length = byteArray[0];  // The first byte is the length (should be 8 for float64)
        
        // Ensure the array contains the expected number of bytes
        if (length !== 8 || byteArray.length !== 9) {
            throw new Error('Invalid byte array length for float64.');
        }
        
        const buffer = Buffer.from(byteArray.slice(1));  // Get the bytes after the size byte
        return buffer.readDoubleLE(0);  // Read the double in little-endian format
    }

    static bytesToFloat32(byteArray) {
        const length = byteArray[0];  // The first byte is the length (should be 4 for float32)
        
        // Ensure the array contains the expected number of bytes
        if (length !== 4 || byteArray.length !== 5) {
            throw new Error('Invalid byte array length for float32.');
        }
        
        const buffer = Buffer.from(byteArray.slice(1));  // Get the bytes after the size byte
        return buffer.readFloatLE(0);  // Read the float in little-endian format
    }

    static float32ToBytes(floatValue) {
        const buffer = Buffer.alloc(4);  // Create a buffer for 4 bytes
        buffer.writeFloatLE(floatValue, 0);  // Write the float in little-endian format
    
        // Return a byte array with the size (4) followed by the byte data
        return [4, ...Array.from(buffer)];
    }

    static float64ToBytes(doubleValue) {
        const buffer = Buffer.alloc(8);  // Create a buffer for 8 bytes
        buffer.writeDoubleLE(doubleValue, 0);  // Write the double in little-endian format
    
        // Return a byte array with the size (8) followed by the byte data
        return [8, ...Array.from(buffer)];
    }
}




















/////////////////////////////////////////////////////////////////////////////////////////////////////
//
/////////////////////////////////////////////////////////////////////////////////////////////////////





// Example usage
const vm = new HorizonLangVM();



// Let's define a person_t type

vm.addBytecode([
    STARTTYPE
    ].concat(VMUtils.stringToZeroTerminatedBytes("person_t"))
);
vm.addBytecode([ // var x:uint8 = 0xFF (#0)
    DEFINEVAR, 
    vm.createSourceByte("", "string")
    ].concat(VMUtils.stringToZeroTerminatedBytes("default_string_value"))
    .concat(VMUtils.stringToZeroTerminatedBytes("name")) // name of the symbol
);
vm.addBytecode([ // var x:uint8 = 0xFF (#0)
    DEFINEVAR, 
    vm.createSourceByte("", "uint32")
    ].concat(VMUtils.float32ToBytes(0.0))
    .concat(VMUtils.stringToZeroTerminatedBytes("age")) // name of the symbol
);
vm.addBytecode([
    ENDTYPE
]);



// Let's create a person_t variable

vm.addBytecode([ // var savior:person_t = { "John Connor", 32 };
    DEFINEVAR, 
    vm.createSourceByte("", 14)
    ]
    .concat(VMUtils.integerToBytes(0)) // initialize to "null"
    .concat(VMUtils.stringToZeroTerminatedBytes("savior")) // name of the symbol
);



// // Print the var

vm.addBytecode([ // Log(savior)
    SYSLOG, 
    VMUtils.createDestinationByte("variable", ""),
    ]
    .concat(VMUtils.integerToBytes(1)));


// Modify the age field




























vm.addBytecode([ // entry {
     STARTFUNC,
     ].concat(VMUtils.stringToZeroTerminatedBytes("add_numbers"))
     .concat([
        vm.createSourceByte("", "float32")
     ])
);
vm.addBytecode([ // var x:uint8 = 0xFF (#0)
    DEFINEPARAM, 
    vm.createSourceByte("", "float32")
    ].concat(VMUtils.float32ToBytes(0.0))
    .concat(VMUtils.stringToZeroTerminatedBytes("a")) // name of the symbol
);
vm.addBytecode([ // var y:float32 = 0.25 (#1)
    DEFINEPARAM, 
    vm.createSourceByte("", "float32")
    ].concat(VMUtils.float32ToBytes(0.0))
    .concat(VMUtils.stringToZeroTerminatedBytes("b"))
);
vm.addBytecode([ // acc=a+b
    ADD, 
    vm.createDestinationByte("accumulator", ""),
    vm.createSourceByte("variable", ""),
    vm.createSourceByte("variable", ""),
    ]
    .concat(VMUtils.integerToBytes(0))
    .concat(VMUtils.integerToBytes(1))
    .concat(VMUtils.integerToBytes(2)));
vm.addBytecode([ // }
    ENDFUNC
    ]
)

vm.addBytecode([ // var x:uint8 = 0xFF (#0)
    DEFINEVAR, 
    vm.createSourceByte("", "float32")
    ].concat(VMUtils.float32ToBytes(0.0))
    .concat(VMUtils.stringToZeroTerminatedBytes("x")) // name of the symbol
);

/*
MAYBE THE BEST WAY TO GO IS TO ASSIGN UNIQUE INCREMENTING IDS
TO VARIABLES ACROSS ALL SCOPES (SO THAT THERE ARE NO TWO '0' VARS,
JUST ONE WHICH MUST BE IN AN ACCESSIBLE SCOPE)
*/
Log(DEBUG, `                    ----------> Accumulator: ${vm.accumulator}`);
vm.addBytecode([
    CALLFUNC,
    ]
    .concat(VMUtils.integerToBytes(0))
    .concat(VMUtils.integerToBytes(2)) // number of parameters
    .concat([
        vm.createSourceByte("", "float32")
    ])
    .concat(
        VMUtils.float32ToBytes(5.1)
    )
    .concat([
        vm.createSourceByte("", "float32")
    ])
    .concat(
        VMUtils.float32ToBytes(8.2)
    )
);
vm.addBytecode([
    CALLFUNC,
    ]
    .concat(VMUtils.integerToBytes(0))
    .concat(VMUtils.integerToBytes(2)) // number of parameters
    .concat([
        vm.createSourceByte("", "float32")
    ])
    .concat(
        VMUtils.float32ToBytes(88.2)
    )
    .concat([
        vm.createSourceByte("", "float32")
    ])
    .concat(
        VMUtils.float32ToBytes(91.88)
    )
);
vm.addBytecode([ // 
    ADD, 
    vm.createDestinationByte("variable", ""),
    vm.createSourceByte("accumulator", ""),
    vm.createSourceByte("constant", "float32"),
    ]
    .concat(VMUtils.integerToBytes(3))
    .concat(VMUtils.integerToBytes(0))
    .concat(VMUtils.float32ToBytes(0.0)));


// vm.addBytecode([ // var y:float32 = 0.25 (#1)
//     DEFINEVAR, 
//     VMUtils.createSourceByte("", "float32")
//     ].concat(VMUtils.float32ToBytes(0.25))
//     .concat(VMUtils.stringToZeroTerminatedBytes("y"))
// );
// vm.addBytecode([ // var salutation:string = "Good day! 🐱" (#2)
//     DEFINEVAR, 
//     VMUtils.createSourceByte("", "string")
//     ].concat(VMUtils.stringToZeroTerminatedBytes("Good day! 🐱"))
//     .concat(VMUtils.stringToZeroTerminatedBytes("salutation"))
// );
// vm.addBytecode([ // y+=2.2
//     ADD, 
//     VMUtils.createDestinationByte("variable", ""),
//     VMUtils.createSourceByte("variable", ""),
//     VMUtils.createSourceByte("constant", "float32"),
//     ]
//     .concat(VMUtils.integerToBytes(1))
//     .concat(VMUtils.integerToBytes(1))
//     .concat(VMUtils.float32ToBytes(2.2)));
// vm.addBytecode([ // Log(y)
//     SYSLOG, 
//     VMUtils.createDestinationByte("variable", ""),
//     ]
//     .concat(VMUtils.integerToBytes(1)));
// vm.addBytecode([ // var z:uint32 = 10 (#3)
//     DEFINEVAR, 
//     VMUtils.createSourceByte("", "uint32"),
//     ].concat(VMUtils.integerToBytes(10))
//     .concat(VMUtils.stringToZeroTerminatedBytes("z"))
// );
// vm.addBytecode([ // loop {
//     STARTLOOP
// ]);
// vm.addBytecode([ // y += 2.0   (#1 += 2.0)
//     ADD, 
//     VMUtils.createDestinationByte("variable", ""),
//     VMUtils.createSourceByte("variable", ""),
//     VMUtils.createSourceByte("constant", "float32"),
//     ]
//     .concat(VMUtils.integerToBytes(1))
//     .concat(VMUtils.integerToBytes(1))
//     .concat(VMUtils.float32ToBytes(2.0)));
// vm.addBytecode([ // console.log(y)
//     SYSLOG, 
//     VMUtils.createDestinationByte("variable", ""),
//     ]
//     .concat(VMUtils.integerToBytes(1)));
// vm.addBytecode([ // z-=1  #3 -= 1
//     SUB, 
//     VMUtils.createDestinationByte("variable", ""),
//     VMUtils.createSourceByte("variable", ""),
//     VMUtils.createSourceByte("constant", "uint8"),
//     ]
//     .concat(VMUtils.integerToBytes(3))
//     .concat(VMUtils.integerToBytes(3))
//     .concat(VMUtils.integerToBytes(1)));
// vm.addBytecode([ // condbreak on #3
//     CONDBREAK,
//     VMUtils.createDestinationByte("variable", ""),
//     0x01,
//     0x03
// ])
// vm.addBytecode([ // }
//     ENDLOOP
// ]);























// A VER, QUE NECESITO AHORA
// PARALLEL FORS?
// 0) QUE LOS RUNTIMES SE DETECTEN LOS UNOS A LOS OTROS
// NO, NECESITO 1) FUNCTION CALL
// 2) MENSAJES Y EVENTOS
// 3) MENSAJES Y EVENTOS CROSS

vm.printBytecode();
console.log(`   resolve person_t: ${vm.getTypeByName("person_t")}`);
console.log(vm.getPC());
vm.step(1);
console.log(vm.getPC());
vm.step(1);
console.log(vm.getPC());
vm.step(1);
console.log(vm.getPC());
vm.step(1);
console.log(`   resolve person_t: ${vm.getTypeByName("person_t")}`);
console.log(vm.getPC());
vm.step(1);
console.log(vm.getPC());
vm.step(1);
// console.log(vm.getPC());
// vm.step(1);
// console.log(vm.getPC());
// vm.step(1);
// console.log(vm.getPC());
// console.log(`\x1b[36mAccumulator: ${vm.getAccumulator()}\x1b[0m`);
// vm.step(1);
// console.log(vm.getPC());
// console.log(`\x1b[36mAccumulator: ${vm.getAccumulator()}\x1b[0m`);
// vm.step(1);
// console.log(vm.getPC());
// vm.step(1);
// console.log(vm.getPC());
// vm.step(1);
// console.log(vm.getPC());
// vm.step(1);
// console.log(vm.getPC());
// vm.step(1);
// console.log(vm.getPC());
// vm.step(1);
// console.log(vm.getPC());
// console.log(`\x1b[36mAccumulator: ${vm.getAccumulator()}\x1b[0m`);
// vm.step(1);
// console.log(vm.getPC());
// vm.step(1);
// console.log(vm.getPC());
// vm.print();
// vm.step(1);
// console.log(vm.getPC());
// vm.step(1);
// console.log(vm.getPC());
// vm.print();
// //console.log(vm.getPC());
// vm.step(1);
// //console.log(vm.getPC());
// //vm.print();
// vm.step(1);
// vm.step(1);