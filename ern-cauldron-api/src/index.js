import Hapi from 'hapi';
import fs from 'fs';
import register from './routes';
import path from 'path';


const CAULDRONRC_FILE = path.join(process.cwd(), '/.cauldronrc');

let cauldronServerPort = 3000;

console.log(CAULDRONRC_FILE);
let cauldronRc = {};
if (fs.existsSync(CAULDRONRC_FILE)) {
    cauldronRc = JSON.parse(fs.readFileSync(CAULDRONRC_FILE));
    if (cauldronRc && cauldronRc.port) {
        cauldronServerPort = cauldronRc.port;
    }
}

const server = new Hapi.Server();

server.connection({
    port: cauldronServerPort
});

server.register({
    register,
     options: cauldronRc.options
}, (err) => {
    if (err) {
        console.error('Failed to load plugin:', err);
    }
});

server.start((e) => {
    console.log(`Cauldron server running at: ${server.info.uri}`);
});

export default server;
