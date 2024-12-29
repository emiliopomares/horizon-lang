import { HorizonModule } from '../Modules.js';
import { io } from './io.js';

const system = new HorizonModule();

system.addSubmodule("IO", io);

module.exports = system_io;