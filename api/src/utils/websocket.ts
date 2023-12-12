import { log } from "./logging";
import { Server } from 'socket.io';
export var websocket:Server 

export const initWebsocket = (server)=>{
    websocket = new Server(server);
    websocket.on("connection", (socket:any) => {
        log.info('[WEBSOCKET] Websocket connection success...')
    })
}