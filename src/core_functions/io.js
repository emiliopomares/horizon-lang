import { HorizonModule } from '../Modules.js'

const system = new HorizonModule();

system_io.addImplicitFunction("log", (msg) => console.log(msg));

module.exports = system_io;