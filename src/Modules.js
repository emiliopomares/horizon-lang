export default class HorizonModule {
    constructor(name, parent, type) {
        this.name = name;
        this.parent = parent;
        this.type = type;
        this.submodules = [];
        this.objects = []
        this.implicitFunctions = {}
    }

    addSubmodule(exp) {
        if (typeof(exp) == "HorizonModule") {
            this.submodules.push(exp);
        }
        else {
            this.objects.push(exp);
        }
    }

    addImplicitFunction(name, func) {
        this.implicitFunctions[name] = func;
    }

    callImplicitFunction(name, args) {
        this.implicitFunctions[name](...args);
    }
}