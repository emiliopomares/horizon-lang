// discovery-server.js

// Import required modules
import http from 'http';
import dgram from 'dgram';
import os from 'os';

// Configuration
const PSK = "ErZhDTpSiMFVXbkyCb1Q3a7wIe0I8quo";
const PORT = 3000; // HTTP Server Port
const MULTICAST_ADDRESS = '239.1.1.1'; // Multicast address
const DISCOVERY_PORT = 4321; // UDP Port for discovery messages
const DISCOVERY_INTERVAL = 5000; // Interval to broadcast presence (ms)

class PoolMember {
    constructor(remoteIPAddress) {
        this.remoteIPAddress = remoteIPAddress;
    }
}

let poolMembers = [];

function alreadyDiscovered(addr) {
    for (var m of poolMembers) {
        if (m.remoteIPAddress == addr) {
            return true;
        }
    }
    return false;
}

// Helper function to get the local IP address
function getLocalIPAddress() {
    const interfaces = os.networkInterfaces();
    for (const iface of Object.values(interfaces)) {
        for (const config of iface) {
            if (config.family === 'IPv4' && !config.internal) {
                return config.address;
            }
        }
    }
    return '127.0.0.1';
}

const localIP = getLocalIPAddress();

// Function to start the discovery server
function startServer(cb=null) {
    // Step 1: Set up an HTTP REST server
    const server = http.createServer((req, res) => {
        if (req.method === 'GET' && req.url === '/') {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'Server is running', ip: localIP, port: PORT }));
        } else if (req.method === 'POST' && req.url === '/app') {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'Accepting app', ip: localIP, port: PORT }));
        } else {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'Not Found' }));
        }
    });

    server.listen(PORT, () => {
        console.log(`HTTP server is listening on http://${localIP}:${PORT}`);
    });

    // Step 2: Set up UDP discovery mechanism
    const udpSocket = dgram.createSocket('udp4');

    // Listen for incoming UDP messages
    udpSocket.on('message', (msg, rinfo) => {
        if (rinfo.address !== localIP) {
            console.log(`Discovered server: ${rinfo.address}:${rinfo.port} - ${msg}, local address: ${localIP}`);
            const newMember = new PoolMember(rinfo.address);
            if (!alreadyDiscovered(rinfo.address)) {
                console.log(` ===> New member discovered, adding... `);
                poolMembers.push(newMember);
                if (cb) {
                    cb(newMember);
                }
            }
        }
    });

    // Start listening on the discovery port
    udpSocket.bind(DISCOVERY_PORT, () => {
        console.log(`UDP discovery listening on port ${DISCOVERY_PORT}`);
        udpSocket.addMembership(MULTICAST_ADDRESS); // Join multicast group
    });

    // Broadcast this server's presence periodically
    setInterval(() => {
        const message = Buffer.from(`Server at ${localIP}:${PORT}`);
        udpSocket.send(message, 0, message.length, DISCOVERY_PORT, MULTICAST_ADDRESS, (err) => {
            if (err) console.error('Error sending discovery message:', err);
        });
    }, DISCOVERY_INTERVAL);
}

// Export the startServer function and configurations (if needed)
export { startServer, PoolMember, poolMembers };


// // Import required modules
// import http from 'http';
// import dgram from 'dgram';
// import os from 'os';

// const PSK = "ErZhDTpSiMFVXbkyCb1Q3a7wIe0I8quo";

// // Configuration
// const PORT = 3000; // HTTP Server Port
// const MULTICAST_ADDRESS = '239.1.1.1'; // Multicast address
// const DISCOVERY_PORT = 4321; // UDP Port for discovery messages
// const DISCOVERY_INTERVAL = 5000; // Interval to broadcast presence (ms)

// class PoolMember {
//     constructor(remoteIPAdress) {
//         this.remoteIPAdress = remoteIPAdress;
//     }
// }

// var poolMembers = [];

// // Helper function to get the local IP address
// function getLocalIPAddress() {
//   const interfaces = os.networkInterfaces();
//   for (const iface of Object.values(interfaces)) {
//     for (const config of iface) {
//       if (config.family === 'IPv4' && !config.internal) {
//         return config.address;
//       }
//     }
//   }
//   return '127.0.0.1';
// }

// const localIP = getLocalIPAddress();

// // Step 1: Set up an HTTP REST server
// const server = http.createServer((req, res) => {
//   if (req.method === 'GET' && req.url === '/') {
//     res.writeHead(200, { 'Content-Type': 'application/json' });
//     res.end(JSON.stringify({ message: 'Server is running', ip: localIP, port: PORT }));
//   } else if(req.method === 'POST' && req.url === '/app') {
//     res.writeHead(200, { 'Content-Type': 'application/json' });
//     res.end(JSON.stringify({ message: 'Accepting app', ip: localIP, port: PORT }));
//   } else {
//     res.writeHead(404, { 'Content-Type': 'application/json' });
//     res.end(JSON.stringify({ message: 'Not Found' }));
//   }
// });

// server.listen(PORT, () => {
//   console.log(`HTTP server is listening on http://${localIP}:${PORT}`);
// });

// // Step 2: Set up UDP discovery mechanism
// const udpSocket = dgram.createSocket('udp4');

// // Listen for incoming UDP messages
// udpSocket.on('message', (msg, rinfo) => {
//     if (rinfo.address != getLocalIPAddress()) {
//         console.log(`Discovered server: ${rinfo.address}:${rinfo.port} - ${msg}, local address: ${getLocalIPAddress()}`);
//     } else {
//         poolMembers = new PoolMember(rinfo.address);
//     }
// });

// // Start listening on the discovery port
// udpSocket.bind(DISCOVERY_PORT, () => {
//   console.log(`UDP discovery listening on port ${DISCOVERY_PORT}`);
//   udpSocket.addMembership(MULTICAST_ADDRESS); // Join multicast group
// });

// // Broadcast this server's presence periodically
// setInterval(() => {
//   const message = Buffer.from(`Server at ${localIP}:${PORT}`);
//   udpSocket.send(message, 0, message.length, DISCOVERY_PORT, MULTICAST_ADDRESS, (err) => {
//     if (err) console.error('Error sending discovery message:', err);
//   });
// }, DISCOVERY_INTERVAL);


