import { io, Socket } from "socket.io-client"
import { APP_URL } from "./global";
// import store from "../redux";

export let socket:Socket;

console.log("APP_URL", APP_URL);
export const initWebsocket = async() =>{
    // const state = store.store.getState();
    if(socket){
        socket.disconnect();
    }
    socket = io("",
        { 
            path: `${window.location.pathname || "/"}api/socket.io/`,
            // path: "/api/socket.io/", 
            transports: [ 'websocket' ]
        });

}